import {
  COGNITIVE_ACTIVITY_DEMO_HEADER,
  cognitiveActivitySessionCreateSchema,
  type CognitiveActivitySessionResponse,
} from "@/features/cognitive-activities/cognitive-activity.contract";
import { isCognitiveActivityEnabled } from "@/features/cognitive-activities/cognitive-activity.flags";
import { createCognitiveActivityFixture } from "@/features/cognitive-activities/server/cognitive-activity-fixture";
import {
  authenticatedHealthUser,
  healthApiError,
  privateHealthHeaders,
  readHealthJson,
} from "@/features/health-records/server/health-records-api";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!isCognitiveActivityEnabled()) {
    return healthApiError(404, requestId, "FEATURE_DISABLED", "Fitur aktivitas kognitif belum diaktifkan.");
  }

  const payload = await readHealthJson(request, 8 * 1024);
  if (payload === "too_large") {
    return healthApiError(413, requestId, "PAYLOAD_TOO_LARGE", "Data sesi terlalu besar.");
  }
  if (payload === "invalid_json") {
    return healthApiError(400, requestId, "INVALID_JSON", "Format permintaan tidak valid.");
  }

  const parsed = cognitiveActivitySessionCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return healthApiError(400, requestId, "INVALID_INPUT", "Data sesi belum valid atau lengkap.");
  }

  const isDemoRequest =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-neurocare-cognitive-demo") === COGNITIVE_ACTIVITY_DEMO_HEADER;

  if (isDemoRequest) {
    return Response.json(createCognitiveActivityFixture(parsed.data), { headers: privateHealthHeaders });
  }

  const auth = await authenticatedHealthUser();
  if (auth.status === "not_configured") {
    return healthApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  }
  if (auth.status === "unauthenticated") {
    return healthApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum menyimpan sesi.");
  }

  const response: CognitiveActivitySessionResponse = {
    data: {
      status: "unavailable",
      reason: "review_pending",
      retryable: false,
      message: "Penyimpanan F10 menunggu review aktivitas, kebijakan privasi, skema, dan RLS. Tidak ada data yang disimpan.",
    },
    meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
  return Response.json(response, { headers: privateHealthHeaders });
}
