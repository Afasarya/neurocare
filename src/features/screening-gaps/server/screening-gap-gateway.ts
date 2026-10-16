import { z } from "zod";
import type { ScreeningGapsResponse } from "@/features/screening-gaps/screening-gap.contract";

const parameterCodeSchema = z.enum([
  "SYSTOLIC_BLOOD_PRESSURE", "BODY_MASS_INDEX", "WAIST_CIRCUMFERENCE",
  "FASTING_BLOOD_GLUCOSE", "SMOKING_STATUS_ASSESSMENT", "TOTAL_CHOLESTEROL",
]);

export const screeningGapGatewayRequestSchema = z.object({
  patientId: z.string().uuid(),
  evaluationDate: z.string().datetime().optional(),
  knownRiskProfile: z.object({ isKnownHypertensive: z.boolean().optional(), isKnownDiabetic: z.boolean().optional() }).strict().optional(),
  screeningRecords: z.array(z.object({
    parameterCode: parameterCodeSchema,
    recordedValue: z.union([z.number(), z.string()]).nullable().optional(),
    unit: z.string().nullable().optional(),
    recordedAt: z.string().datetime().nullable().optional(),
  }).strict()).max(20),
}).strict();

const gapItemSchema = z.object({
  parameterCode: parameterCodeSchema,
  parameterName: z.string().min(1),
  pillarName: z.string().min(1),
  gapType: z.enum(["MISSING_DATA", "INVALID_DATA", "STALE_DATA", "NEVER_PERFORMED"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  daysSinceLastRecorded: z.number().int().nullable(),
  validityWindowDays: z.number().int().positive(),
  recordedValue: z.union([z.number(), z.string()]).nullable(),
  actionableRecommendation: z.object({ actionCode: z.string().min(1), targetFacility: z.string().min(1), userGuidanceText: z.string().min(1) }).strict(),
}).strict();

export const screeningGapGatewayResponseSchema = z.object({
  reportId: z.string().uuid(),
  patientId: z.string().uuid(),
  evaluationDate: z.string().datetime(),
  overallComplianceStatus: z.enum(["FULLY_COMPLIANT", "PARTIALLY_COMPLIANT", "NON_COMPLIANT", "ACTION_REQUIRED_CRITICAL"]),
  totalParametersEvaluated: z.number().int().min(1),
  activeGapsCount: z.number().int().nonnegative(),
  highestSeverity: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  identifiedGaps: z.array(gapItemSchema),
  clinicalDisclaimer: z.string().min(10),
}).strict();

export type ScreeningGapGatewayRequest = z.infer<typeof screeningGapGatewayRequestSchema>;
export type ScreeningGapGatewayResponse = z.infer<typeof screeningGapGatewayResponseSchema>;

export function mapScreeningGapGatewayResponse(
  response: ScreeningGapGatewayResponse,
  requestId: string,
): ScreeningGapsResponse {
  const meta = { requestId, generatedAt: new Date().toISOString(), demo: false };
  if (response.identifiedGaps.length === 0) {
    return { data: { status: "empty", message: "Tidak ada gap aktif berdasarkan data dan aturan saat ini." }, meta };
  }
  return {
    data: {
      status: "ok",
      gaps: response.identifiedGaps.map((gap) => ({
        id: `${response.reportId}:${gap.parameterCode}`,
        type: gap.gapType === "STALE_DATA" ? "checkup_due" : gap.gapType === "INVALID_DATA" ? "possible_follow_up" : "unknown_measurement",
        status: "open",
        title: gap.parameterName,
        reason: gap.actionableRecommendation.userGuidanceText,
        relatedMeasurement: relatedMeasurement(gap.parameterCode),
        supportingFact: {
          label: gap.recordedValue === null ? `${gap.parameterName}: belum ada data` : `${gap.parameterName}: data tercatat`,
          recordedAt: null,
        },
        source: { kind: "rules_engine", label: "AI-Neurocare screening gap engine", version: "gateway-v1", referenceId: response.reportId },
        applicability: "applicable",
        stale: gap.gapType === "STALE_DATA",
        nextActions: [
          { id: `record:${gap.parameterCode}`, kind: "record_measurement", label: "Catat hasil pemeriksaan", href: "/app/timeline", enabled: true },
          { id: `history:${gap.parameterCode}`, kind: "view_history", label: "Lihat riwayat", href: "/app/screening/history", enabled: true },
          { id: gap.actionableRecommendation.actionCode, kind: "add_action_plan", label: "Tambah ke Rencana", href: "/app/action-plan", enabled: true },
        ],
      })),
      evaluatedAt: response.evaluationDate,
      ruleSource: { label: "AI-Neurocare screening gap engine", version: "gateway-v1" },
    },
    meta,
  };
}

function relatedMeasurement(code: z.infer<typeof parameterCodeSchema>) {
  if (code === "SYSTOLIC_BLOOD_PRESSURE") return "systolic_blood_pressure" as const;
  if (code === "BODY_MASS_INDEX") return "weight" as const;
  if (code === "SMOKING_STATUS_ASSESSMENT") return "smoking_status" as const;
  return "other" as const;
}
