import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recoveryAnswerSchema } from "@/features/recovery/recovery.contract";
import {
  progressActivitySchema,
  progressCheckinSchema,
  type ProgressActivity,
  type ProgressCheckin,
  type ProgressRange,
  type RecoveryProgressResponse,
} from "@/features/recovery-progress/progress.contract";
import { computeProgressAggregates, sortProgressActivities, sortProgressCheckins } from "@/features/recovery-progress/progress.selectors";

const storedCheckinSchema = z.object({
  id: z.string().uuid(),
  recorded_at: z.string().datetime(),
  is_baseline: z.boolean(),
  source: z.enum(["self_report", "assisted"]),
  answers: z.array(recoveryAnswerSchema).length(4),
}).passthrough();

const storedActivitySchema = z.object({
  id: z.string().uuid(),
  exercise_id: z.string().min(1).max(80),
  exercise_version: z.string().min(1).max(80),
  algorithm_version: z.string().min(1).max(80),
  ended_at: z.string().datetime(),
  duration_seconds: z.number().int().min(0).max(7_200),
  detected_reps: z.number().int().min(0).max(10_000),
  processing_quality: z.enum(["acceptable", "low", "unavailable"]),
  status: z.enum(["completed", "interrupted", "canceled"]),
}).passthrough();

export async function loadRecoveryProgress(
  supabase: SupabaseClient,
  userId: string,
  range: ProgressRange,
  requestId: string,
  now = new Date(),
): Promise<RecoveryProgressResponse> {
  const since = rangeStart(range, now);
  let checkinQuery = supabase
    .from("recovery_checkins")
    .select("id, recorded_at, is_baseline, source, answers")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true })
    .limit(100);
  if (since) checkinQuery = checkinQuery.gte("recorded_at", since);

  const checkinResult = await checkinQuery;
  if (checkinResult.error) return unavailable(requestId, range, now, "storage_not_configured", false, "Penyimpanan progress belum tersedia.");

  const checkins = parseStoredCheckins(checkinResult.data);
  if (!checkins) return unavailable(requestId, range, now, "service_error", false, "Format data check-in tidak sesuai kontrak.");
  if (checkins.length === 0) {
    return { data: { status: "empty", message: "Belum ada check-in pada rentang waktu ini." }, meta: meta(requestId, range, now) };
  }

  let activityQuery = supabase
    .from("recovery_activities")
    .select("id, exercise_id, exercise_version, algorithm_version, ended_at, duration_seconds, detected_reps, processing_quality, status")
    .eq("user_id", userId)
    .order("ended_at", { ascending: true })
    .limit(100);
  if (since) activityQuery = activityQuery.gte("ended_at", since);
  const activityResult = await activityQuery;
  const activities = activityResult.error ? null : parseStoredActivities(activityResult.data);

  return {
    data: {
      status: "ok",
      checkins,
      activities: activities
        ? { status: "ok", activities }
        : { status: "unavailable", reason: "storage_not_configured", message: "Aktivitas F06 belum tersedia atau formatnya belum tervalidasi." },
      aggregates: computeProgressAggregates(checkins, activities),
      insight: { status: "unavailable", reason: "contract_not_approved", message: "Ringkasan AI belum tersedia karena kontraknya belum disetujui." },
    },
    meta: meta(requestId, range, now),
  };
}

export function parseStoredCheckins(value: unknown): ProgressCheckin[] | null {
  const parsed = z.array(storedCheckinSchema).max(100).safeParse(value);
  if (!parsed.success) return null;
  const mapped: ProgressCheckin[] = [];
  for (const record of parsed.data) {
    const byQuestion = new Map(record.answers.map((answer) => [answer.questionId, answer.responseId]));
    const candidate = progressCheckinSchema.safeParse({
      id: record.id,
      recordedAt: record.recorded_at,
      isBaseline: record.is_baseline,
      source: record.source,
      dailyActivity: byQuestion.get("daily_activity_completion"),
      perceivedLimitation: byQuestion.get("perceived_limitation"),
      newConcerns: byQuestion.get("new_concerns"),
      practiceFrequency: byQuestion.get("practice_frequency"),
      provenance: "database",
    });
    if (!candidate.success) return null;
    mapped.push(candidate.data);
  }
  return sortProgressCheckins(mapped);
}

export function parseStoredActivities(value: unknown): ProgressActivity[] | null {
  const parsed = z.array(storedActivitySchema).max(100).safeParse(value);
  if (!parsed.success) return null;
  const mapped = parsed.data.map((record) => progressActivitySchema.safeParse({
    id: record.id,
    activityId: record.exercise_id,
    activityVersion: record.exercise_version,
    algorithmVersion: record.algorithm_version,
    endedAt: record.ended_at,
    durationSeconds: record.duration_seconds,
    detectedReps: record.detected_reps,
    processingQuality: record.processing_quality,
    status: record.status,
    provenance: "database",
  }));
  if (mapped.some((result) => !result.success)) return null;
  return sortProgressActivities(mapped.map((result) => {
    if (!result.success) throw new Error("UNREACHABLE_INVALID_ACTIVITY");
    return result.data;
  }));
}

function rangeStart(range: ProgressRange, now: Date) {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1_000).toISOString();
}

function meta(requestId: string, range: ProgressRange, now: Date) {
  return { requestId, generatedAt: now.toISOString(), range, timezone: "Asia/Jakarta" as const, source: "database" as const, demo: false };
}

function unavailable(
  requestId: string,
  range: ProgressRange,
  now: Date,
  reason: "storage_not_configured" | "service_error",
  retryable: boolean,
  message: string,
): RecoveryProgressResponse {
  return { data: { status: "unavailable", reason, retryable, message }, meta: meta(requestId, range, now) };
}
