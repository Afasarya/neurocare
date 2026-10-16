import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { screeningAnalyzeResponseSchema } from "@/features/screening/screening.contract";
import { screeningServerSchema } from "@/features/screening/screening.server-schema";
import { createSafeScreeningFixture } from "@/features/screening/server/screening-fixture";
import { analyzeWithScreeningEngine } from "@/features/screening/server/screening-engine";
import { hasActiveExternalAiConsent } from "@/features/insights/server/external-ai-consent";

const MAX_BODY_BYTES = 16 * 1024;
export const maxDuration = 60;
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
    process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true" &&
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

  // Persetujuan AI eksternal tidak lagi menjadi syarat (keputusan produk).
  void hasActiveExternalAiConsent;
  const result = await analyzeWithScreeningEngine(parsed.data, true);
  const okResult = result.data.status === "ok" ? result.data : null;

  const admin = createAdminSupabaseClient();
  if (okResult && !admin) {
    // Penyimpanan belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY): tetap tampilkan hasil agar pengguna mendapat output.
    return Response.json(result, { status: 200, headers: responseHeaders });
  }

  if (admin) {
    const { data: storedSession, error: storageError } = await admin
      .from("screening_sessions")
      .upsert({
      user_id: data.user.id,
      operation_id: parsed.data.requestId,
      pathway: "neuroprevent",
      input_snapshot: parsed.data,
      safety_status: "clear",
      result_status: result.data.status,
      risk_scope: okResult ? "cvd_10y" : null,
      result_snapshot: result.data,
      source_name: okResult?.source.name ?? null,
      source_region: okResult?.source.region ?? null,
      source_version: okResult?.source.version ?? null,
      engine_version: okResult?.source.engineVersion ?? null,
      completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,operation_id" })
      .select("id")
      .single();

    if (storageError || !storedSession) {
      return apiError(
        503,
        parsed.data.requestId,
        "PERSISTENCE_FAILED",
        "Hasil belum dapat disimpan. Silakan coba lagi tanpa mengubah data.",
        true,
      );
    }

    if (okResult) {
      return Response.json(
        screeningAnalyzeResponseSchema.parse({
          ...result,
          data: { ...okResult, recordId: storedSession.id },
        }),
        { status: 200, headers: responseHeaders },
      );
    }
  }

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
