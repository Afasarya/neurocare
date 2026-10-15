import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  recoveryCheckinCreateSchema,
  type RecoveryCreateResponse,
  type RecoveryListResponse,
} from "@/features/recovery/recovery.contract";
import {
  createRecoveryCheckinFixture,
  createRecoveryHistoryFixture,
  type RecoveryDemoScenario,
} from "@/features/recovery/server/recovery-fixture";
import {
  readBoundedJsonBody,
  recoveryApiError,
  recoveryResponseHeaders,
} from "@/features/recovery/server/recovery-api";

const MAX_BODY_BYTES = 16 * 1024;

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const demo = request.headers.get("x-neurocare-recovery-demo") === "recovery-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    const requested = new URL(request.url).searchParams.get("scenario");
    const scenario: RecoveryDemoScenario = requested === "empty" || requested === "unavailable" ? requested : "baseline";
    return Response.json(createRecoveryHistoryFixture(scenario, requestId), { headers: recoveryResponseHeaders });
  }

  const user = await authenticatedUser();
  if (user === "not_configured") return recoveryApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (!user) return recoveryApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat check-in.");
  return Response.json(storageUnavailableList(requestId), { headers: recoveryResponseHeaders });
}

export async function POST(request: Request) {
  const fallbackRequestId = crypto.randomUUID();
  const payload = await readBoundedJsonBody(request, MAX_BODY_BYTES);
  if (payload === "too_large") return recoveryApiError(413, fallbackRequestId, "PAYLOAD_TOO_LARGE", "Payload check-in terlalu besar.");
  if (payload === "invalid_json") return recoveryApiError(400, fallbackRequestId, "INVALID_JSON", "Format permintaan tidak valid.");
  const parsed = recoveryCheckinCreateSchema.safeParse(payload);
  if (!parsed.success) return recoveryApiError(400, fallbackRequestId, "INVALID_INPUT", "Jawaban check-in belum valid atau lengkap.");

  if (parsed.data.safetyStatus === "emergency") {
    return Response.json(createRecoveryCheckinFixture(parsed.data, false), { headers: recoveryResponseHeaders });
  }

  const demo = request.headers.get("x-neurocare-recovery-demo") === "recovery-fixture-v1";
  if (process.env.NODE_ENV !== "production" && demo) {
    if (request.headers.get("x-neurocare-recovery-create") === "unavailable") {
      const response: RecoveryCreateResponse = {
        data: { status: "unavailable", reason: "service_error", retryable: true, message: "Penyimpanan demonstrasi gagal. Tidak ada entri yang ditambahkan." },
        meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: true },
      };
      return Response.json(response, { headers: recoveryResponseHeaders });
    }
    const isBaseline = request.headers.get("x-neurocare-recovery-entry") === "baseline";
    return Response.json(createRecoveryCheckinFixture(parsed.data, isBaseline), { headers: recoveryResponseHeaders });
  }

  const user = await authenticatedUser();
  if (user === "not_configured") return recoveryApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (!user) return recoveryApiError(401, parsed.data.requestId, "UNAUTHENTICATED", "Silakan masuk sebelum menyimpan check-in.");
  return Response.json(storageUnavailableCreate(parsed.data.requestId), { headers: recoveryResponseHeaders });
}

async function authenticatedUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return "not_configured" as const;
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : data.user;
}

function storageUnavailableList(requestId: string): RecoveryListResponse {
  return {
    data: { status: "unavailable", reason: "storage_not_configured", retryable: false, message: "Penyimpanan check-in belum disetujui atau dikonfigurasi." },
    meta: { requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}

function storageUnavailableCreate(requestId: string): RecoveryCreateResponse {
  return {
    data: { status: "unavailable", reason: "question_set_not_approved", retryable: false, message: "Question set dan penyimpanan F05 belum disetujui. Tidak ada data yang disimpan." },
    meta: { requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}

