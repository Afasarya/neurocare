import { describe, expect, it } from "vitest";
import {
  actionItemUpdateResponseSchema,
  actionItemsResponseSchema,
  healthMeasurementCreateSchema,
  measurementCreateResponseSchema,
  timelineResponseSchema,
  type TimelineEvent,
} from "./health-records.contract";
import { hasDuplicateAction, isMeasuredAtAllowed, sortTimelineEvents } from "./health-records.selectors";
import { measurementFormSchema } from "./measurement-form.schema";
import {
  actionItemsFixture,
  createActionItemsFixture,
  createMeasurementFixture,
  createTimelineFixture,
  updateActionItemFixture,
} from "./server/health-records-fixture";

const validBloodPressure = {
  requestId: "86dfe011-f6cf-4f1f-a509-511a4d5abf2b",
  type: "blood_pressure" as const,
  measuredAt: "2026-10-15T09:00:00.000Z",
  source: "user_reported" as const,
  confirmation: true as const,
  systolic: 120,
  diastolic: 80,
  unit: "mmHg" as const,
};

describe("F08 typed records foundation", () => {
  it("accepts explicit measurement units and rejects mismatched or malformed values", () => {
    expect(healthMeasurementCreateSchema.safeParse(validBloodPressure).success).toBe(true);
    expect(healthMeasurementCreateSchema.safeParse({ ...validBloodPressure, unit: "kg" }).success).toBe(false);
    expect(healthMeasurementCreateSchema.safeParse({ ...validBloodPressure, systolic: -1 }).success).toBe(false);
    expect(healthMeasurementCreateSchema.safeParse({ ...validBloodPressure, userId: crypto.randomUUID() }).success).toBe(false);
  });

  it("rejects impossible/future dates at form and server policy boundaries", () => {
    expect(isMeasuredAtAllowed("not-a-date", new Date("2026-10-16T00:00:00.000Z"))).toBe(false);
    expect(isMeasuredAtAllowed("2026-10-17T00:00:00.000Z", new Date("2026-10-16T00:00:00.000Z"))).toBe(false);
    expect(measurementFormSchema.safeParse({ type: "weight", primaryValue: "64.5", secondaryValue: "", measuredAt: "not-a-date", confirmation: true }).success).toBe(false);
  });

  it("creates a valid synthetic measurement response without diagnosis", () => {
    const response = createMeasurementFixture(validBloodPressure);
    expect(measurementCreateResponseSchema.safeParse(response).success).toBe(true);
    expect(JSON.stringify(response).toLowerCase()).not.toMatch(/normal|abnormal|diagnosis/);
  });

  it("sorts events by original UTC timestamp across the Jakarta midnight boundary", () => {
    const earlier: TimelineEvent = { id: "earlier", occurredAt: "2026-10-15T16:59:00.000Z", kind: "measurement", pathway: "shared", title: "Earlier", description: "Synthetic test event.", details: [], source: { label: "Test", provenance: "demo_fixture", referenceId: null } };
    const later: TimelineEvent = { ...earlier, id: "later", occurredAt: "2026-10-15T17:01:00.000Z", title: "Later" };
    expect(sortTimelineEvents([earlier, later]).map((event) => event.id)).toEqual(["later", "earlier"]);
  });

  it("supports healthy baseline and empty timeline states", () => {
    expect(timelineResponseSchema.safeParse(createTimelineFixture("baseline", crypto.randomUUID())).success).toBe(true);
    const empty = createTimelineFixture("empty", crypto.randomUUID());
    expect(timelineResponseSchema.safeParse(empty).success).toBe(true);
    expect(empty.data.status).toBe("empty");
  });

  it("has unique dedupe keys and toggles one action only after a saved response", () => {
    expect(hasDuplicateAction(actionItemsFixture)).toBe(false);
    expect(actionItemsResponseSchema.safeParse(createActionItemsFixture("baseline", crypto.randomUUID())).success).toBe(true);
    const response = updateActionItemFixture(actionItemsFixture[0].id, { requestId: crypto.randomUUID(), status: "completed" }, new Date("2026-10-16T01:00:00.000Z"));
    expect(actionItemUpdateResponseSchema.safeParse(response).success).toBe(true);
    expect(response.data.status).toBe("saved");
    if (response.data.status === "saved") {
      expect(response.data.item.status).toBe("completed");
      expect(response.data.item.completedAt).toBe("2026-10-16T01:00:00.000Z");
    }
  });

  it("returns not-found instead of a false action success", () => {
    const response = updateActionItemFixture(crypto.randomUUID(), { requestId: crypto.randomUUID(), status: "completed" });
    expect(response.data.status).toBe("unavailable");
  });
});
