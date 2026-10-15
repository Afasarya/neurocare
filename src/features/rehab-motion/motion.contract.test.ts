import { describe, expect, it } from "vitest";
import {
  MOTION_SOURCE,
  motionActivityCreateResponseSchema,
  motionActivityCreateSchema,
  motionActivityRequestSchema,
  type MotionActivityCreate,
} from "./motion.contract";
import { assertApprovedMotionAdapter } from "./motion-adapter";
import { createMotionUnavailableFixture } from "./server/motion-fixture";

function validInput(overrides: Partial<MotionActivityCreate> = {}): MotionActivityCreate {
  return {
    requestId: "86dfe011-f6cf-4f1f-a509-511a4d5abf2b",
    activityId: "reviewed-seated-arm-activity",
    activityVersion: "activity-v1",
    algorithmVersion: "algorithm-v1",
    startedAt: "2026-10-15T09:00:00.000Z",
    endedAt: "2026-10-15T09:01:00.000Z",
    durationSeconds: 60,
    detectedReps: 4,
    processingQuality: "acceptable",
    status: "completed",
    source: MOTION_SOURCE,
    consentToSave: true,
    ...overrides,
  };
}

describe("motion activity contract", () => {
  it("accepts a bounded, versioned result from an approved algorithm", () => {
    expect(motionActivityCreateSchema.safeParse(validInput()).success).toBe(true);
  });

  it("rejects invalid counts, duration, chronology and completed low-quality data", () => {
    expect(motionActivityCreateSchema.safeParse(validInput({ detectedReps: -1 })).success).toBe(false);
    expect(motionActivityCreateSchema.safeParse(validInput({ durationSeconds: -1 })).success).toBe(false);
    expect(motionActivityCreateSchema.safeParse(validInput({ endedAt: "2026-10-15T08:59:00.000Z" })).success).toBe(false);
    expect(motionActivityCreateSchema.safeParse(validInput({ processingQuality: "low" })).success).toBe(false);
  });

  it("accepts the explicit emergency stop without activity metrics", () => {
    const result = motionActivityRequestSchema.safeParse({ requestId: crypto.randomUUID(), emergency: true });
    expect(result.success).toBe(true);
  });

  it("keeps the development fixture fail-closed", () => {
    const response = createMotionUnavailableFixture(validInput(), new Date("2026-10-15T09:02:00.000Z"));
    expect(motionActivityCreateResponseSchema.safeParse(response).success).toBe(true);
    expect(response.data.status).toBe("unavailable");
    expect("activityRecordId" in response.data).toBe(false);
  });

  it("does not provide a fallback rep-counting implementation", () => {
    expect(() => assertApprovedMotionAdapter(null)).toThrow("APPROVED_MOTION_ADAPTER_NOT_CONFIGURED");
  });
});
