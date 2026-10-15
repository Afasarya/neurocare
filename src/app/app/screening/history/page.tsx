import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, DatabaseZap, History } from "lucide-react";

export const metadata: Metadata = {
  title: "Riwayat Skrining",
  robots: { index: false, follow: false },
};

export default function ScreeningHistoryPage() {
  return (
    <main className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-10">
      <Link href="/app/screening" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"><ArrowLeft className="size-4" />Kembali ke skrining</Link>
      <div className="mt-10 max-w-2xl">
        <span className="grid size-12 place-items-center rounded-2xl bg-neuro-blue text-neuro-slate"><History className="size-5" /></span>
        <h1 className="mt-6 text-3xl font-medium tracking-[-0.04em] text-neuro-slate sm:text-4xl">Riwayat skrining</h1>
        <p className="mt-4 leading-7 text-muted-foreground">Riwayat hanya akan menampilkan hasil yang benar-benar tersimpan untuk akun Anda, lengkap dengan tanggal, status, sumber, dan versi engine.</p>
      </div>
      <div className="mt-10 rounded-3xl border border-dashed border-neuro-slate/15 bg-neuro-cream p-6 sm:p-8">
        <DatabaseZap className="size-6 text-neuro-slate" />
        <h2 className="mt-5 text-lg font-semibold text-neuro-slate">Penyimpanan belum diaktifkan</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Migration, kebijakan retensi, autentikasi, dan RLS `screening_sessions` belum disetujui. Untuk menjaga privasi, mode demo tidak menyimpan jawaban atau membuat riwayat palsu.</p>
      </div>
    </main>
  );
}
