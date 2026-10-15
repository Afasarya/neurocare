import { NextResponse } from "next/server";
import {
  getPublicAuthError,
  getSafeNextPath,
  hasTrustedRequestOrigin,
  registrationSchema,
} from "@/features/auth/auth.contract";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Permintaan ditolak." }, { status: 403 });
  }

  const payload: unknown = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(payload);

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

  const next = getSafeNextPath(parsed.data.next);
  const callbackUrl = new URL("/auth/callback", request.url);
  callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: callbackUrl.toString() },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: getPublicAuthError(error.code) },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    next,
    requiresEmailConfirmation: !data.session,
  });
}
