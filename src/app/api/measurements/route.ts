import { healthMeasurementCreateSchema, type MeasurementCreateResponse } from "@/features/health-records/health-records.contract";
import { isMeasuredAtAllowed } from "@/features/health-records/health-records.selectors";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, readHealthJson, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { createMeasurementFixture } from "@/features/health-records/server/health-records-fixture";
import { HealthRecordsStorageError, saveHealthMeasurement } from "@/features/health-records/server/health-records-repository";

export async function POST(request: Request) {
  const fallbackRequestId = crypto.randomUUID();
  const payload = await readHealthJson(request);
  if (payload === "too_large") return healthApiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload pengukuran terlalu besar.");
  if (payload === "invalid_json") return healthApiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");
  const parsed = healthMeasurementCreateSchema.safeParse(payload);
  if (!parsed.success) return healthApiError(400, fallbackRequestId, "INVALID_INPUT", "Nilai, satuan, atau waktu pengukuran tidak valid.");
  if (!isMeasuredAtAllowed(parsed.data.measuredAt, new Date())) return healthApiError(400, parsed.data.requestId, "FUTURE_MEASUREMENT", "Waktu pengukuran tidak boleh berada di masa depan.");

  const demo = request.headers.get("x-neurocare-records-demo") === "health-records-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) return Response.json(createMeasurementFixture(parsed.data), { headers: privateHealthHeaders });

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum menyimpan pengukuran.");

  try {
    const measurement = await saveHealthMeasurement(auth.supabase, auth.user.id, parsed.data);
    const response: MeasurementCreateResponse = {
      data: { status: "saved", measurement },
      meta: { ...unavailableMeta(parsed.data.requestId), demo: false },
    };
    return Response.json(response, { headers: privateHealthHeaders });
  } catch (error) {
    const storageKind = error instanceof HealthRecordsStorageError ? error.kind : "service_error";
    const reason = storageKind === "not_found" ? "service_error" : storageKind;
    const response: MeasurementCreateResponse = {
      data: { status: "unavailable", reason, retryable: reason === "service_error", message: reason === "storage_not_configured" ? "Penyimpanan belum tersedia. Terapkan migration database NeuroCare terlebih dahulu." : "Pengukuran belum dapat disimpan. Periksa koneksi lalu coba lagi." },
      meta: unavailableMeta(parsed.data.requestId),
    };
    return Response.json(response, { headers: privateHealthHeaders });
  }
}
