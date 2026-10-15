import { describe, expect, it } from "vitest";
import { screeningServerSchema } from "../screening.server-schema";
import type { ScreeningServerInput } from "../screening.server-schema";
import { createSafeScreeningFixture } from "./screening-fixture";

const referenceDate = new Date("2026-10-15T00:00:00.000Z");

function validInput(
  overrides: Partial<ScreeningServerInput> = {},
): ScreeningServerInput {
  return {
    emergencySymptoms: "no",
    pathway: "neuroprevent",
    dateOfBirth: "1980-06-12",
    sexForChart: "female",
    priorCvd: "no",
    smokingStatus: "no",
    systolicBpStatus: "known",
    systolicBpMmHg: "120",
    systolicBpMeasuredAt: "2026-10-01",
    heightStatus: "known",
    heightCm: "165",
    weightStatus: "known",
    weightKg: "60",
    consentToAnalyze: true,
    requestId: "9c2626ff-d34e-4fc9-ae30-00578537cbe8",
    ...overrides,
  };
}

describe("safe screening fixture", () => {
  it("stops immediately for a self-reported emergency", () => {
    const response = createSafeScreeningFixture(
      validInput({ emergencySymptoms: "yes" }),
      referenceDate,
    );
    expect(response.data.status).toBe("emergency");
  });

  it("returns no score fields for users aged 18–39", () => {
    const response = createSafeScreeningFixture(
      validInput({ dateOfBirth: "1995-05-10" }),
      referenceDate,
    );
    expect(response.data.status).toBe("not_eligible");
    expect(response.data).not.toHaveProperty("riskPercent");
    expect(response.data).not.toHaveProperty("category");
  });

  it("excludes previous stroke, TIA, or CVD from primary prevention", () => {
    const response = createSafeScreeningFixture(
      validInput({ priorCvd: "yes" }),
      referenceDate,
    );
    expect(response.data).toMatchObject({
      status: "not_eligible",
      reason: "previous_cvd",
    });
  });

  it("returns insufficient data when blood pressure is unknown", () => {
    const response = createSafeScreeningFixture(
      validInput({
        systolicBpStatus: "unknown",
        systolicBpMmHg: null,
        systolicBpMeasuredAt: null,
      }),
      referenceDate,
    );
    expect(response.data.status).toBe("insufficient_data");
    if (response.data.status === "insufficient_data") {
      expect(response.data.missingFields).toContain("tekanan darah sistolik");
    }
  });

  it("keeps eligibility unknown when prior CVD history is unknown", () => {
    const response = createSafeScreeningFixture(
      validInput({ priorCvd: "unknown" }),
      referenceDate,
    );
    expect(response.data.status).toBe("eligibility_unknown");
    expect(response.data).not.toHaveProperty("category");
  });

  it("never fabricates a category when the engine is unavailable", () => {
    const response = createSafeScreeningFixture(validInput(), referenceDate);
    expect(response.data).toMatchObject({
      status: "unavailable",
      reason: "engine_not_configured",
    });
    expect(response.data).not.toHaveProperty("category");
  });
});

describe("server screening schema", () => {
  it("rejects a numeric value when blood pressure is marked unknown", () => {
    const result = screeningServerSchema.safeParse(
      validInput({
        systolicBpStatus: "unknown",
        systolicBpMmHg: "120",
        systolicBpMeasuredAt: null,
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects malformed and non-positive measurement values", () => {
    expect(
      screeningServerSchema.safeParse(validInput({ weightKg: "-1" })).success,
    ).toBe(false);
    expect(
      screeningServerSchema.safeParse(validInput({ heightCm: "unknown" })).success,
    ).toBe(false);
  });
});
