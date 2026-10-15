import Link from "next/link";
import { ArrowRight, HeartHandshake, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  return (
    <main>
      <div className="rounded-[2rem] bg-white p-6 sm:p-9">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#486452]"><ShieldCheck className="size-4" />Akun terlindungi</div>
        <h1 className="mt-4 max-w-2xl text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-5xl">Apa yang ingin kamu pantau?</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Pilih perjalanan sesuai kondisimu. Pilihan ini bukan diagnosis dan dapat dikoreksi saat tahap onboarding lengkap tersedia.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/app/screening" className="focus-ring group rounded-[2rem] bg-neuro-green p-6 text-neuro-slate sm:p-8">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider">NeuroPrevent</span>
          <h2 className="mt-4 text-2xl font-semibold">Saya ingin memantau faktor risiko sejak dini</h2>
          <p className="mt-3 text-sm leading-6 text-neuro-slate/70">Untuk pengguna tanpa riwayat stroke atau TIA yang ingin mengisi skrining terpandu.</p>
          <span className="mt-8 inline-flex items-center gap-2 font-semibold">Mulai skrining <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <Link href="/app/recovery" className="focus-ring group rounded-[2rem] bg-neuro-blue p-6 text-neuro-slate sm:p-8">
          <HeartHandshake className="size-5" />
          <h2 className="mt-4 text-2xl font-semibold">Saya sedang memantau pemulihan pascastroke</h2>
          <p className="mt-3 text-sm leading-6 text-neuro-slate/70">Catat check-in mandiri dan aktivitas tanpa menganggapnya sebagai penilaian klinis.</p>
          <span className="mt-8 inline-flex items-center gap-2 font-semibold">Isi check-in <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </div>
    </main>
  );
}
