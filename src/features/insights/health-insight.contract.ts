import { z } from "zod";

export const HEALTH_INSIGHT_SCHEMA_VERSION = "health-insight-v1";

const shortText = z.string().trim().min(1).max(600);
const summaryText = z.string().trim().min(1).max(3000);
const sectionItems = z.array(shortText).min(1).max(8);

export const healthInsightRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    schemaVersion: z.literal(HEALTH_INSIGHT_SCHEMA_VERSION),
    consentToExternalAi: z.boolean(),
    source: z
      .object({
        screeningSessionId: z.string().uuid(),
        recordedAt: z.string().datetime(),
        safetyStatus: z.enum(["clear", "emergency"]),
        screeningStatus: z.enum([
          "eligibility_unknown",
          "not_eligible",
          "insufficient_data",
          "unavailable",
          "ok",
        ]),
        riskScope: z.literal("cvd_10y").nullable(),
        categoryLabel: z.string().trim().min(1).max(80).nullable(),
        factorLabels: z.array(z.string().trim().min(1).max(120)).max(8),
        incompleteDataLabels: z.array(z.string().trim().min(1).max(120)).max(8),
        provenance: z
          .object({
            label: z.string().trim().min(1).max(120),
            version: z.string().trim().min(1).max(40),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export const insightSectionsSchema = z
  .object({
    summary: summaryText,
    recordedFactors: sectionItems,
    incompleteData: sectionItems,
    generalFollowUp: sectionItems,
    limitations: sectionItems,
  })
  .strict();

const responseMetaSchema = z
  .object({
    requestId: z.string().uuid(),
    generatedAt: z.string().datetime(),
    demo: z.boolean(),
  })
  .strict();

export const healthInsightResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z
        .object({
          status: z.literal("ok"),
          sections: insightSectionsSchema,
          provenance: z
            .object({
              generatedBy: z.literal("ai"),
              model: z.string().trim().min(1).max(80),
              schemaVersion: z.literal(HEALTH_INSIGHT_SCHEMA_VERSION),
              sourceScreeningSessionId: z.string().uuid(),
            })
            .strict(),
        })
        .strict(),
      z
        .object({
          status: z.literal("template"),
          sections: insightSectionsSchema,
          reason: z.enum(["consent_absent", "ai_unavailable", "invalid_ai_response", "gateway_fallback"]),
          provenance: z
            .object({
              generatedBy: z.literal("template"),
              schemaVersion: z.literal(HEALTH_INSIGHT_SCHEMA_VERSION),
              sourceScreeningSessionId: z.string().uuid(),
            })
            .strict(),
        })
        .strict(),
      z
        .object({
          status: z.literal("emergency_blocked"),
          message: shortText,
          sourceScreeningSessionId: z.string().uuid(),
        })
        .strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum([
            "contract_not_approved",
            "provider_not_configured",
            "rate_limited",
            "timeout",
            "provider_error",
            "invalid_ai_response",
            "source_not_available",
            "persistence_not_configured",
            "persistence_error",
          ]),
          retryable: z.boolean(),
          message: shortText,
        })
        .strict(),
    ]),
    meta: responseMetaSchema,
  })
  .strict();

export type HealthInsightRequest = z.infer<typeof healthInsightRequestSchema>;
export type HealthInsightResponse = z.infer<typeof healthInsightResponseSchema>;
export type InsightSections = z.infer<typeof insightSectionsSchema>;

