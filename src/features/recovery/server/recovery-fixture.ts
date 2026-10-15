import {
  RECOVERY_DEMO_INSTRUMENT_VERSION,
  type RecoveryCheckin,
  type RecoveryCheckinCreate,
  type RecoveryCreateResponse,
  type RecoveryDetailResponse,
  type RecoveryListResponse,
} from "../recovery.contract";

export type RecoveryDemoScenario = "baseline" | "empty" | "unavailable";

const baselineId = "f36a43ce-968c-4f41-bc17-5a25641b4133";

export const baselineFixture: RecoveryCheckin = {
  id: baselineId,
  recordedAt: "2026-10-08T08:30:00.000Z",
  isBaseline: true,
  status: "completed",
  instrumentVersion: RECOVERY_DEMO_INSTRUMENT_VERSION,
  source: "self_report",
  assistanceNote: null,
  answers: [
    { questionId: "daily_activity_completion", responseId: "completed_with_assistance", note: null },
    { questionId: "perceived_limitation", responseId: "some_limitation", note: null },
    { questionId: "new_concerns", responseId: "no", note: null },
    { questionId: "practice_frequency", responseId: "once", note: null },
  ],
  provenance: "demo_fixture",
};

export function createRecoveryHistoryFixture(
  scenario: RecoveryDemoScenario,
  requestId: string,
  now = new Date(),
): RecoveryListResponse {
  const meta = { requestId, generatedAt: now.toISOString(), demo: true };
  if (scenario === "empty") return { data: { status: "empty", message: "Belum ada check-in demonstrasi." }, meta };
  if (scenario === "unavailable") return { data: { status: "unavailable", reason: "service_error", retryable: true, message: "Riwayat demonstrasi tidak tersedia." }, meta };
  return { data: { status: "ok", checkins: [baselineFixture] }, meta };
}

export function createRecoveryDetailFixture(
  id: string,
  requestId: string,
  now = new Date(),
): RecoveryDetailResponse {
  const meta = { requestId, generatedAt: now.toISOString(), demo: true };
  if (id !== baselineId) return { data: { status: "unavailable", reason: "not_found", retryable: false, message: "Check-in demonstrasi tidak ditemukan." }, meta };
  return { data: { status: "ok", checkin: baselineFixture }, meta };
}

export function createRecoveryCheckinFixture(
  input: RecoveryCheckinCreate,
  isBaseline: boolean,
): RecoveryCreateResponse {
  if (input.safetyStatus === "emergency") {
    return {
      data: { status: "emergency", message: "Hentikan check-in dan segera cari bantuan darurat setempat atau fasilitas kesehatan terdekat." },
      meta: { requestId: input.requestId, generatedAt: input.observedAt, demo: true },
    };
  }
  return {
    data: {
      status: "saved",
      checkin: {
        id: input.requestId,
        recordedAt: input.observedAt,
        isBaseline,
        status: "completed",
        instrumentVersion: input.instrumentVersion,
        source: input.source,
        assistanceNote: input.assistanceNote,
        answers: input.answers,
        provenance: "demo_fixture",
      },
    },
    meta: { requestId: input.requestId, generatedAt: input.observedAt, demo: true },
  };
}

