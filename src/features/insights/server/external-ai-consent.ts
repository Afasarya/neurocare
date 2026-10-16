import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Resolves the latest append-only consent event. Errors intentionally fail
 * closed: an unavailable consent store must never authorize an AI request.
 */
export async function hasActiveExternalAiConsent(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  return hasActiveConsent(supabase, userId, "external_ai");
}

export async function hasActiveConsent(
  supabase: SupabaseClient<Database>,
  userId: string,
  purpose: "core_health_processing" | "external_ai" | "camera",
): Promise<boolean> {
  const { data, error } = await supabase
    .from("consents")
    .select("action")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return !error && data?.action === "granted";
}
