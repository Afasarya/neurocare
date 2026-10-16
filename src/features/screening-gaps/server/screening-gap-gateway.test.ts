import { describe, expect, it } from "vitest";
import { mapScreeningGapGatewayResponse, screeningGapGatewayResponseSchema } from "@/features/screening-gaps/server/screening-gap-gateway";

describe("screening gap Gateway mapping", () => {
  it("maps a validated engine gap to traceable F02 actions", () => {
    const gateway = screeningGapGatewayResponseSchema.parse({
      reportId: "8ab870d5-932b-409e-9f65-976b6ca6a6fc",
      patientId: "3f7d9c2e-8b64-4a11-9c3f-2e5b7a1d4e88",
      evaluationDate: "2026-10-16T00:00:00.000Z",
      overallComplianceStatus: "PARTIALLY_COMPLIANT",
      totalParametersEvaluated: 6,
      activeGapsCount: 1,
      highestSeverity: "MEDIUM",
      identifiedGaps: [{
        parameterCode: "TOTAL_CHOLESTEROL",
        parameterName: "Kolesterol total",
        pillarName: "Pemeriksaan laboratorium",
        gapType: "STALE_DATA",
        severity: "MEDIUM",
        daysSinceLastRecorded: 179,
        validityWindowDays: 180,
        recordedValue: 210,
        actionableRecommendation: {
          actionCode: "CHECK_TOTAL_CHOLESTEROL",
          targetFacility: "Fasilitas kesehatan",
          userGuidanceText: "Pertimbangkan pemeriksaan ulang sesuai arahan tenaga kesehatan.",
        },
      }],
      clinicalDisclaimer: "Informasi gap ini bukan diagnosis dan tidak menggantikan tenaga kesehatan.",
    });
    const result = mapScreeningGapGatewayResponse(gateway, crypto.randomUUID());
    expect(result.data).toMatchObject({ status: "ok", gaps: [{ type: "checkup_due", source: { kind: "rules_engine" } }] });
    if (result.data.status === "ok") {
      expect(result.data.gaps[0].nextActions).toContainEqual(expect.objectContaining({ id: "CHECK_TOTAL_CHOLESTEROL", kind: "add_action_plan" }));
    }
  });
});
