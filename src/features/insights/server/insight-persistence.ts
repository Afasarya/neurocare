import "server-only";

import type { HealthInsightResponse } from "@/features/insights/health-insight.contract";
import { buildInsightRecordInsert } from "@/features/insights/server/insight-persistence-core";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function persistHealthInsight(
  userId: string,
  result: HealthInsightResponse,
): Promise<"saved" | "not_applicable" | "not_configured" | "error"> {
  const row = buildInsightRecordInsert(userId, result);
  if (!row) return "not_applicable";
  const admin = createAdminSupabaseClient();
  if (!admin) return "not_configured";

  const { error } = await admin.from("insight_records").insert(row);
  return error ? "error" : "saved";
}
