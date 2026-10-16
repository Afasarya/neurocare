import "server-only";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { screeningResultSchema } from "@/features/screening/screening.contract";
import { screeningServerSchema } from "@/features/screening/screening.server-schema";
import {
  healthInsightGatewayRequestSchema,
  type HealthInsightGatewayRequest,
} from "@/features/insights/server/health-insight-gateway";

const storedSessionSchema = z.object({
  input_snapshot: z.unknown(),
  result_snapshot: z.unknown(),
  completed_at: z.string().datetime().nullable(),
}).passthrough();

const storedGapSchema = z.object({
  related_measurement: z.string().min(1),
  gap_type: z.string().min(1),
}).passthrough();

export async function loadHealthInsightGatewayRequest(
  supabase: SupabaseClient<Database>,
  userId: string,
  screeningSessionId: string,
): Promise<HealthInsightGatewayRequest | null> {
  const { data: rawSession, error } = await supabase
    .from("screening_sessions")
    .select("input_snapshot, result_snapshot, completed_at")
    .eq("id", screeningSessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !rawSession) return null;

  const session = storedSessionSchema.safeParse(rawSession);
  if (!session.success) return null;
  const input = screeningServerSchema.safeParse(session.data.input_snapshot);
  const result = screeningResultSchema.safeParse(session.data.result_snapshot);
  if (!input.success || !result.success || result.data.status !== "ok") return null;

  const { data: rawGaps, error: gapError } = await supabase
    .from("screening_gaps")
    .select("related_measurement, gap_type")
    .eq("screening_session_id", screeningSessionId)
    .eq("user_id", userId)
    .limit(20);
  if (gapError) return null;
  const gaps = z.array(storedGapSchema).max(20).safeParse(rawGaps ?? []);
  if (!gaps.success) return null;

  return healthInsightGatewayRequestSchema.parse({
    evaluationId: result.data.engineFacts.evaluationId,
    patientAgeYears: ageOnDate(input.data.dateOfBirth, result.data.completedAt),
    gender: input.data.sexForChart === "male" ? "MALE" : "FEMALE",
    systolicBloodPressureMmHg: Number(input.data.systolicBpMmHg),
    resolvedBmi: result.data.engineFacts.resolvedBmi,
    isCurrentSmoker: input.data.smokingStatus === "yes",
    riskCategory: result.data.engineFacts.riskCategory,
    riskLevel: result.data.engineFacts.riskLevel,
    isHypertensiveCrisis: result.data.engineFacts.isHypertensiveCrisis,
    identifiedGapsSummary: gaps.data.map(
      (gap) => `${gap.related_measurement.toUpperCase()} (${gap.gap_type.toUpperCase()})`,
    ),
    preferredLanguage: "id_ID",
  });
}

function ageOnDate(dateOfBirth: string, referenceDate: string) {
  const date = new Date(referenceDate);
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = date.getUTCFullYear() - year;
  if (date.getUTCMonth() + 1 < month || (date.getUTCMonth() + 1 === month && date.getUTCDate() < day)) age -= 1;
  return age;
}
