import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  recoveryCheckinCreateSchema,
  type RecoveryCheckin,
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
  if (process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true" && demo) {
    const requested = new URL(request.url).searchParams.get("scenario");
    const scenario: RecoveryDemoScenario = requested === "empty" || requested === "unavailable" ? requested : "baseline";
    return Response.json(createRecoveryHistoryFixture(scenario, requestId), { headers: recoveryResponseHeaders });
  }

  const user = await authenticatedUser();
  if (user === "not_configured") return recoveryApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");
  if (!user) return recoveryApiError(401, requestId, "UNAUTHENTICATED", "Silakan masuk untuk melihat check-in.");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return recoveryApiError(503, requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");

  try {
    const { data, error } = await supabase
      .from("recovery_checkins")
      .select("id, recorded_at, is_baseline, status, instrument_version, source, assistance_note, answers")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(100);

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return Response.json(storageUnavailableList(requestId), { headers: recoveryResponseHeaders });
      }
      return recoveryApiError(500, requestId, "DATABASE_ERROR", "Gagal mengambil riwayat check-in.");
    }

    const checkins: RecoveryCheckin[] = (data ?? []).map((row) => ({
      id: row.id,
      recordedAt: row.recorded_at,
      isBaseline: row.is_baseline,
      status: "completed",
      instrumentVersion: row.instrument_version,
      source: row.source,
      assistanceNote: row.assistance_note,
      answers: row.answers as unknown as RecoveryCheckin["answers"],
      provenance: "database",
    }));

    const response: RecoveryListResponse = checkins.length === 0
      ? { data: { status: "empty", message: "Belum ada riwayat check-in yang tersimpan." }, meta: { requestId, generatedAt: new Date().toISOString(), demo: false } }
      : { data: { status: "ok", checkins }, meta: { requestId, generatedAt: new Date().toISOString(), demo: false } };

    return Response.json(response, { headers: recoveryResponseHeaders });
  } catch {
    return Response.json(storageUnavailableList(requestId), { headers: recoveryResponseHeaders });
  }
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
  if (process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true" && demo) {
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

  const supabase = await createServerSupabaseClient();
  if (!supabase) return recoveryApiError(503, parsed.data.requestId, "AUTH_NOT_CONFIGURED", "Autentikasi belum dikonfigurasi.");

  try {
    // Check if this is the first check-in to assign baseline status
    const { count } = await supabase
      .from("recovery_checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const isBaseline = (count ?? 0) === 0;

    const { data: row, error } = await supabase
      .from("recovery_checkins")
      .upsert({
        user_id: user.id,
        operation_id: parsed.data.requestId,
        recorded_at: parsed.data.observedAt,
        is_baseline: isBaseline,
        status: "completed",
        instrument_version: parsed.data.instrumentVersion,
        source: parsed.data.source,
        assistance_note: parsed.data.assistanceNote,
        answers: parsed.data.answers,
      }, { onConflict: "user_id,operation_id" })
      .select()
      .single();

    if (error || !row) {
      if (error?.code === "PGRST205" || error?.code === "42P01") {
        return Response.json(storageUnavailableCreate(parsed.data.requestId), { headers: recoveryResponseHeaders });
      }
      return recoveryApiError(500, parsed.data.requestId, "STORAGE_ERROR", "Gagal menyimpan check-in ke database.");
    }

    const checkin: RecoveryCheckin = {
      id: row.id,
      recordedAt: row.recorded_at,
      isBaseline: row.is_baseline,
      status: "completed",
      instrumentVersion: row.instrument_version,
      source: row.source,
      assistanceNote: row.assistance_note,
      answers: row.answers as unknown as RecoveryCheckin["answers"],
      provenance: "database",
    };

    const response: RecoveryCreateResponse = {
      data: { status: "saved", checkin },
      meta: { requestId: parsed.data.requestId, generatedAt: new Date().toISOString(), demo: false },
    };

    return Response.json(response, { status: 201, headers: recoveryResponseHeaders });
  } catch {
    return Response.json(storageUnavailableCreate(parsed.data.requestId), { headers: recoveryResponseHeaders });
  }
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
    data: { status: "unavailable", reason: "storage_not_configured", retryable: false, message: "Tabel recovery_checkins belum siap di Supabase. Terapkan migration 202610160004_recovery_checkins_activities.sql." },
    meta: { requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}
