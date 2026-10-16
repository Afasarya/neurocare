import { z } from "zod";
import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
  type HealthInsightRequest,
  type HealthInsightResponse,
} from "@/features/insights/health-insight.contract";
import {
  gatewayRiskCategorySchema,
  gatewayRiskLevelSchema,
} from "@/features/screening/screening.contract";

const actionPlanItemSchema = z
  .object({
    category: z.enum(["MEDICAL_FOLLOWUP", "LIFESTYLE_MODIFICATION", "MONITORING_ROUTINE"]),
    actionText: z.string().trim().min(5).max(300),
    urgency: z.enum(["START_IMMEDIATELY", "RECOMMENDED_WITHIN_14_DAYS", "ROUTINE_MONTHLY"]),
  })
  .strict();

export const healthInsightGatewayRequestSchema = z
  .object({
    evaluationId: z.string().min(1),
    patientAgeYears: z.number().int().min(40).max(59),
    gender: z.enum(["MALE", "FEMALE"]),
    systolicBloodPressureMmHg: z.number().min(60).max(300),
    resolvedBmi: z.number().positive(),
    isCurrentSmoker: z.boolean(),
    riskCategory: gatewayRiskCategorySchema,
    riskLevel: gatewayRiskLevelSchema,
    isHypertensiveCrisis: z.boolean(),
    identifiedGapsSummary: z.array(z.string()).optional(),
    preferredLanguage: z.literal("id_ID").optional(),
  })
  .strict();

export const healthInsightGatewayResponseSchema = z
  .object({
    insightId: z.string().min(1),
    evaluationId: z.string().min(1),
    generatedAt: z.string().datetime(),
    modelMeta: z
      .object({
        provider: z.string().min(1),
        schemaVersion: z.string().min(1),
        isFallbackTemplate: z.boolean(),
        latencyMs: z.number().nonnegative(),
        promptTokens: z.number().nonnegative().optional(),
        completionTokens: z.number().nonnegative().optional(),
      })
      .strict(),
    structuredContent: z
      .object({
        headline: z.string().trim().min(5).max(200),
        summaryNarration: z.string().trim().min(20).max(2500),
        primaryRiskDrivers: z.array(z.string().trim().min(3)).min(1).max(4),
        actionPlan: z.array(actionPlanItemSchema).min(2).max(5),
        rehabilitationPreparationNote: z.string().trim().min(5).max(600),
        mandatoryDisclaimer: z.string().trim().min(10).max(600),
      })
      .strict(),
  })
  .strict();

export type HealthInsightGatewayRequest = z.infer<typeof healthInsightGatewayRequestSchema>;
export type HealthInsightGatewayResponse = z.infer<typeof healthInsightGatewayResponseSchema>;

export function mapHealthInsightGatewayResponse(
  command: HealthInsightRequest,
  gatewayRequest: HealthInsightGatewayRequest,
  response: HealthInsightGatewayResponse,
): HealthInsightResponse | null {
  if (response.evaluationId !== gatewayRequest.evaluationId) return null;

  const sections = {
    summary: `${response.structuredContent.headline}\n\n${response.structuredContent.summaryNarration}`,
    recordedFactors: response.structuredContent.primaryRiskDrivers,
    incompleteData: gatewayRequest.identifiedGapsSummary?.length
      ? gatewayRequest.identifiedGapsSummary
      : ["Tidak ada ringkasan gap tambahan pada sumber yang dikirim."],
    generalFollowUp: [
      ...response.structuredContent.actionPlan.map((item) => item.actionText),
      response.structuredContent.rehabilitationPreparationNote,
    ],
    limitations: [response.structuredContent.mandatoryDisclaimer],
  };

  if (response.modelMeta.isFallbackTemplate) {
    return {
      data: {
        status: "template",
        sections,
        reason: "gateway_fallback",
        provenance: {
          generatedBy: "template",
          schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
          sourceScreeningSessionId: command.source.screeningSessionId,
        },
      },
      meta: { requestId: command.requestId, generatedAt: response.generatedAt, demo: false },
    };
  }

  return {
    data: {
      status: "ok",
      sections,
      provenance: {
        generatedBy: "ai",
        model: `${response.modelMeta.provider}/${response.modelMeta.schemaVersion}`,
        schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
        sourceScreeningSessionId: command.source.screeningSessionId,
      },
    },
    meta: { requestId: command.requestId, generatedAt: response.generatedAt, demo: false },
  };
}
