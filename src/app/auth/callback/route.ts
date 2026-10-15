import { NextResponse } from "next/server";
import {
  getEmailCallbackVerification,
  getSafeNextPath,
} from "@/features/auth/auth.contract";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = getSafeNextPath(url.searchParams.get("next"));
  const verification = getEmailCallbackVerification(url.searchParams);
  const supabase = await createServerSupabaseClient();

  if (verification && supabase) {
    const { error } = verification.kind === "code"
      ? await supabase.auth.exchangeCodeForSession(verification.code)
      : await supabase.auth.verifyOtp({
          token_hash: verification.tokenHash,
          type: verification.type,
        });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", verification ? "callback_expired" : "callback_invalid");
  return NextResponse.redirect(loginUrl);
}
