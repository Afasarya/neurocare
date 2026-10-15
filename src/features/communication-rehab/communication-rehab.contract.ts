import { z } from "zod";

export const COMMUNICATION_REHAB_DEMO_HEADER = "communication-fixture-v1" as const;
export const COMMUNICATION_REHAB_CONTRACT_VERSION = "f09-draft-v1" as const;

export const communicationActivityTypeSchema = z.enum([
  "phrase_cards",
  "picture_cards",
  "non_recording_practice",
]);

export const communicationSessionCreateSchema = z
  .object({
    requestId: z.string().uuid(),
    sessionDate: z.string().datetime(),
    activityType: communicationActivityTypeSchema,
    completed: z.literal(true),
    notes: z.string().trim().max(500).optional(),
    source: z.literal("self_report"),
    contractVersion: z.literal(COMMUNICATION_REHAB_CONTRACT_VERSION),
    confirmation: z.literal(true),
  })
  .strict();

const communicationMetaSchema = z
  .object({
    requestId: z.string().uuid(),
    generatedAt: z.string().datetime(),
    demo: z.boolean(),
  })
  .strict();

export const communicationSessionResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z
        .object({
          status: z.literal("simulated"),
          message: z.string().min(1).max(300),
          session: communicationSessionCreateSchema.omit({ confirmation: true }),
        })
        .strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum(["feature_disabled", "review_pending", "storage_not_configured"]),
          retryable: z.boolean(),
          message: z.string().min(1).max(300),
        })
        .strict(),
    ]),
    meta: communicationMetaSchema,
  })
  .strict();

export type CommunicationActivityType = z.infer<typeof communicationActivityTypeSchema>;
export type CommunicationSessionCreate = z.infer<typeof communicationSessionCreateSchema>;
export type CommunicationSessionResponse = z.infer<typeof communicationSessionResponseSchema>;
