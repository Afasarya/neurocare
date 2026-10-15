import { z } from "zod";

export const MOTION_SOURCE = "mediapipe_pose" as const;

export const motionTrackerStateSchema = z.enum([
  "loading_model",
  "camera_denied",
  "unsupported",
  "ready",
  "tracking",
  "low_confidence",
  "paused",
  "ended",
  "error",
  "emergency",
]);

export const motionActivityCreateSchema = z
  .object({
    requestId: z.string().uuid(),
    activityId: z.string().trim().min(1).max(80),
    activityVersion: z.string().trim().min(1).max(80),
    algorithmVersion: z.string().trim().min(1).max(80),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationSeconds: z.number().int().min(0).max(7_200),
    detectedReps: z.number().int().min(0).max(10_000),
    processingQuality: z.enum(["acceptable", "low", "unavailable"]),
    status: z.enum(["completed", "interrupted", "canceled"]),
    source: z.literal(MOTION_SOURCE),
    consentToSave: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.endedAt) < Date.parse(value.startedAt)) {
      context.addIssue({ code: "custom", path: ["endedAt"], message: "Waktu selesai harus setelah waktu mulai." });
    }
    if (value.status === "completed" && value.processingQuality !== "acceptable") {
      context.addIssue({ code: "custom", path: ["processingQuality"], message: "Aktivitas selesai memerlukan kualitas pemrosesan yang dapat diterima." });
    }
  });

export const motionEmergencyRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    emergency: z.literal(true),
  })
  .strict();

export const motionActivityRequestSchema = z.union([motionActivityCreateSchema, motionEmergencyRequestSchema]);

const motionMetaSchema = z
  .object({ requestId: z.string().uuid(), generatedAt: z.string().datetime(), demo: z.boolean() })
  .strict();

export const motionActivityCreateResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z.object({ status: z.literal("saved"), activityRecordId: z.string().uuid() }).strict(),
      z.object({ status: z.literal("emergency"), message: z.string().min(1).max(300) }).strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum(["activity_not_approved", "algorithm_not_approved", "storage_not_configured", "service_error"]),
          retryable: z.boolean(),
          message: z.string().min(1).max(300),
        })
        .strict(),
    ]),
    meta: motionMetaSchema,
  })
  .strict();

export type MotionTrackerState = z.infer<typeof motionTrackerStateSchema>;
export type MotionActivityCreate = z.infer<typeof motionActivityCreateSchema>;
export type MotionActivityRequest = z.infer<typeof motionActivityRequestSchema>;
export type MotionActivityCreateResponse = z.infer<typeof motionActivityCreateResponseSchema>;
