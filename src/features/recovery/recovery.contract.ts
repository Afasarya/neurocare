import { z } from "zod";

export const RECOVERY_DEMO_INSTRUMENT_VERSION = "recovery-demo-pending-review-v1";

export const recoveryQuestionIdSchema = z.enum([
  "daily_activity_completion",
  "perceived_limitation",
  "new_concerns",
  "practice_frequency",
]);

const allowedResponses = {
  daily_activity_completion: ["completed", "completed_with_assistance", "not_completed", "unknown"],
  perceived_limitation: ["not_reported", "some_limitation", "major_limitation", "unknown"],
  new_concerns: ["yes", "no", "unknown"],
  practice_frequency: ["not_practiced", "once", "more_than_once", "unknown"],
} as const;

export const recoveryAnswerSchema = z
  .object({
    questionId: recoveryQuestionIdSchema,
    responseId: z.string().trim().min(1).max(40),
    note: z.string().trim().max(280).nullable(),
  })
  .strict()
  .superRefine((answer, context) => {
    const choices: readonly string[] = allowedResponses[answer.questionId];
    if (!choices.includes(answer.responseId)) {
      context.addIssue({ code: "custom", path: ["responseId"], message: "Jawaban tidak tersedia untuk pertanyaan ini." });
    }
  });

export const recoveryCheckinCreateSchema = z
  .object({
    requestId: z.string().uuid(),
    instrumentVersion: z.literal(RECOVERY_DEMO_INSTRUMENT_VERSION),
    observedAt: z.string().datetime(),
    safetyStatus: z.enum(["clear", "emergency"]),
    source: z.enum(["self_report", "assisted"]),
    assistanceNote: z.string().trim().max(280).nullable(),
    answers: z.array(recoveryAnswerSchema).length(4),
    confirmation: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    const uniqueQuestions = new Set(value.answers.map((answer) => answer.questionId));
    if (uniqueQuestions.size !== allowedResponsesKeys.length) {
      context.addIssue({ code: "custom", path: ["answers"], message: "Setiap pertanyaan harus dijawab satu kali." });
    }
    if (value.source === "self_report" && value.assistanceNote) {
      context.addIssue({ code: "custom", path: ["assistanceNote"], message: "Catatan bantuan hanya untuk entri dengan bantuan." });
    }
  });

export const recoveryCheckinSchema = z
  .object({
    id: z.string().uuid(),
    recordedAt: z.string().datetime(),
    isBaseline: z.boolean(),
    status: z.literal("completed"),
    instrumentVersion: z.string().min(1),
    source: z.enum(["self_report", "assisted"]),
    assistanceNote: z.string().max(280).nullable(),
    answers: z.array(recoveryAnswerSchema).length(4),
    provenance: z.enum(["demo_fixture", "database"]),
  })
  .strict();

const metaSchema = z.object({ requestId: z.string().uuid(), generatedAt: z.string().datetime(), demo: z.boolean() }).strict();

export const recoveryCreateResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("saved"), checkin: recoveryCheckinSchema }).strict(),
    z.object({ status: z.literal("emergency"), message: z.string().min(1).max(300) }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["question_set_not_approved", "storage_not_configured", "service_error"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: metaSchema,
}).strict();

export const recoveryListResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("ok"), checkins: z.array(recoveryCheckinSchema).max(50) }).strict(),
    z.object({ status: z.literal("empty"), message: z.string().min(1).max(300) }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["storage_not_configured", "service_error", "not_found"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: metaSchema,
}).strict();

export const recoveryDetailResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("ok"), checkin: recoveryCheckinSchema }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["storage_not_configured", "service_error", "not_found"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: metaSchema,
}).strict();

const allowedResponsesKeys = Object.keys(allowedResponses);

export type RecoveryAnswer = z.infer<typeof recoveryAnswerSchema>;
export type RecoveryCheckinCreate = z.infer<typeof recoveryCheckinCreateSchema>;
export type RecoveryCheckin = z.infer<typeof recoveryCheckinSchema>;
export type RecoveryCreateResponse = z.infer<typeof recoveryCreateResponseSchema>;
export type RecoveryListResponse = z.infer<typeof recoveryListResponseSchema>;
export type RecoveryDetailResponse = z.infer<typeof recoveryDetailResponseSchema>;

