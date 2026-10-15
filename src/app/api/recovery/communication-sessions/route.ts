import {
  COMMUNICATION_REHAB_DEMO_HEADER,
  communicationSessionCreateSchema,
  type CommunicationSessionResponse,
} from "@/features/communication-rehab/communication-rehab.contract";
import { isCommunicationRehabEnabled } from "@/features/communication-rehab/communication-rehab.flags";
import { createCommunicationSessionFixture } from "@/features/communication-rehab/server/communication-fixture";
import {
  authenticatedHealthUser,
  healthApiError,
  privateHealthHeaders,
  readHealthJson,
} from "@/features/health-records/server/health-records-api";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!isCommunicationRehabEnabled()) {
    return healthApiError(404, requestId, "FEATURE_DISABLED", "Fitur latihan komunikasi belum diaktifkan.");
  }

  const payload = await readHealthJson(request, 8 * 1024);
  if (payload === "too_large") {
    return healthApiError(413, requestId, "PAYLOAD_TOO_LARGE", "Catatan sesi terlalu besar.");
  }
  if (payload === "invalid_json") {
    return healthApiError(400, requestId, "INVALID_JSON", "Format permintaan tidak valid.");
  }

  const parsed = communicationSessionCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return healthApiError(400, requestId, "INVALID_INPUT", "Data sesi belum valid atau lengkap.");
  }

  const isDemoRequest =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-neurocare-communication-demo") === COMMUNICATION_REHAB_DEMO_HEADER;

  if (isDemoRequest) {
    return Response.json(createCommunicationSessionFixture(parsed.data), {
      headers: privateHealthHeaders,
    });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") {
    return healthApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  }
  if (auth.status === "unauthenticated") {
    return healthApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum menyimpan sesi.");
  }

  const response: CommunicationSessionResponse = {
    data: {
      status: "unavailable",
      reason: "review_pending",
      retryable: false,
      message: "Penyimpanan F09 menunggu review ahli, persetujuan privasi, skema, dan RLS. Tidak ada data yang disimpan.",
    },
    meta: {
      requestId: parsed.data.requestId,
      generatedAt: new Date().toISOString(),
      demo: false,
    },
  };

  return Response.json(response, { headers: privateHealthHeaders });
}
