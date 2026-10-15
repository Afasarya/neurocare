import {
  recoveryProgressResponseSchema,
  type ProgressActivity,
  type ProgressCheckin,
  type ProgressRange,
  type RecoveryProgressResponse,
} from "../progress.contract";
import { computeProgressAggregates, sortProgressCheckins } from "../progress.selectors";

export type ProgressDemoScenario = "multiple" | "one" | "empty" | "no-baseline" | "sparse" | "with-activity" | "unavailable";

const checkins: ProgressCheckin[] = [
  {
    id: "f36a43ce-968c-4f41-bc17-5a25641b4133",
    recordedAt: "2026-08-18T08:30:00.000Z",
    isBaseline: true,
    source: "self_report",
    dailyActivity: "completed_with_assistance",
    perceivedLimitation: "some_limitation",
    newConcerns: "no",
    practiceFrequency: "once",
    provenance: "demo_fixture",
  },
  {
    id: "2dffbe70-2d49-42fa-8982-45d2a51fe4a8",
    recordedAt: "2026-09-25T09:15:00.000Z",
    isBaseline: false,
    source: "assisted",
    dailyActivity: "completed",
    perceivedLimitation: "some_limitation",
    newConcerns: "no",
    practiceFrequency: "more_than_once",
    provenance: "demo_fixture",
  },
  {
    id: "9e2c9af8-23e3-47fe-8502-81ff102c6f72",
    recordedAt: "2026-10-12T07:45:00.000Z",
    isBaseline: false,
    source: "self_report",
    dailyActivity: "completed",
    perceivedLimitation: "not_reported",
    newConcerns: "no",
    practiceFrequency: "once",
    provenance: "demo_fixture",
  },
];

const activity: ProgressActivity = {
  id: "d8e92ae5-7240-4862-8cac-e2e6d6c0304a",
  activityId: "reviewed-demo-seated-arm",
  activityVersion: "demo-v1",
  algorithmVersion: "demo-algorithm-v1",
  endedAt: "2026-10-10T08:10:00.000Z",
  durationSeconds: 90,
  detectedReps: 6,
  processingQuality: "acceptable",
  status: "completed",
  provenance: "demo_fixture",
};

export function createProgressFixture(
  scenario: ProgressDemoScenario,
  range: ProgressRange,
  requestId: string,
  now = new Date("2026-10-16T00:00:00.000Z"),
): RecoveryProgressResponse {
  const meta = { requestId, generatedAt: now.toISOString(), range, timezone: "Asia/Jakarta" as const, source: "demo_fixture" as const, demo: true };
  if (scenario === "empty") return { data: { status: "empty", message: "Belum ada check-in pada rentang waktu ini." }, meta };
  if (scenario === "unavailable") return { data: { status: "unavailable", reason: "service_error", retryable: true, message: "Data progress demonstrasi sedang tidak tersedia." }, meta };

  const scenarioCheckins = scenario === "one" ? [checkins[2]] : scenario === "no-baseline" ? checkins.slice(1) : scenario === "sparse" ? [checkins[0], checkins[2]] : checkins;
  const selected = filterByRange(scenarioCheckins, range, now);
  const selectedActivities = scenario === "with-activity" ? [activity] : null;
  const response: RecoveryProgressResponse = {
    data: {
      status: "ok",
      checkins: sortProgressCheckins(selected),
      activities: selectedActivities
        ? { status: "ok", activities: selectedActivities }
        : { status: "unavailable", reason: "feature_not_available", message: "F06 belum menghasilkan aktivitas tersimpan yang tervalidasi." },
      aggregates: computeProgressAggregates(selected, selectedActivities),
      insight: { status: "unavailable", reason: "contract_not_approved", message: "Ringkasan AI belum tersedia karena kontraknya belum disetujui." },
    },
    meta,
  };
  return recoveryProgressResponseSchema.parse(response);
}

function filterByRange(values: ProgressCheckin[], range: ProgressRange, now: Date) {
  if (range === "all") return values;
  const days = range === "30d" ? 30 : 90;
  const since = now.getTime() - days * 24 * 60 * 60 * 1_000;
  return values.filter((checkin) => Date.parse(checkin.recordedAt) >= since);
}
