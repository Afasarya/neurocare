import type { Database, Json } from "@/lib/supabase/database.types";
import type { HealthInsightResponse } from "@/features/insights/health-insight.contract";

type InsightInsert = Database["public"]["Tables"]["insight_records"]["Insert"];

export function buildInsightRecordInsert(
  userId: string,
  result: HealthInsightResponse,
): InsightInsert | null {
  if (result.data.status === "ok") {
    return {
      user_id: userId,
      screening_session_id: result.data.provenance.sourceScreeningSessionId,
      source_mode: "live",
      generated_by: "ai",
      model_version: result.data.provenance.model,
      schema_version: result.data.provenance.schemaVersion,
      sections: result.data.sections as unknown as Json,
      generated_at: result.meta.generatedAt,
    };
  }
  if (result.data.status === "template" && result.data.reason === "gateway_fallback") {
    return {
      user_id: userId,
      screening_session_id: result.data.provenance.sourceScreeningSessionId,
      source_mode: "template",
      generated_by: "template",
      model_version: null,
      schema_version: result.data.provenance.schemaVersion,
      sections: result.data.sections as unknown as Json,
      generated_at: result.meta.generatedAt,
    };
  }
  return null;
}
