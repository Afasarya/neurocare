import "server-only";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { screeningResultSchema } from "@/features/screening/screening.contract";
import { screeningServerSchema } from "@/features/screening/screening.server-schema";
import { requestAiGateway } from "@/lib/ai-gateway/client";
import { AiGatewayError } from "@/lib/ai-gateway/client-core";
import {
  mapScreeningGapGatewayResponse,
  screeningGapGatewayRequestSchema,
  screeningGapGatewayResponseSchema,
} from "./screening-gap-gateway";
import type { ScreeningGapsResponse } from "../screening-gap.contract";

const sessionSchema = z.object({ id: z.string().uuid(), input_snapshot: z.unknown(), result_snapshot: z.unknown(), completed_at: z.string().datetime().nullable() }).passthrough();

export async function loadLatestGapSource(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("screening_sessions")
    .select("id, input_snapshot, result_snapshot, completed_at")
    .eq("user_id", userId).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  const session = sessionSchema.safeParse(data);
  if (!session.success) return null;
  const input = screeningServerSchema.safeParse(session.data.input_snapshot);
  const result = screeningResultSchema.safeParse(session.data.result_snapshot);
  if (!input.success || !result.success) return null;

  const records: Array<{ parameterCode: "SYSTOLIC_BLOOD_PRESSURE" | "BODY_MASS_INDEX" | "SMOKING_STATUS_ASSESSMENT"; recordedValue: number | string; unit: string | null; recordedAt: string | null }> = [];
  if (input.data.systolicBpStatus === "known") records.push({ parameterCode: "SYSTOLIC_BLOOD_PRESSURE", recordedValue: Number(input.data.systolicBpMmHg), unit: "mmHg", recordedAt: input.data.systolicBpMeasuredAt ? `${input.data.systolicBpMeasuredAt}T00:00:00.000Z` : null });
  if (result.data.status === "ok") records.push({ parameterCode: "BODY_MASS_INDEX", recordedValue: result.data.engineFacts.resolvedBmi, unit: "kg/m2", recordedAt: result.data.completedAt });
  if (input.data.smokingStatus !== "unknown") records.push({ parameterCode: "SMOKING_STATUS_ASSESSMENT", recordedValue: input.data.smokingStatus === "yes" ? "CURRENT_SMOKER" : "NON_SMOKER", unit: null, recordedAt: session.data.completed_at });

  return {
    sessionId: session.data.id,
    body: screeningGapGatewayRequestSchema.parse({ patientId: userId, evaluationDate: new Date().toISOString(), screeningRecords: records }),
  };
}

export async function analyzeScreeningGaps(source: NonNullable<Awaited<ReturnType<typeof loadLatestGapSource>>>, requestId: string): Promise<ScreeningGapsResponse> {
  try {
    const response = await requestAiGateway({ path: "/api/v1/screening/gaps", body: source.body, requestId, responseSchema: screeningGapGatewayResponseSchema, timeoutMs: 10_000 });
    if (response.patientId !== source.body.patientId) return unavailable(requestId, "invalid_response", false);
    return mapScreeningGapGatewayResponse(response, requestId);
  } catch (error) {
    if (!(error instanceof AiGatewayError)) return unavailable(requestId, "service_error", true);
    if (error.kind === "not_configured") return unavailable(requestId, "rules_not_configured", false);
    if (error.kind === "timeout") return unavailable(requestId, "timeout", true);
    if (error.kind === "invalid_response") return unavailable(requestId, "invalid_response", false);
    return unavailable(requestId, "service_error", error.retryable);
  }
}

function unavailable(requestId: string, reason: "rules_not_configured" | "timeout" | "invalid_response" | "service_error", retryable: boolean): ScreeningGapsResponse {
  return { data: { status: "unavailable", reason, retryable, message: "Layanan gap belum tersedia. Tidak ada saran personal yang dibuat." }, meta: { requestId, generatedAt: new Date().toISOString(), demo: false } };
}
