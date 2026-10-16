import { describe, expect, it } from "vitest";
import type { ScreeningServerInput } from "@/features/screening/screening.server-schema";
import { mapScreeningGatewayResponse, prepareScreeningGatewayRequest, screeningGatewayResponseSchema } from "@/features/screening/server/screening-gateway";

const now = new Date("2026-10-16T00:00:00.000Z");
const input: ScreeningServerInput = {
  emergencySymptoms: "no", pathway: "neuroprevent", dateOfBirth: "1980-06-12", sexForChart: "female", priorCvd: "no", smokingStatus: "no",
  systolicBpStatus: "known", systolicBpMmHg: "120", systolicBpMeasuredAt: "2026-10-01", heightStatus: "known", heightCm: "165",
  weightStatus: "known", weightKg: "60", consentToAnalyze: true, requestId: "9c2626ff-d34e-4fc9-ae30-00578537cbe8",
};
const gatewayResponse = screeningGatewayResponseSchema.parse({
  evaluationId: "913459aa-838c-4d4a-b9fd-83cce49b705b", patientAgeYears: 46, gender: "FEMALE", isCurrentSmoker: false,
  systolicBloodPressureMmHg: 120, resolvedBmi: 22.04, riskScoreCategory: "UNDER_5_PERCENT", riskLevel: "LOW_RISK", chartTypeUsed: "SEAR_NON_LAB",
  binBreakdown: { ageBin: "BIN_AGE_45_49", sbpBin: "BIN_SBP_120_139", bmiBin: "BIN_BMI_20_TO_24", cholesterolBin: null },
  isHypertensiveCrisis: false, calculatedAt: "2026-10-16T08:00:00.000Z", clinicalDisclaimer: "Hasil ini bukan diagnosis dan perlu dibahas dengan tenaga kesehatan.",
});

describe("screening Gateway mapping", () => {
  it("maps only exact strict Gateway fields", () => {
    expect(prepareScreeningGatewayRequest(input, now)).toEqual({ kind: "gateway", body: {
      patientAgeYears: 46, gender: "FEMALE", systolicBloodPressureMmHg: 120, isCurrentSmoker: false,
      weightKg: 60, heightCm: 165, bodyMassIndex: null, hasDiabetes: null, totalCholesterolMmolL: null,
    } });
  });
  it("keeps ages 18-39 local and sends no WHO request", () => {
    const prepared = prepareScreeningGatewayRequest({ ...input, dateOfBirth: "1996-06-12" }, now);
    expect(prepared.kind).toBe("local");
    if (prepared.kind === "local") expect(prepared.response.data.status).toBe("not_eligible");
  });
  it("short-circuits emergency and prior CVD independently of AI", () => {
    expect(prepareScreeningGatewayRequest({ ...input, emergencySymptoms: "yes" }, now)).toMatchObject({ kind: "local", response: { data: { status: "emergency" } } });
    expect(prepareScreeningGatewayRequest({ ...input, priorCvd: "yes" }, now)).toMatchObject({ kind: "local", response: { data: { status: "not_eligible" } } });
  });
  it("maps Gateway facts without changing CVD semantics", () => {
    const response = mapScreeningGatewayResponse(input, gatewayResponse);
    expect(response.data).toMatchObject({ status: "ok", riskScope: "cvd_10y", category: "UNDER_5_PERCENT", engineFacts: { evaluationId: gatewayResponse.evaluationId, riskLevel: "LOW_RISK" } });
    expect(response.data).not.toHaveProperty("strokeRisk");
  });
});
