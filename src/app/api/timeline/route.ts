import type { TimelineResponse } from "@/features/health-records/health-records.contract";
import { createTimelineFixture, type TimelineDemoScenario } from "@/features/health-records/server/health-records-fixture";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, unavailableMeta } from "@/features/health-records/server/health-records-api";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const demo = request.headers.get("x-neurocare-records-demo") === "health-records-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    const requested = new URL(request.url).searchParams.get("scenario");
    const scenario: TimelineDemoScenario = requested === "empty" || requested === "unavailable" ? requested : "baseline";
    return Response.json(createTimelineFixture(scenario, requestId), { headers: privateHealthHeaders });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat timeline.");

  const response: TimelineResponse = {
    data: { status: "unavailable", reason: "schema_not_approved", retryable: false, message: "Schema timeline dan kebijakan RLS belum disetujui. Tidak ada data pribadi yang dibaca." },
    meta: unavailableMeta(requestId),
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
