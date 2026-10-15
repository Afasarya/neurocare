import { describe, expect, it } from "vitest";
import {
  screeningGapsResponseSchema,
  type GapDemoScenario,
} from "../screening-gap.contract";
import { createScreeningGapFixture } from "./screening-gap-fixture";

const requestId = "f7c2980c-3c2f-49e1-9344-d99f63df0b2e";
const now = new Date("2026-10-15T10:00:00.000Z");

describe("screening gap fixtures", () => {
  it.each<GapDemoScenario>([
    "unknown-bp",
    "empty",
    "completed",
    "pending",
    "unavailable",
  ])("matches the response contract for %s", (scenario) => {
    const fixture = createScreeningGapFixture(scenario, requestId, now);
    expect(screeningGapsResponseSchema.safeParse(fixture).success).toBe(true);
  });

  it("represents missing blood pressure as unknown, never high or normal", () => {
    const fixture = createScreeningGapFixture("unknown-bp", requestId, now);
    expect(fixture.data.status).toBe("ok");
    if (fixture.data.status !== "ok") return;

    const gap = fixture.data.gaps[0];
    expect(gap.type).toBe("unknown_measurement");
    expect(gap.supportingFact.label).toContain("belum ada data");
    expect(gap.reason.toLowerCase()).not.toMatch(/tekanan darah (tinggi|normal|rendah)/);
    expect(gap.source.kind).toBe("demo_fixture");
    expect(gap.source.version).toBeTruthy();
  });

  it("links the deduplicated action source after F08 mapping exists", () => {
    const fixture = createScreeningGapFixture("unknown-bp", requestId, now);
    if (fixture.data.status !== "ok") throw new Error("Expected ok fixture");
    const action = fixture.data.gaps[0].nextActions.find(
      (item) => item.kind === "add_action_plan",
    );
    expect(action).toMatchObject({
      id: "add-bp-check-to-action-plan",
      enabled: true,
      href: "/app/action-plan",
    });
  });

  it("returns an honest empty state with no fabricated gaps", () => {
    const fixture = createScreeningGapFixture("empty", requestId, now);
    expect(fixture.data.status).toBe("empty");
    expect(JSON.stringify(fixture)).not.toContain("mmHg");
  });

  it("returns unavailable without personalized guidance", () => {
    const fixture = createScreeningGapFixture("unavailable", requestId, now);
    expect(fixture.data).toMatchObject({
      status: "unavailable",
      reason: "rules_not_configured",
    });
  });
});

describe("screening gap contract", () => {
  it("rejects a card without traceable source metadata", () => {
    const fixture = createScreeningGapFixture("unknown-bp", requestId, now);
    if (fixture.data.status !== "ok") throw new Error("Expected ok fixture");
    const malformed: unknown = {
      ...fixture,
      data: {
        ...fixture.data,
        gaps: [{ ...fixture.data.gaps[0], source: undefined }],
      },
    };
    expect(screeningGapsResponseSchema.safeParse(malformed).success).toBe(false);
  });
});
