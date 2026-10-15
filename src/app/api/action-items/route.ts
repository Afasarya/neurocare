import type { ActionItemsResponse } from "@/features/health-records/health-records.contract";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { createActionItemsFixture, type ActionDemoScenario } from "@/features/health-records/server/health-records-fixture";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const demo = request.headers.get("x-neurocare-records-demo") === "health-records-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    const requested = new URL(request.url).searchParams.get("scenario");
    const scenario: ActionDemoScenario = requested === "empty" || requested === "unavailable" ? requested : "baseline";
    return Response.json(createActionItemsFixture(scenario, requestId), { headers: privateHealthHeaders });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat rencana.");

  const response: ActionItemsResponse = {
    data: { status: "unavailable", reason: "schema_not_approved", retryable: false, message: "Schema action item, deduplikasi, retention, dan RLS belum disetujui." },
    meta: unavailableMeta(requestId),
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
