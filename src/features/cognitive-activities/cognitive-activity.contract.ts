import { z } from "zod";

export const COGNITIVE_ACTIVITY_CONTRACT_VERSION = "f10-draft-v1" as const;
export const COGNITIVE_ACTIVITY_DEMO_HEADER = "cognitive-fixture-v1" as const;

const cognitiveActivitySessionShape = {
  requestId: z.string().uuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  activityType: z.literal("symbol_matching"),
  completed: z.boolean(),
  endedReason: z.enum(["completed", "stopped"]),
  source: z.literal("self_report"),
  contractVersion: z.literal(COGNITIVE_ACTIVITY_CONTRACT_VERSION),
};

function validateSessionConsistency(
  value: { startedAt: string; endedAt: string; completed: boolean; endedReason: "completed" | "stopped" },
  context: z.core.$RefinementCtx,
) {
  if (Date.parse(value.endedAt) < Date.parse(value.startedAt)) {
    context.addIssue({ code: "custom", path: ["endedAt"], message: "Waktu selesai harus setelah waktu mulai.", input: value.endedAt });
  }
  if (value.completed !== (value.endedReason === "completed")) {
    context.addIssue({ code: "custom", path: ["completed"], message: "Status selesai dan alasan akhir tidak konsisten.", input: value.completed });
  }
}

const cognitiveActivitySessionRecordSchema = z
  .object(cognitiveActivitySessionShape)
  .strict()
  .superRefine(validateSessionConsistency);

export const cognitiveActivitySessionCreateSchema = z
  .object({ ...cognitiveActivitySessionShape, confirmation: z.literal(true) })
  .strict()
  .superRefine(validateSessionConsistency);

const cognitiveActivityMetaSchema = z
  .object({
    requestId: z.string().uuid(),
    generatedAt: z.string().datetime(),
    demo: z.boolean(),
  })
  .strict();

export const cognitiveActivitySessionResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z
        .object({
          status: z.literal("simulated"),
          message: z.string().min(1).max(300),
          session: cognitiveActivitySessionRecordSchema,
        })
        .strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum(["review_pending", "storage_not_configured"]),
          retryable: z.boolean(),
          message: z.string().min(1).max(300),
        })
        .strict(),
    ]),
    meta: cognitiveActivityMetaSchema,
  })
  .strict();

export type CognitiveActivitySessionCreate = z.infer<typeof cognitiveActivitySessionCreateSchema>;
export type CognitiveActivitySessionResponse = z.infer<typeof cognitiveActivitySessionResponseSchema>;
