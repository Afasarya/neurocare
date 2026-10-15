import { describe, expect, it } from "vitest";
import {
  recoveryProgressResponseSchema,
  type ProgressActivity,
  type ProgressCheckin,
} from "./progress.contract";
import {
  buildCheckinCountSeries,
  computeProgressAggregates,
  describeCheckinData,
} from "./progress.selectors";
import { createProgressFixture } from "./server/progress-fixture";

const checkin: ProgressCheckin = {
  id: "01873c3c-bb2c-4287-b934-81b86d07092a",
  recordedAt: "2026-10-12T07:45:00.000Z",
  isBaseline: true,
  source: "self_report",
  dailyActivity: "completed",
  perceivedLimitation: "unknown",
  newConcerns: "no",
  practiceFrequency: "once",
  provenance: "demo_fixture",
};

const validActivity: ProgressActivity = {
  id: "2517ab90-3d79-4438-8134-9c8770c13d44",
  activityId: "approved-activity",
  activityVersion: "v1",
  algorithmVersion: "v1",
  endedAt: "2026-10-12T08:00:00.000Z",
  durationSeconds: 90,
  detectedReps: 6,
  processingQuality: "acceptable",
  status: "completed",
  provenance: "demo_fixture",
};

describe("recovery progress contracts and descriptive selectors", () => {
  it("renders empty and one-point fixtures without inventing zero improvement", () => {
    const empty = createProgressFixture("empty", "90d", crypto.randomUUID());
    const one = createProgressFixture("one", "90d", crypto.randomUUID());
    expect(recoveryProgressResponseSchema.safeParse(empty).success).toBe(true);
    expect(empty.data.status).toBe("empty");
    expect(JSON.stringify(empty)).not.toContain("0%");
    expect(one.data.status).toBe("ok");
    if (one.data.status === "ok") {
      expect(one.data.aggregates.checkinCount).toBe(1);
      expect(describeCheckinData(one.data.checkins)).toContain("Belum ada cukup titik");
    }
  });

  it("sorts dated points and builds cumulative counts only", () => {
    const older = { ...checkin, id: crypto.randomUUID(), recordedAt: "2026-10-01T07:45:00.000Z" };
    const series = buildCheckinCountSeries([checkin, older]);
    expect(series.map((point) => point.recordedAt)).toEqual([older.recordedAt, checkin.recordedAt]);
    expect(series.map((point) => point.cumulativeCheckins)).toEqual([1, 2]);
  });

  it("sums only completed activities with acceptable processing quality", () => {
    const lowQuality = { ...validActivity, id: crypto.randomUUID(), detectedReps: 999, processingQuality: "low" as const };
    const interrupted = { ...validActivity, id: crypto.randomUUID(), detectedReps: 999, status: "interrupted" as const };
    expect(computeProgressAggregates([checkin], [validActivity, lowQuality, interrupted])).toMatchObject({
      activityCount: 1,
      totalActivityDurationSeconds: 90,
      totalDetectedReps: 6,
    });
  });

  it("keeps missing F06 metrics null instead of converting them to zero", () => {
    expect(computeProgressAggregates([checkin], null)).toMatchObject({
      activityCount: null,
      totalActivityDurationSeconds: null,
      totalDetectedReps: null,
    });
  });

  it("supports baseline, no-baseline, sparse and validated activity scenarios", () => {
    for (const scenario of ["multiple", "no-baseline", "sparse", "with-activity"] as const) {
      const response = createProgressFixture(scenario, "90d", crypto.randomUUID());
      expect(recoveryProgressResponseSchema.safeParse(response).success).toBe(true);
    }
    const activityResponse = createProgressFixture("with-activity", "90d", crypto.randomUUID());
    expect(activityResponse.data.status).toBe("ok");
    if (activityResponse.data.status === "ok") expect(activityResponse.data.activities.status).toBe("ok");
  });

  it("cannot accept an unreviewed AI improvement claim", () => {
    const response = createProgressFixture("multiple", "90d", crypto.randomUUID());
    if (response.data.status !== "ok") throw new Error("Expected ok fixture");
    const unsafe = { ...response, data: { ...response.data, insight: { status: "ok", text: "Pemulihan meningkat 80%" } } };
    expect(recoveryProgressResponseSchema.safeParse(unsafe).success).toBe(false);
  });

  it("applies the selected date range deterministically", () => {
    const response = createProgressFixture("multiple", "30d", crypto.randomUUID(), new Date("2026-10-16T00:00:00.000Z"));
    if (response.data.status !== "ok") throw new Error("Expected ok fixture");
    expect(response.data.checkins).toHaveLength(2);
    expect(response.data.checkins.some((item) => item.isBaseline)).toBe(false);
  });
});
