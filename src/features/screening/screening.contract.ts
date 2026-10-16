import { z } from "zod";

export const screeningStatusSchema = z.enum([
  "emergency",
  "eligibility_unknown",
  "not_eligible",
  "insufficient_data",
  "unavailable",
  "ok",
]);

const sourceSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  version: z.string().min(1),
  engineVersion: z.string().min(1),
});

const responseMetaSchema = z.object({
  requestId: z.string().min(1),
  generatedAt: z.string().datetime(),
  demo: z.boolean(),
});

export const gatewayRiskCategorySchema = z.enum([
  "UNDER_5_PERCENT",
  "5_TO_UNDER_10_PERCENT",
  "10_TO_UNDER_20_PERCENT",
  "20_TO_UNDER_30_PERCENT",
  "30_PERCENT_AND_ABOVE",
]);

export const gatewayRiskLevelSchema = z.enum([
  "LOW_RISK",
  "MODERATE_RISK",
  "HIGH_RISK",
  "VERY_HIGH_RISK",
]);

export const screeningResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("emergency"),
    message: z.string().min(1),
  }),
  z.object({
    status: z.literal("eligibility_unknown"),
    missingFields: z.array(z.string().min(1)).min(1),
    message: z.string().min(1),
  }),
  z.object({
    status: z.literal("not_eligible"),
    reason: z.enum([
      "age_outside_mvp",
      "previous_cvd",
      "pathway_mismatch",
      "eligibility_unconfirmed",
    ]),
    message: z.string().min(1),
  }),
  z.object({
    status: z.literal("insufficient_data"),
    missingFields: z.array(z.string().min(1)).min(1),
    message: z.string().min(1),
  }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.enum([
      "engine_not_configured",
      "timeout",
      "invalid_engine_response",
      "service_error",
      "consent_required",
    ]),
    retryable: z.boolean(),
    message: z.string().min(1),
  }),
  z.object({
    status: z.literal("ok"),
    riskScope: z.literal("cvd_10y"),
    category: z.string().min(1),
    categoryLabel: z.string().min(1),
    completedAt: z.string().datetime(),
    source: sourceSchema,
    engineFacts: z
      .object({
        evaluationId: z.string().uuid(),
        resolvedBmi: z.number().finite().positive(),
        riskCategory: gatewayRiskCategorySchema,
        riskLevel: gatewayRiskLevelSchema,
        chartTypeUsed: z.enum(["SEAR_NON_LAB", "SEAR_LAB"]),
        isHypertensiveCrisis: z.boolean(),
        clinicalDisclaimer: z.string().min(10),
      })
      .strict(),
    recordId: z.string().uuid().optional(),
    limitations: z.array(z.string().min(1)).min(1),
  }),
]);

export const screeningAnalyzeResponseSchema = z.object({
  data: screeningResultSchema,
  meta: responseMetaSchema,
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean().optional(),
  }),
  meta: responseMetaSchema.pick({ requestId: true }),
});

export type ScreeningResult = z.infer<typeof screeningResultSchema>;
export type ScreeningAnalyzeResponse = z.infer<
  typeof screeningAnalyzeResponseSchema
>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
