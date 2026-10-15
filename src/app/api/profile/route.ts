import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const profilePatchSchema = z.object({
  preferredPathway: z.enum(["neuroprevent", "neurorecovery"]).nullable(),
});

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ status: "error", message: "Supabase belum terkonfigurasi." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ status: "error", message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_pathway, locale, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({
    status: "ok",
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
    profile: profile ?? {
      preferred_pathway: null,
      locale: "id-ID",
      created_at: user.created_at,
      updated_at: user.created_at,
    },
  });
}

export async function PATCH(request: Request) {
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

  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ status: "error", message: "Data tidak valid.", errors: parsed.error.issues }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      preferred_pathway: parsed.data.preferredPathway,
      locale: "id-ID",
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return Response.json({ status: "error", message: "Gagal memperbarui profil." }, { status: 500 });
  }

  return Response.json({
    status: "ok",
    preferredPathway: parsed.data.preferredPathway,
  });
}
