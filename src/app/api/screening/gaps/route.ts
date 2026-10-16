import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  screeningGapsResponseSchema,
  type GapDemoScenario,
  type ScreeningGapsResponse,
} from "@/features/screening-gaps/screening-gap.contract";
import { createScreeningGapFixture } from "@/features/screening-gaps/server/screening-gap-fixture";
import { analyzeScreeningGaps, loadLatestGapSource } from "@/features/screening-gaps/server/screening-gap-service";
import { hasActiveExternalAiConsent } from "@/features/insights/server/external-ai-consent";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

const demoScenarios = new Set<GapDemoScenario>([
  "unknown-bp",
  "empty",
  "completed",
  "pending",
  "unavailable",
]);

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const requestedScenario = url.searchParams.get("scenario") ?? "unknown-bp";
  const isDevelopmentDemo =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-neurocare-demo") === "screening-gap-fixture-v1";

  if (isDevelopmentDemo) {
    if (!demoScenarios.has(requestedScenario as GapDemoScenario)) {
      return apiError(400, requestId, "INVALID_SCENARIO", "Skenario demo tidak valid.");
    }
    return validatedResponse(
      createScreeningGapFixture(requestedScenario as GapDemoScenario, requestId),
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError(
      503,
      requestId,
      "AUTH_NOT_CONFIGURED",
      "Autentikasi belum dikonfigurasi. Data gap tidak dapat dibaca.",
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return apiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat gap pemeriksaan.");
  }

  if (!(await hasActiveExternalAiConsent(supabase, data.user.id))) {
    return validatedResponse({ data: { status: "unavailable", reason: "consent_required", retryable: false, message: "Persetujuan AI eksternal belum aktif. Data tidak dikirim ke layanan gap." }, meta: { requestId, generatedAt: new Date().toISOString(), demo: false } });
  }

  const source = await loadLatestGapSource(supabase, data.user.id);
  if (!source) {
    return validatedResponse({ data: { status: "empty", message: "Belum ada skrining tersimpan untuk mengevaluasi gap." }, meta: { requestId, generatedAt: new Date().toISOString(), demo: false } });
  }

  const result = await analyzeScreeningGaps(source, requestId);
  if (result.data.status === "ok") {
    const okData = result.data;
    const admin = createAdminSupabaseClient();
    if (!admin) return apiError(503, requestId, "PERSISTENCE_NOT_CONFIGURED", "Gap tervalidasi belum dapat disimpan.");

    const { error: staleError } = await admin.from("screening_gaps")
      .update({ is_stale: true })
      .eq("user_id", data.user.id)
      .eq("screening_session_id", source.sessionId);
    if (staleError) return apiError(503, requestId, "PERSISTENCE_FAILED", "Gap belum dapat disimpan.");

    const rows = okData.gaps.map((gap) => ({
      user_id: data.user.id,
      screening_session_id: source.sessionId,
      gap_type: gap.type,
      status: gap.status,
      title: gap.title,
      reason: gap.reason,
      related_measurement: gap.relatedMeasurement,
      supporting_fact_label: gap.supportingFact.label,
      supporting_fact_recorded_at: gap.supportingFact.recordedAt,
      applicability: gap.applicability,
      is_stale: gap.stale,
      rule_source_label: okData.ruleSource.label,
      rule_version: okData.ruleSource.version,
      evaluated_at: okData.evaluatedAt,
      action_key: gap.nextActions.find((action) => action.kind === "add_action_plan")?.id ?? gap.id,
    }));
    const { error: storeError } = await admin.from("screening_gaps").upsert(rows, { onConflict: "screening_session_id,action_key" });
    if (storeError) return apiError(503, requestId, "PERSISTENCE_FAILED", "Gap belum dapat disimpan.");
  }

  return validatedResponse(result);
}

function validatedResponse(payload: ScreeningGapsResponse) {
  const parsed = screeningGapsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      502,
      crypto.randomUUID(),
      "INVALID_GAP_RESPONSE",
      "Respons gap tidak valid. Tidak ada saran yang ditampilkan.",
    );
  }
  return Response.json(parsed.data, { status: 200, headers: responseHeaders });
}

function apiError(status: number, requestId: string, code: string, message: string) {
  return Response.json(
    { error: { code, message }, meta: { requestId } },
    { status, headers: responseHeaders },
  );
}
