import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, ChevronRight, ClipboardCheck, FileQuestion, History } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Riwayat Skrining",
  description: "Riwayat hasil skrining risiko stroke dan kardiovaskular pengguna di NeuroCare.",
  robots: { index: false, follow: false },
};

interface ResultSnapshot {
  category?: string;
  categoryLabel?: string;
  riskCategory?: string;
}

interface InputSnapshot {
  systolicBloodPressure?: number;
  smokingStatus?: string;
  diabetesStatus?: string;
}

interface SessionItem {
  id: string;
  completed_at: string | null;
  result_status: string;
  risk_scope: string | null;
  result_snapshot: unknown;
  input_snapshot: unknown;
  safety_status: string;
}

export default async function ScreeningHistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let sessions: SessionItem[] = [];
  let storageReady = true;

  if (supabase && user) {
    const { data, error } = await supabase
      .from("screening_sessions")
      .select("id, completed_at, result_status, risk_scope, result_snapshot, input_snapshot, safety_status")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        storageReady = false;
      }
    } else {
      sessions = data ?? [];
    }
  }

  return (
    <main className="space-y-6">
      <div className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-10">
        <Link
          href="/app/screening"
          className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"
        >
          <ArrowLeft className="size-4" />
          Kembali ke form skrining
        </Link>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neuro-slate">
              <span className="grid size-8 place-items-center rounded-xl bg-neuro-blue">
                <History className="size-4" />
              </span>
              <span>NeuroPrevent · Rekam Jejak</span>
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-neuro-slate sm:text-4xl">
              Riwayat Skrining Risiko
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Daftar seluruh sesi skrining yang telah Anda selesaikan. Nilai risiko bersumber dari bagan estimasi WHO non-laboratorium Asia Tenggara.
            </p>
          </div>
          <Link
            href="/app/screening"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white hover:bg-neuro-slate/90 shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Skrining Baru
          </Link>
        </div>
      </div>

      {!storageReady ? (
        <section className="rounded-3xl border border-dashed border-amber-300 bg-[#fff9ec] p-6 sm:p-8 text-amber-900">
          <h2 className="text-base font-semibold">Tabel Riwayat Belum Diterapkan di Supabase</h2>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Terapkan migration <code>202610160003_screening_sessions_gaps.sql</code> pada database Supabase Anda agar sesi skrining tersimpan secara permanen.
          </p>
        </section>
      ) : sessions.length === 0 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white p-10 text-center">
          <FileQuestion className="mx-auto size-12 text-neuro-slate/40" />
          <h2 className="mt-4 text-xl font-semibold text-neuro-slate">Belum Ada Riwayat Skrining</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-6">
            Anda belum pernah menyelesaikan skrining risiko stroke di akun ini. Lakukan skrining pertama untuk melihat estimasi risiko kardiovaskular 10 tahun Anda.
          </p>
          <Link
            href="/app/screening"
            className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white hover:bg-neuro-slate/90"
          >
            Mulai Skrining Pertama
            <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const result = session.result_snapshot as ResultSnapshot | null;
            const input = session.input_snapshot as InputSnapshot | null;
            const dateStr = session.completed_at
              ? new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone: "Asia/Jakarta",
                }).format(new Date(session.completed_at))
              : "Waktu tidak tercatat";

            const isEligible = session.result_status === "eligible";
            const riskCategory = result?.riskCategory ?? "Panduan Usia 18–39";

            return (
              <article
                key={session.id}
                className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8 transition hover:border-black/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {dateStr}
                    </span>
                    <h2 className="mt-2 text-xl font-semibold text-neuro-slate sm:text-2xl">
                      {isEligible ? `Kategori Risiko: ${riskCategory}` : "Skrining Panduan Pencegahan"}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider ${
                      riskCategory.toLowerCase().includes("tinggi")
                        ? "bg-red-100 text-red-800"
                        : riskCategory.toLowerCase().includes("sedang")
                        ? "bg-amber-100 text-amber-800"
                        : "bg-neuro-green text-neuro-slate"
                    }`}
                  >
                    {isEligible ? riskCategory : "Rekomendasi Dasar"}
                  </span>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-neuro-cream p-4">
                    <dt className="text-xs text-muted-foreground">Tekanan Darah Sistolik</dt>
                    <dd className="mt-1 text-sm font-semibold text-neuro-slate">
                      {input?.systolicBloodPressure ? `${input.systolicBloodPressure} mmHg` : "Tidak diketahui"}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-neuro-cream p-4">
                    <dt className="text-xs text-muted-foreground">Kebiasaan Merokok</dt>
                    <dd className="mt-1 text-sm font-semibold text-neuro-slate">
                      {input?.smokingStatus === "current" ? "Merokok aktif" : "Tidak merokok"}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-neuro-cream p-4">
                    <dt className="text-xs text-muted-foreground">Riwayat Diabetes</dt>
                    <dd className="mt-1 text-sm font-semibold text-neuro-slate">
                      {input?.diabetesStatus === "yes" ? "Ada riwayat" : "Tidak ada"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/5 pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-neuro-slate" />
                    Sumber: WHO SEAR Non-Laboratory Chart
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href="/app/screening/gaps"
                      className="focus-ring inline-flex items-center gap-1 rounded-full bg-neuro-cream px-3 py-1.5 font-semibold text-neuro-slate hover:bg-black/5"
                    >
                      Lihat Gap Terkait
                      <ChevronRight className="size-3.5" />
                    </Link>
                    <Link
                      href="/app/insights"
                      className="focus-ring inline-flex items-center gap-1 rounded-full bg-neuro-cream px-3 py-1.5 font-semibold text-neuro-slate hover:bg-black/5"
                    >
                      Buka Insight AI
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
