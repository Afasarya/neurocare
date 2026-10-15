import { createServerSupabaseClient } from "@/lib/supabase/server";
import { progressRangeSchema } from "@/features/recovery-progress/progress.contract";
import { createProgressFixture, type ProgressDemoScenario } from "@/features/recovery-progress/server/progress-fixture";
import { loadRecoveryProgress } from "@/features/recovery-progress/server/progress-service";
import { recoveryApiError, recoveryResponseHeaders } from "@/features/recovery/server/recovery-api";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const parsedRange = progressRangeSchema.safeParse(url.searchParams.get("range") ?? "90d");
  if (!parsedRange.success) return recoveryApiError(400, requestId, "INVALID_RANGE", "Rentang waktu tidak valid.");

  const demo = request.headers.get("x-neurocare-progress-demo") === "progress-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    return Response.json(createProgressFixture(parseScenario(url.searchParams.get("scenario")), parsedRange.data, requestId), { headers: recoveryResponseHeaders });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return recoveryApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return recoveryApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat progress.");

  return Response.json(await loadRecoveryProgress(supabase, data.user.id, parsedRange.data, requestId), { headers: recoveryResponseHeaders });
}

function parseScenario(value: string | null): ProgressDemoScenario {
  return value === "one" || value === "empty" || value === "no-baseline" || value === "sparse" || value === "with-activity" || value === "unavailable"
    ? value
    : "multiple";
}
