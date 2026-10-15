import type { TimelineResponse } from "@/features/health-records/health-records.contract";
import { createTimelineFixture, type TimelineDemoScenario } from "@/features/health-records/server/health-records-fixture";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { HealthRecordsStorageError, listTimelineEvents } from "@/features/health-records/server/health-records-repository";

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

  try {
    const events = await listTimelineEvents(auth.supabase, auth.user.id);
    const response: TimelineResponse = events.length === 0
      ? { data: { status: "empty", message: "Belum ada pengukuran atau rencana yang tersimpan." }, meta: unavailableMeta(requestId) }
      : { data: { status: "ok", events, lastUpdatedAt: events[0].occurredAt }, meta: unavailableMeta(requestId) };
    return Response.json(response, { headers: privateHealthHeaders });
  } catch (error) {
    const storageKind = error instanceof HealthRecordsStorageError ? error.kind : "service_error";
    const reason = storageKind === "not_found" ? "service_error" : storageKind;
    const response: TimelineResponse = {
      data: { status: "unavailable", reason, retryable: reason === "service_error", message: reason === "storage_not_configured" ? "Penyimpanan timeline belum tersedia. Terapkan migration database NeuroCare terlebih dahulu." : "Timeline belum dapat dimuat. Periksa koneksi lalu coba lagi." },
      meta: unavailableMeta(requestId),
    };
    return Response.json(response, { headers: privateHealthHeaders });
  }
}
