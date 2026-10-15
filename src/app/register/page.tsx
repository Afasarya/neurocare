import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSafeNextPath } from "@/features/auth/auth.contract";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Daftar" };
export const instant = false;

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(typeof params.next === "string" ? params.next : undefined);

  return (
    <AuthShell
      title="Buat akun NeuroCare"
      description="Gunakan email aktif. Jika konfirmasi email diaktifkan, kami akan meminta Supabase mengirim tautan verifikasi."
      footer={<>Sudah punya akun? <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-neuro-slate underline underline-offset-4">Masuk</Link></>}
    >
      <AuthForm mode="register" nextPath={nextPath} />
    </AuthShell>
  );
}
