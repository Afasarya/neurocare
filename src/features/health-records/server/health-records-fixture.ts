import type {
  ActionItem,
  ActionItemsResponse,
  ActionItemUpdate,
  ActionItemUpdateResponse,
  HealthMeasurementCreate,
  MeasurementCreateResponse,
  TimelineEvent,
  TimelineResponse,
} from "../health-records.contract";
import { sortActionItems, sortTimelineEvents } from "../health-records.selectors";

export type TimelineDemoScenario = "baseline" | "empty" | "unavailable";
export type ActionDemoScenario = "baseline" | "empty" | "unavailable";

const timelineEvents: TimelineEvent[] = [
  {
    id: "recovery-checkin:f36a43ce-968c-4f41-bc17-5a25641b4133",
    occurredAt: "2026-10-15T17:20:00.000Z",
    kind: "recovery_checkin",
    pathway: "neurorecovery",
    title: "Check-in pemulihan",
    description: "Laporan mandiri demonstrasi; bukan skor klinis.",
    details: [{ label: "Sumber", value: "Laporan mandiri", unit: null }],
    source: { label: "Fixture F05", provenance: "demo_fixture", referenceId: "f36a43ce-968c-4f41-bc17-5a25641b4133" },
  },
  {
    id: "measurement:3c12e021-d527-4ff4-aef0-30b23b9963d2",
    occurredAt: "2026-10-15T16:50:00.000Z",
    kind: "measurement",
    pathway: "shared",
    title: "Pengukuran berat badan",
    description: "Nilai yang dilaporkan pengguna; tidak ditafsirkan sebagai normal atau abnormal.",
    details: [{ label: "Berat", value: "64.5", unit: "kg" }],
    source: { label: "Laporan pengguna sintetis", provenance: "demo_fixture", referenceId: "3c12e021-d527-4ff4-aef0-30b23b9963d2" },
  },
  {
    id: "screening:927a9f6e-50ea-4c47-8596-2e8d6642841f",
    occurredAt: "2026-10-01T03:15:00.000Z",
    kind: "screening",
    pathway: "neuroprevent",
    title: "Skrining tersimpan",
    description: "Status skrining demonstrasi tanpa persentase risiko buatan.",
    details: [{ label: "Status", value: "Data sumber tersedia", unit: null }],
    source: { label: "Fixture F01", provenance: "demo_fixture", referenceId: "927a9f6e-50ea-4c47-8596-2e8d6642841f" },
  },
];

export const actionItemsFixture: ActionItem[] = [
  {
    id: "5479f390-bf18-42fa-94ac-af99aad7f61b",
    dedupeKey: "screening-gap:record-blood-pressure",
    title: "Catat hasil pemeriksaan tekanan darah",
    description: "Tambahkan hasil yang benar-benar diukur, lengkap dengan tanggal dan satuan.",
    status: "pending",
    pathway: "neuroprevent",
    dueAt: null,
    completedAt: null,
    source: { kind: "screening_gap", label: "Gap pemeriksaan F02", referenceId: "demo-gap-bp-unknown" },
    provenance: "demo_fixture",
    updatedAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: "80536d8c-1651-4e9d-9b82-03f47f56d6dd",
    dedupeKey: "recovery-progress:create-checkin",
    title: "Buat check-in pemulihan berikutnya",
    description: "Catat laporan mandiri saat Anda memilih untuk melakukan check-in.",
    status: "completed",
    pathway: "neurorecovery",
    dueAt: null,
    completedAt: "2026-10-15T17:20:00.000Z",
    source: { kind: "recovery_progress", label: "Progress F07", referenceId: "demo-progress" },
    provenance: "demo_fixture",
    updatedAt: "2026-10-15T17:20:00.000Z",
  },
];

export function createTimelineFixture(scenario: TimelineDemoScenario, requestId: string, now = new Date()): TimelineResponse {
  const meta = fixtureMeta(requestId, now);
  if (scenario === "empty") return { data: { status: "empty", message: "Belum ada kejadian kesehatan demonstrasi." }, meta };
  if (scenario === "unavailable") return { data: { status: "unavailable", reason: "service_error", retryable: true, message: "Timeline demonstrasi tidak tersedia." }, meta };
  return { data: { status: "ok", events: sortTimelineEvents(timelineEvents), lastUpdatedAt: now.toISOString() }, meta };
}

export function createActionItemsFixture(scenario: ActionDemoScenario, requestId: string, now = new Date()): ActionItemsResponse {
  const meta = fixtureMeta(requestId, now);
  if (scenario === "empty") return { data: { status: "empty", message: "Belum ada rencana tindak lanjut demonstrasi." }, meta };
  if (scenario === "unavailable") return { data: { status: "unavailable", reason: "service_error", retryable: true, message: "Rencana demonstrasi tidak tersedia." }, meta };
  return { data: { status: "ok", items: sortActionItems(actionItemsFixture), lastUpdatedAt: now.toISOString() }, meta };
}

export function createMeasurementFixture(input: HealthMeasurementCreate): MeasurementCreateResponse {
  const common = { id: input.requestId, measuredAt: input.measuredAt, source: input.source, provenance: "demo_fixture" as const };
  const measurement = input.type === "blood_pressure"
    ? { ...common, type: input.type, systolic: input.systolic, diastolic: input.diastolic, unit: input.unit }
    : input.type === "weight"
      ? { ...common, type: input.type, value: input.value, unit: input.unit }
      : { ...common, type: input.type, value: input.value, unit: input.unit };
  return { data: { status: "saved", measurement }, meta: fixtureMeta(input.requestId, new Date(input.measuredAt)) };
}

export function updateActionItemFixture(id: string, input: ActionItemUpdate, now = new Date()): ActionItemUpdateResponse {
  const existing = actionItemsFixture.find((item) => item.id === id);
  if (!existing) return { data: { status: "unavailable", reason: "not_found", retryable: false, message: "Rencana demonstrasi tidak ditemukan." }, meta: fixtureMeta(input.requestId, now) };
  const item: ActionItem = { ...existing, status: input.status, completedAt: input.status === "completed" ? now.toISOString() : null, updatedAt: now.toISOString() };
  return { data: { status: "saved", item }, meta: fixtureMeta(input.requestId, now) };
}

function fixtureMeta(requestId: string, now: Date) {
  return { requestId, generatedAt: now.toISOString(), timezone: "Asia/Jakarta" as const, demo: true };
}
