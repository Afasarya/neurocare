import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ status: "error", message: "Supabase belum terkonfigurasi." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ status: "error", message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const [measurements, actions, consents, profile] = await Promise.all([
    supabase.from("health_measurements").select("*").eq("user_id", user.id),
    supabase.from("action_items").select("*").eq("user_id", user.id),
    supabase.from("consents").select("*").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    account: {
      userId: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
    profile: profile.data,
    consents: consents.data ?? [],
    measurements: measurements.data ?? [],
    actionItems: actions.data ?? [],
    disclaimer: "Data ini adalah riwayat yang tersimpan di NeuroCare dan diekspor atas permintaan pengguna.",
  };

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="neurocare-health-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store, private",
    },
  });
}
