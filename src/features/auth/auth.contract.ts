import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(72, "Kata sandi maksimal 72 karakter.");

export const loginSchema = z.object({
  email: z.string().trim().email("Masukkan alamat email yang valid."),
  password: passwordSchema,
  next: z.string().optional(),
});

export const registrationSchema = loginSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Konfirmasi kata sandi belum sama.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/app") || value.startsWith("//")) {
    return "/app/dashboard";
  }

  return value;
}

export function getPublicAuthError(code: string | undefined) {
  switch (code) {
    case "invalid_credentials":
      return "Email atau kata sandi tidak cocok.";
    case "email_not_confirmed":
      return "Konfirmasi email terlebih dahulu, lalu coba masuk kembali.";
    case "user_already_exists":
      return "Akun dengan email ini sudah terdaftar. Silakan masuk.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    default:
      return "Permintaan belum berhasil. Periksa data dan koneksi, lalu coba lagi.";
  }
}

export function hasTrustedRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

const emailCallbackTypes = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export type EmailCallbackVerification =
  | { kind: "code"; code: string }
  | { kind: "token_hash"; tokenHash: string; type: string };

/**
 * Supabase email templates can use the PKCE `code` flow or the
 * `token_hash` + `type` flow. Accept only the documented email flows.
 */
export function getEmailCallbackVerification(
  params: Pick<URLSearchParams, "get">,
): EmailCallbackVerification | null {
  const code = params.get("code");
  if (code) return { kind: "code", code };

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && type && emailCallbackTypes.has(type)) {
    return { kind: "token_hash", tokenHash, type };
  }

  return null;
}
