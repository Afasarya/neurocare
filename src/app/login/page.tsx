import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSafeNextPath } from "@/features/auth/auth.contract";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Masuk" };
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(typeof params.next === "string" ? params.next : undefined);
  const initialError = getCallbackMessage(
    typeof params.error === "string" ? params.error : undefined,
  );

  return (
    <AuthShell
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan catatan dan perjalanan kesehatanmu."
      footer={<>Belum punya akun? <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-neuro-slate underline underline-offset-4">Daftar</Link></>}
    >
      <AuthForm mode="login" nextPath={nextPath} initialError={initialError} />
    </AuthShell>
  );
}

function getCallbackMessage(error: string | undefined) {
  if (error === "callback_expired") {
    return "Tautan konfirmasi sudah kedaluwarsa atau pernah digunakan. Masuk jika akun sudah aktif, atau daftar kembali untuk meminta tautan baru.";
  }
  if (error === "callback_invalid") {
    return "Tautan konfirmasi tidak lengkap atau tidak sesuai. Buka tautan terbaru langsung dari email.";
  }
  return undefined;
}
