import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const consentPostSchema = z.object({
  purpose: z.enum(["core_health_processing", "external_ai", "camera"]),
  action: z.enum(["granted", "withdrawn"]),
  policyVersion: z.string().min(1).default("v1.0"),
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

  const { data, error } = await supabase
    .from("consents")
    .select("purpose, action, policy_version, recorded_at")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  if (error) {
    return Response.json({ status: "error", message: "Gagal mengambil data persetujuan." }, { status: 500 });
  }

  // Group by purpose to get latest status
  const latestByPurpose: Record<string, { action: string; policyVersion: string; recordedAt: string }> = {};
  for (const row of data ?? []) {
    if (!latestByPurpose[row.purpose]) {
      latestByPurpose[row.purpose] = {
        action: row.action,
        policyVersion: row.policy_version,
        recordedAt: row.recorded_at,
      };
    }
  }

  return Response.json({
    status: "ok",
    consents: {
      coreHealthProcessing: latestByPurpose["core_health_processing"]?.action === "granted",
      externalAi: latestByPurpose["external_ai"]?.action === "granted",
      camera: latestByPurpose["camera"]?.action === "granted",
    },
    raw: latestByPurpose,
  });
}

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
    return Response.json({ status: "error", message: "Format payload tidak valid." }, { status: 400 });
  }

  const parsed = consentPostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ status: "error", message: "Data persetujuan tidak valid.", errors: parsed.error.issues }, { status: 400 });
  }

  const { error } = await supabase.from("consents").insert({
    user_id: user.id,
    purpose: parsed.data.purpose,
    action: parsed.data.action,
    policy_version: parsed.data.policyVersion,
    recorded_at: new Date().toISOString(),
  });

  if (error) {
    return Response.json({ status: "error", message: "Gagal mencatat persetujuan ke database." }, { status: 500 });
  }

  return Response.json({
    status: "ok",
    message: `Persetujuan ${parsed.data.purpose} berhasil diatur ke ${parsed.data.action}.`,
    action: parsed.data.action,
    purpose: parsed.data.purpose,
  });
}
