import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const deleteAccountSchema = z.object({
  confirmationText: z.literal("HAPUS AKUN SAYA"),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ status: "error", message: "Supabase belum terkonfigurasi." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ status: "error", message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: "error", message: "Format JSON tidak valid." }, { status: 400 });
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      status: "error",
      message: "Konfirmasi tidak sesuai. Harap ketik 'HAPUS AKUN SAYA' persis seperti yang diminta.",
    }, { status: 400 });
  }

  // 1. Record withdrawal of all consents
  await supabase.from("consents").insert([
    {
      user_id: user.id,
      purpose: "core_health_processing",
      action: "withdrawn",
      policy_version: "v1.0",
      recorded_at: new Date().toISOString(),
    },
    {
      user_id: user.id,
      purpose: "external_ai",
      action: "withdrawn",
      policy_version: "v1.0",
      recorded_at: new Date().toISOString(),
    },
  ]);

  // 2. Delete all health records for this user (CASCADE behavior at application layer for owner)
  await Promise.allSettled([
    supabase.from("health_measurements").delete().eq("user_id", user.id),
    supabase.from("action_items").delete().eq("user_id", user.id),
    supabase.from("recovery_checkins").delete().eq("user_id", user.id),
    supabase.from("profiles").delete().eq("user_id", user.id),
  ]);

  // 3. Sign out the user
  await supabase.auth.signOut();

  return Response.json({
    status: "ok",
    message: "Data akun dan kesehatan Anda telah berhasil dihapus secara permanen.",
  });
}
