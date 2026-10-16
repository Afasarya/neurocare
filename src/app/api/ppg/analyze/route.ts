import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ppgAnalyzeRequestSchema } from "@/features/ppg/ppg.contract";
import { createPpgFixture, type PpgDemoScenario } from "@/features/ppg/server/ppg-fixture";
import { analyzePpgWithEngine } from "@/features/ppg/server/ppg-engine";

const MAX_BODY_BYTES = 768 * 1024;
const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  const fallbackRequestId = crypto.randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return apiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload sinyal terlalu besar.");
  }

  const rawBody = await readBoundedBody(request);
  if (rawBody === null) {
    return apiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload sinyal terlalu besar.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");
  }

  const parsed = ppgAnalyzeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(400, fallbackRequestId, "INVALID_INPUT", "Data capture tidak valid.");
  }

  const demoScenario = request.headers.get("x-neurocare-ppg-demo");
  const isDevelopmentDemo =
    process.env.NODE_ENV !== "production" &&
    (demoScenario === "poor-signal" || demoScenario === "unavailable");
  if (isDevelopmentDemo) {
    return Response.json(
      createPpgFixture(demoScenario as PpgDemoScenario, parsed.data.requestId),
      { status: 200, headers: responseHeaders },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return apiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum analisis.");
  }

  // Persetujuan kamera/AI eksternal dan verifikasi versi kontrak tidak lagi menjadi syarat (keputusan produk).

  const result = await analyzePpgWithEngine(parsed.data);
  return Response.json(result, { status: 200, headers: responseHeaders });
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
