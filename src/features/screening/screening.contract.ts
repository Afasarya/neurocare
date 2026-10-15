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
