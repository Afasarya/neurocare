import { healthMeasurementCreateSchema, type MeasurementCreateResponse } from "@/features/health-records/health-records.contract";
import { isMeasuredAtAllowed } from "@/features/health-records/health-records.selectors";
import { authenticatedHealthUser, healthApiError, privateHealthHeaders, readHealthJson, unavailableMeta } from "@/features/health-records/server/health-records-api";
import { createMeasurementFixture } from "@/features/health-records/server/health-records-fixture";

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

  const response: MeasurementCreateResponse = {
    data: { status: "unavailable", reason: "schema_not_approved", retryable: false, message: "Schema pengukuran, rentang validasi, retention, dan RLS belum disetujui. Tidak ada data yang disimpan." },
    meta: unavailableMeta(parsed.data.requestId),
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
