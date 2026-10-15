import {
  CAREGIVER_DEMO_HEADER,
  reminderPreferenceCreateSchema,
  type ReminderPreferenceResponse,
} from "@/features/caregiver/caregiver.contract";
import { isCaregiverFeatureEnabled } from "@/features/caregiver/caregiver.flags";
import { createReminderPreferenceFixture } from "@/features/caregiver/server/caregiver-fixture";
import {
  authenticatedHealthUser,
  healthApiError,
  privateHealthHeaders,
  readHealthJson,
} from "@/features/health-records/server/health-records-api";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!isCaregiverFeatureEnabled()) {
    return healthApiError(404, requestId, "FEATURE_DISABLED", "Fitur pengingat belum diaktifkan.");
  }

  const payload = await readHealthJson(request, 8 * 1024);
  if (payload === "too_large") return healthApiError(413, requestId, "PAYLOAD_TOO_LARGE", "Preferensi pengingat terlalu besar.");
  if (payload === "invalid_json") return healthApiError(400, requestId, "INVALID_JSON", "Format permintaan tidak valid.");

  const parsed = reminderPreferenceCreateSchema.safeParse(payload);
  if (!parsed.success) return healthApiError(400, requestId, "INVALID_INPUT", "Preferensi pengingat belum valid atau lengkap.");

  const isDemoRequest =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-neurocare-caregiver-demo") === CAREGIVER_DEMO_HEADER;
  if (isDemoRequest) {
    return Response.json(createReminderPreferenceFixture(parsed.data), { headers: privateHealthHeaders });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk untuk mengatur pengingat.");

  const response: ReminderPreferenceResponse = {
    data: {
      status: "unavailable",
      reason: "provider_not_approved",
      retryable: false,
      message: "Pengingat menunggu provider, scheduler, consent, schema, dan RLS yang disetujui. Tidak ada pengingat yang dijadwalkan.",
    },
    meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
