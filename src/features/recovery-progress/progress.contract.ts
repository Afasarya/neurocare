import { z } from "zod";

export const progressRangeSchema = z.enum(["30d", "90d", "all"]);

export const progressCheckinSchema = z
  .object({
    id: z.string().uuid(),
    recordedAt: z.string().datetime(),
    isBaseline: z.boolean(),
    source: z.enum(["self_report", "assisted"]),
    dailyActivity: z.enum(["completed", "completed_with_assistance", "not_completed", "unknown"]),
    perceivedLimitation: z.enum(["not_reported", "some_limitation", "major_limitation", "unknown"]),
    newConcerns: z.enum(["yes", "no", "unknown"]),
    practiceFrequency: z.enum(["not_practiced", "once", "more_than_once", "unknown"]),
    provenance: z.enum(["demo_fixture", "database"]),
  })
  .strict();

export const progressActivitySchema = z
  .object({
    id: z.string().uuid(),
    activityId: z.string().trim().min(1).max(80),
    activityVersion: z.string().trim().min(1).max(80),
    algorithmVersion: z.string().trim().min(1).max(80),
    endedAt: z.string().datetime(),
    durationSeconds: z.number().int().min(0).max(7_200),
    detectedReps: z.number().int().min(0).max(10_000),
    processingQuality: z.enum(["acceptable", "low", "unavailable"]),
    status: z.enum(["completed", "interrupted", "canceled"]),
    provenance: z.enum(["demo_fixture", "database"]),
  })
  .strict();

export const progressAggregatesSchema = z
  .object({
    checkinCount: z.number().int().min(0),
    firstCheckinAt: z.string().datetime().nullable(),
    latestCheckinAt: z.string().datetime().nullable(),
    activityCount: z.number().int().min(0).nullable(),
    totalActivityDurationSeconds: z.number().int().min(0).nullable(),
    totalDetectedReps: z.number().int().min(0).nullable(),
  })
  .strict();

const activitiesResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), activities: z.array(progressActivitySchema).max(100) }).strict(),
  z.object({ status: z.literal("unavailable"), reason: z.enum(["feature_not_available", "storage_not_configured"]), message: z.string().min(1).max(300) }).strict(),
]);

const progressMetaSchema = z
  .object({
    requestId: z.string().uuid(),
    generatedAt: z.string().datetime(),
    range: progressRangeSchema,
    timezone: z.literal("Asia/Jakarta"),
    source: z.enum(["demo_fixture", "database"]),
    demo: z.boolean(),
  })
  .strict();

export const recoveryProgressResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z
        .object({
          status: z.literal("ok"),
          checkins: z.array(progressCheckinSchema).max(100),
          activities: activitiesResultSchema,
          aggregates: progressAggregatesSchema,
          insight: z.object({ status: z.literal("unavailable"), reason: z.literal("contract_not_approved"), message: z.string().min(1).max(300) }).strict(),
        })
        .strict(),
      z.object({ status: z.literal("empty"), message: z.string().min(1).max(300) }).strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum(["storage_not_configured", "service_error"]),
          retryable: z.boolean(),
          message: z.string().min(1).max(300),
        })
        .strict(),
    ]),
    meta: progressMetaSchema,
  })
  .strict();

export type ProgressRange = z.infer<typeof progressRangeSchema>;
export type ProgressCheckin = z.infer<typeof progressCheckinSchema>;
export type ProgressActivity = z.infer<typeof progressActivitySchema>;
export type ProgressAggregates = z.infer<typeof progressAggregatesSchema>;
export type RecoveryProgressResponse = z.infer<typeof recoveryProgressResponseSchema>;
