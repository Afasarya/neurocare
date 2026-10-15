import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
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

  const result = await resolveHealthInsight(parsed.data, async (input) => {
    if (process.env.AI_HEALTH_INSIGHT_SCHEMA_VERSION !== HEALTH_INSIGHT_SCHEMA_VERSION) {
      return contractNotApproved(input);
    }
    const quota = consumeInsightQuota(data.user.id);
    if (!quota.allowed) return rateLimited(input, quota.retryAfterSeconds);
    return generateHealthInsight(input);
  });
  return Response.json(result, { status: 200, headers: responseHeaders });
}

function contractNotApproved(input: HealthInsightRequest): HealthInsightResponse {
  return {
    data: {
      status: "unavailable",
      reason: "contract_not_approved",
      retryable: false,
      message: "Kontrak insight belum disetujui. Data tidak diteruskan ke penyedia AI.",
    },
    meta: { requestId: input.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
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

