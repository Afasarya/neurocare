import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  screeningGapsResponseSchema,
  type GapDemoScenario,
  type ScreeningGapsResponse,
} from "@/features/screening-gaps/screening-gap.contract";
import { createScreeningGapFixture } from "@/features/screening-gaps/server/screening-gap-fixture";

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

  return validatedResponse({
    data: {
      status: "unavailable",
      reason: "source_data_unavailable",
      retryable: false,
      message:
        "Data F01/F08 dan deterministic gap engine belum terhubung. Tidak ada saran personal yang dibuat.",
    },
    meta: {
      requestId,
      generatedAt: new Date().toISOString(),
      demo: false,
    },
  });
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
