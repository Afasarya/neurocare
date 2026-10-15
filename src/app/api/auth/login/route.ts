import { NextResponse } from "next/server";
import { getPublicAuthError, getSafeNextPath, hasTrustedRequestOrigin, loginSchema } from "@/features/auth/auth.contract";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Permintaan ditolak." }, { status: 403 });
  }

  const payload: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Periksa kembali email dan kata sandi." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Layanan akun belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: getPublicAuthError(error.code) },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true, next: getSafeNextPath(parsed.data.next) });
}
