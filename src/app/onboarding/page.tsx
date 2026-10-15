"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [coreConsent, setCoreConsent] = useState(true);
  const [aiConsent, setAiConsent] = useState(true);
  const [pathway, setPathway] = useState<"neuroprevent" | "neurorecovery">("neuroprevent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinishOnboarding() {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Record core health processing consent
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "core_health_processing",
          action: coreConsent ? "granted" : "withdrawn",
          policyVersion: "v1.0",
        }),
      });

      // 2. Record external AI consent
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "external_ai",
          action: aiConsent ? "granted" : "withdrawn",
          policyVersion: "v1.0",
        }),
      });

      // 3. Update preferred pathway in profile
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredPathway: pathway }),
      });

      // Redirect to dashboard
      router.push("/app/dashboard");
    } catch {
      setError("Gagal menyimpan preferensi awal. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f2] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-black/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/icons/neurocare-mark.svg" width={32} height={32} alt="" className="rounded-xl" />
            <span className="font-semibold text-neuro-slate">NeuroCare</span>
          </div>
          <span className="rounded-full bg-neuro-cream px-3 py-1 font-mono text-xs text-neuro-slate font-medium">
            Langkah {step} dari 2
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-800" role="alert">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neuro-slate sm:text-3xl">
                Privasi & Persetujuan Anda
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                Kami menjunjung tinggi kedaulatan data kesehatan Anda sesuai UU PDP. Sebelum mulai, tentukan bagaimana data Anda diproses.
              </p>
            </div>

            <div className="space-y-4">
              {/* Core Consent */}
              <label className="flex items-start gap-3.5 rounded-2xl border border-black/10 p-4 bg-neuro-cream/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={coreConsent}
                  onChange={(e) => setCoreConsent(e.target.checked)}
                  className="mt-1 size-4 rounded accent-neuro-slate"
                />
                <div className="text-xs leading-5">
                  <p className="font-semibold text-neuro-slate">Pemrosesan Data Kesehatan Utama (Wajib)</p>
                  <p className="text-muted-foreground mt-0.5">
                    Mengizinkan NeuroCare menyimpan riwayat pengukuran tensi, check-in, dan rencana tindakan Anda dengan enkripsi dan proteksi RLS per akun.
                  </p>
                </div>
              </label>

              {/* AI Consent */}
              <label className="flex items-start gap-3.5 rounded-2xl border border-black/10 p-4 bg-white cursor-pointer hover:bg-neuro-cream/30 transition">
                <input
                  type="checkbox"
                  checked={aiConsent}
                  onChange={(e) => setAiConsent(e.target.checked)}
                  className="mt-1 size-4 rounded accent-neuro-slate"
                />
                <div className="text-xs leading-5">
                  <div className="flex items-center gap-1.5 font-semibold text-neuro-slate">
                    <Sparkles className="size-3.5 text-neuro-slate" />
                    <span>Analisis Rekomendasi AI (Opsional)</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    Mengizinkan analisis faktor risiko menggunakan model AI terverifikasi. Jika tidak dicentang, aplikasi akan menggunakan template deterministik standar. Dapat diubah kapan saja di Profil.
                  </p>
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!coreConsent}
              className="focus-ring mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white hover:bg-neuro-slate/90 disabled:opacity-50"
            >
              Lanjutkan ke Pilihan Jalur
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neuro-slate sm:text-3xl">
                Pilih Jalur Utama Layanan
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                Pilih fokus utama Anda saat ini. Pilihan ini akan menyesuaikan antarmuka dan rekomendasi tindakan awal Anda.
              </p>
            </div>

            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => setPathway("neuroprevent")}
                className={`focus-ring rounded-2xl border p-5 text-left transition ${
                  pathway === "neuroprevent"
                    ? "border-neuro-slate bg-neuro-green font-semibold"
                    : "border-black/10 bg-white hover:bg-neuro-cream"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-neuro-slate">Jalur 1</span>
                  {pathway === "neuroprevent" && <Check className="size-4 text-neuro-slate" />}
                </div>
                <p className="mt-2 text-base font-semibold text-neuro-slate">NeuroPrevent (Pencegahan Dini)</p>
                <p className="mt-1 text-xs text-neuro-slate/75 leading-5">
                  Untuk individu sehat yang ingin skrining risiko CVD 10 tahun dan memantau parameter tekanan darah secara berkala.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPathway("neurorecovery")}
                className={`focus-ring rounded-2xl border p-5 text-left transition ${
                  pathway === "neurorecovery"
                    ? "border-neuro-slate bg-neuro-blue font-semibold"
                    : "border-black/10 bg-white hover:bg-neuro-cream"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-neuro-slate">Jalur 2</span>
                  {pathway === "neurorecovery" && <Check className="size-4 text-neuro-slate" />}
                </div>
                <p className="mt-2 text-base font-semibold text-neuro-slate">NeuroRecovery (Pemantauan Pemulihan)</p>
                <p className="mt-1 text-xs text-neuro-slate/75 leading-5">
                  Untuk penyintas stroke atau pendamping yang ingin mencatat check-in pemulihan mandiri dan latihan gerak di rumah.
                </p>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="focus-ring flex min-h-12 items-center justify-center rounded-full border border-black/10 px-6 text-sm font-semibold text-neuro-slate hover:bg-neuro-cream"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={submitting}
                className="focus-ring flex-1 flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white hover:bg-neuro-slate/90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
