import type { Metadata } from "next";
import { HealthInsightView } from "@/features/insights/components/health-insight-view";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Insight Kesehatan Personal",
  description: "Penjelasan terbatas dan non-diagnostik dari hasil skrining NeuroPrevent.",
  robots: { index: false, follow: false },
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const requested = (await searchParams).session;
  const requestedId = typeof requested === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requested)
    ? requested
    : null;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let source: { screeningSessionId: string; recordedAt: string } | null = null;

  if (supabase && user) {
    let query = supabase
      .from("screening_sessions")
      .select("id, completed_at")
      .eq("user_id", user.id)
      .eq("result_status", "ok")
      .order("completed_at", { ascending: false })
      .limit(1);
    if (requestedId) query = query.eq("id", requestedId);
    const { data } = await query.maybeSingle();
    if (data?.completed_at) source = { screeningSessionId: data.id, recordedAt: data.completed_at };
  }

  return <HealthInsightView source={source} />;
}
