import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  healthInsightRequestSchema,
  type HealthInsightRequest,
  type HealthInsightResponse,
} from "@/features/insights/health-insight.contract";
import { generateHealthInsight } from "@/features/insights/server/insight-engine";
import {
  createHealthInsightFixture,
  type InsightDemoScenario,
} from "@/features/insights/server/insight-fixture";
import { consumeInsightQuota } from "@/features/insights/server/rate-limit";
import { resolveHealthInsight } from "@/features/insights/server/insight-service";
import { hasActiveExternalAiConsent } from "@/features/insights/server/external-ai-consent";
import { loadHealthInsightGatewayRequest } from "@/features/insights/server/health-insight-source";
import { persistHealthInsight } from "@/features/insights/server/insight-persistence";

const MAX_BODY_BYTES = 24 * 1024;
const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  const fallbackRequestId = crypto.randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return apiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload insight terlalu besar.");
  }

  const rawBody = await readBoundedBody(request);
  if (rawBody === null) {
    return apiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload insight terlalu besar.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");
  }

  const parsed = healthInsightRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(400, fallbackRequestId, "INVALID_INPUT", "Data sumber insight tidak valid.");
  }

  const demoScenario = request.headers.get("x-neurocare-insight-demo");
  const isDevelopmentDemo =
    process.env.NODE_ENV !== "production" &&
    (demoScenario === "approved" || demoScenario === "unavailable");
  if (isDevelopmentDemo) {
    const result = await resolveHealthInsight(parsed.data, async (input) =>
      createHealthInsightFixture(demoScenario as InsightDemoScenario, input),
    );
    return Response.json(result, { status: 200, headers: responseHeaders });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return apiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum membuat insight.");
  }

  // The request body is never an authorization grant. The latest stored
  // append-only consent event is authoritative, so withdrawal blocks the very
  // next request even if a stale browser still submits `true`.
  const hasStoredConsent = await hasActiveExternalAiConsent(supabase, data.user.id);
  const consentedInput = {
    ...parsed.data,
    consentToExternalAi: parsed.data.consentToExternalAi && hasStoredConsent,
  };

  const result = await resolveHealthInsight(consentedInput, async (input) => {
    const quota = consumeInsightQuota(data.user.id);
    if (!quota.allowed) return rateLimited(input, quota.retryAfterSeconds);
    const gatewayRequest = await loadHealthInsightGatewayRequest(
      supabase,
      data.user.id,
      input.source.screeningSessionId,
    );
    if (!gatewayRequest) return sourceNotAvailable(input);
    return generateHealthInsight(input, gatewayRequest);
  });
  const persistence = await persistHealthInsight(data.user.id, result);
  if (persistence === "not_configured") return persistenceUnavailable(consentedInput, "persistence_not_configured", false);
  if (persistence === "error") return persistenceUnavailable(consentedInput, "persistence_error", true);
  return Response.json(result, { status: 200, headers: responseHeaders });
}

function sourceNotAvailable(input: HealthInsightRequest): HealthInsightResponse {
  return {
    data: {
      status: "unavailable",
      reason: "source_not_available",
      retryable: false,
      message: "Sumber skrining tervalidasi tidak ditemukan atau belum lengkap. Tidak ada data yang dikirim ke AI.",
    },
    meta: { requestId: input.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}

function persistenceUnavailable(
  input: HealthInsightRequest,
  reason: "persistence_not_configured" | "persistence_error",
  retryable: boolean,
) {
  return Response.json({
    data: {
      status: "unavailable",
      reason,
      retryable,
      message: "Insight belum dapat disimpan. Tidak ada konfirmasi penyimpanan yang dibuat.",
    },
    meta: { requestId: input.requestId, generatedAt: new Date().toISOString(), demo: false },
  } satisfies HealthInsightResponse, { status: 503, headers: responseHeaders });
}

function rateLimited(input: HealthInsightRequest, retryAfterSeconds: number): HealthInsightResponse {
  return {
    data: {
      status: "unavailable",
      reason: "rate_limited",
      retryable: true,
      message: `Batas permintaan tercapai. Coba lagi setelah sekitar ${retryAfterSeconds} detik.`,
    },
    meta: { requestId: input.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function apiError(status: number, requestId: string, code: string, message: string) {
  return Response.json(
    { error: { code, message }, meta: { requestId } },
    { status, headers: responseHeaders },
  );
}

