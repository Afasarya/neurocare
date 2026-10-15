import {
  CAREGIVER_DEMO_HEADER,
  caregiverInvitationRequestSchema,
  type CaregiverInvitationResponse,
} from "@/features/caregiver/caregiver.contract";
import { isCaregiverFeatureEnabled } from "@/features/caregiver/caregiver.flags";
import { createCaregiverInvitationFixture } from "@/features/caregiver/server/caregiver-fixture";
import {
  authenticatedHealthUser,
  healthApiError,
  privateHealthHeaders,
  readHealthJson,
} from "@/features/health-records/server/health-records-api";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!isCaregiverFeatureEnabled()) {
    return healthApiError(404, requestId, "FEATURE_DISABLED", "Fitur caregiver belum diaktifkan.");
  }

  const payload = await readHealthJson(request, 8 * 1024);
  if (payload === "too_large") return healthApiError(413, requestId, "PAYLOAD_TOO_LARGE", "Data undangan terlalu besar.");
  if (payload === "invalid_json") return healthApiError(400, requestId, "INVALID_JSON", "Format permintaan tidak valid.");

  const parsed = caregiverInvitationRequestSchema.safeParse(payload);
  if (!parsed.success) return healthApiError(400, requestId, "INVALID_INPUT", "Data undangan belum valid atau lengkap.");

  const isDemoRequest =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-neurocare-caregiver-demo") === CAREGIVER_DEMO_HEADER;
  if (isDemoRequest) {
    return Response.json(createCaregiverInvitationFixture(parsed.data), { headers: privateHealthHeaders });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") return healthApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (auth.status === "unauthenticated") return healthApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk untuk mengatur akses caregiver.");

  const response: CaregiverInvitationResponse = {
    data: {
      status: "unavailable",
      reason: "policy_pending",
      retryable: false,
      message: "Undangan caregiver menunggu kebijakan consent, verifikasi penerima, ACL, audit trail, dan RLS. Tidak ada akses yang dibuat.",
    },
    meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
