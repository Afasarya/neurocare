import { createServerSupabaseClient } from "@/lib/supabase/server";
import { screeningServerSchema } from "@/features/screening/screening.server-schema";
import { createSafeScreeningFixture } from "@/features/screening/server/screening-fixture";
import { analyzeWithScreeningEngine } from "@/features/screening/server/screening-engine";

const MAX_BODY_BYTES = 16 * 1024;
const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  const fallbackRequestId = crypto.randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return apiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload terlalu besar.");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return apiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload terlalu besar.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");
  }

  const parsed = screeningServerSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(400, fallbackRequestId, "INVALID_INPUT", "Data skrining belum valid atau belum lengkap.");
  }

  if (parsed.data.emergencySymptoms === "yes") {
    return Response.json(createSafeScreeningFixture(parsed.data), {
      status: 200,
      headers: responseHeaders,
    });
  }

  const isDevelopmentDemo =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-neurocare-demo") === "screening-fixture-v1";

  if (isDevelopmentDemo) {
    return Response.json(createSafeScreeningFixture(parsed.data), {
      status: 200,
      headers: responseHeaders,
    });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError(
      503,
      parsed.data.requestId,
      "AUTH_NOT_CONFIGURED",
      "Autentikasi belum dikonfigurasi. Data tidak dikirim atau disimpan.",
      false,
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return apiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum mengirim skrining.");
  }

  const result = await analyzeWithScreeningEngine(parsed.data);
  return Response.json(result, { status: 200, headers: responseHeaders });
}

function apiError(
  status: number,
  requestId: string,
  code: string,
  message: string,
  retryable?: boolean,
) {
  return Response.json(
    { error: { code, message, ...(retryable === undefined ? {} : { retryable }) }, meta: { requestId } },
    { status, headers: responseHeaders },
  );
}
