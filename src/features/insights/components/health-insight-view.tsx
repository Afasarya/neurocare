"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ClipboardCheck,
  Clock3,
  Info,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
  healthInsightResponseSchema,
  type HealthInsightRequest,
  type HealthInsightResponse,
  type InsightSections,
} from "@/features/insights/health-insight.contract";

type DemoScenario = "approved" | "unavailable" | "emergency";

const demoSessionId = "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27";
const demoRecordedAt = "2026-10-15T08:30:00.000Z";

type InsightSource = { screeningSessionId: string; recordedAt: string };

const fallbackSections: InsightSections = {
  summary: "Penjelasan AI belum dibuat. Fakta sumber tetap tersedia dan tidak diubah.",
  recordedFactors: ["Tinjau faktor yang tercatat langsung dari hasil skrining."],
  incompleteData: ["Tinjau data yang belum lengkap sebelum melanjutkan."],
  generalFollowUp: ["Lengkapi informasi yang tersedia dan konsultasikan pertanyaan kesehatan dengan tenaga kesehatan."],
  limitations: ["Template umum ini bukan penjelasan personal, diagnosis, atau rekomendasi pengobatan."],
};

export function HealthInsightView({ source }: { source: InsightSource | null }) {
  const [scenario, setScenario] = useState<DemoScenario>("approved");
  const [consent, setConsent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isDemo = process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true";
  const emergency = scenario === "emergency";
  const activeSource = isDemo ? { screeningSessionId: demoSessionId, recordedAt: demoRecordedAt } : source;

  const mutation = useMutation({
    mutationFn: async (input: HealthInsightRequest) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch("/api/ai/health-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isDemo
            ? { "X-NeuroCare-Insight-Demo": scenario === "unavailable" ? "unavailable" : "approved" }
            : {}),
        },
        body: JSON.stringify(input),
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
      });
      if (!response.ok) throw new Error("Insight request failed");
      const payload: unknown = await response.json();
      const parsed = healthInsightResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("Invalid insight response");
      return parsed.data;
    },
    onSettled: () => {
      setCooldown(true);
    },
  });

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (!cooldown) return;
    const timeoutId = window.setTimeout(() => setCooldown(false), 15_000);
    return () => window.clearTimeout(timeoutId);
  }, [cooldown]);

  function chooseScenario(next: DemoScenario) {
    abortRef.current?.abort();
    mutation.reset();
    setScenario(next);
    setConsent(false);
    setCooldown(false);
  }

  function generateInsight() {
    if (!consent || emergency || mutation.isPending) return;
    if (!activeSource) return;
    mutation.mutate(createRequest(scenario, activeSource));
  }

  const displayedSections = getDisplayedSections(consent, mutation.data);

  return (
    <main>
      <Link href="/app/screening" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"><ArrowLeft className="size-4" />Kembali ke skrining</Link>
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F04 · NeuroPrevent</span>
            {isDemo ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Insight kesehatan personal</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Penjelasan berbantuan AI hanya merangkum fakta skrining yang sudah tersedia. AI tidak menghitung ulang, mengubah, atau menggantikan hasil sumber.</p>
        </div>
      </div>

      {isDemo ? <DemoControls scenario={scenario} onChange={chooseScenario} /> : null}

      {emergency ? (
        <section className="mt-6 rounded-[2rem] border border-[#e6b4b8] bg-[#fff4f4] p-6 text-[#8b2028] sm:p-8" role="alert">
          <ShieldAlert className="size-7" />
          <h2 className="mt-4 text-2xl font-semibold">Insight rutin dihentikan</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6">Cari bantuan darurat setempat atau fasilitas kesehatan terdekat. NeuroCare tidak mengirim permintaan ke AI pada status keselamatan ini.</p>
        </section>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6">
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Penjelasan berbantuan AI</p><h2 className="mt-2 text-2xl font-semibold text-neuro-slate">Ringkasan yang dibatasi sumber</h2></div>
              <span className="inline-flex items-center gap-2 rounded-full bg-neuro-blue px-3 py-2 text-xs font-semibold text-neuro-slate"><Sparkles className="size-3.5" />AI tidak mengubah fakta</span>
            </div>

            <SourceFacts source={activeSource} demo={isDemo} />

            {!activeSource ? <div className="mt-5 rounded-2xl border border-[#ead39f] bg-[#fff9ec] p-4 text-[#79520f]" role="status"><p className="text-sm font-semibold">Belum ada hasil skrining yang dapat digunakan</p><p className="mt-1 text-xs leading-5 opacity-75">Selesaikan skrining yang memenuhi syarat, lalu buka insight dari riwayat skrining.</p><Link href="/app/screening/history" className="mt-3 inline-flex text-xs font-semibold underline underline-offset-4">Buka riwayat skrining</Link></div> : null}

            {!consent ? <TemplateNotice /> : null}
            {mutation.isPending ? <LoadingState /> : null}
            {mutation.isError ? <FallbackNotice message="Layanan tidak dapat dihubungi atau respons tidak valid. Template aman ditampilkan tanpa mengubah fakta skrining." /> : null}
            {mutation.data?.data.status === "unavailable" ? <FallbackNotice message={mutation.data.data.message} /> : null}
            {mutation.data?.data.status === "template" ? <FallbackNotice message="Respons AI tidak digunakan. Template aman ditampilkan." /> : null}

            {!mutation.isPending && displayedSections ? (
              <InsightSectionsView
                sections={displayedSections}
                generatedBy={mutation.data?.data.status === "ok" ? "ai" : "template"}
                demo={mutation.data?.meta.demo ?? false}
              />
            ) : null}

            <div className="mt-7 border-t border-black/5 pt-6">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neuro-slate/10 p-4">
                <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); mutation.reset(); }} className="mt-1 size-4 accent-[#243746]" />
                <span><span className="block text-sm font-semibold text-neuro-slate">Saya mengonfirmasi pengiriman data skrining minimum untuk membuat penjelasan AI.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Nama dan kontak tidak disertakan. Persetujuan AI eksternal harus aktif di Profil; insight tervalidasi disimpan pada akun dan dapat muncul di timeline kesehatan.</span></span>
              </label>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={generateInsight} disabled={!activeSource || !consent || mutation.isPending || cooldown} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : mutation.data || mutation.isError ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}{mutation.isPending ? "Membuat insight…" : mutation.isError ? "Coba lagi" : mutation.data ? "Buat ulang insight" : "Buat insight"}</button>
                {cooldown ? <p className="text-xs text-muted-foreground" role="status">Tunggu sebentar sebelum meminta ulang untuk membatasi permintaan.</p> : null}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <InfoCard icon={Bot} title="Peran AI">AI hanya menyusun penjelasan dari data sumber. Nilai, status kelayakan, dan status keselamatan tidak boleh diubah.</InfoCard>
            <InfoCard icon={LockKeyhole} title="Data minimum">Permintaan hanya membawa ID sesi, status, label fakta/gap, waktu, dan sumber. Tidak ada nama atau kontak pada kontrak.</InfoCard>
            <InfoCard icon={Info} title="Bukan nasihat medis">Insight tidak membuat diagnosis, meresepkan obat, atau menggantikan konsultasi tenaga kesehatan.</InfoCard>
          </aside>
        </div>
      )}
    </main>
  );
}

function createRequest(scenario: DemoScenario, source: InsightSource): HealthInsightRequest {
  return {
    requestId: crypto.randomUUID(),
    schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
    consentToExternalAi: true,
    source: {
      screeningSessionId: source.screeningSessionId,
      recordedAt: source.recordedAt,
      safetyStatus: scenario === "emergency" ? "emergency" : "clear",
      screeningStatus: "insufficient_data",
      riskScope: null,
      categoryLabel: null,
      factorLabels: ["Jalur NeuroPrevent tercatat"],
      incompleteDataLabels: ["Tekanan darah sistolik belum tersedia"],
      provenance: { label: "Fixture skrining F01 dan gap F02", version: "demo-safe-v1" },
    },
  };
}

function getDisplayedSections(consent: boolean, response?: HealthInsightResponse) {
  if (!consent) return fallbackSections;
  if (!response) return null;
  if (response.data.status === "ok" || response.data.status === "template") return response.data.sections;
  return fallbackSections;
}

function SourceFacts({ source, demo }: { source: InsightSource | null; demo: boolean }) {
  return <div className="mt-6 rounded-3xl bg-neuro-cream p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-neuro-slate">Sumber insight</h3><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neuro-slate">Divalidasi ulang di server</span></div><dl className="mt-4 grid gap-3 text-sm"><div className="flex gap-3"><ClipboardCheck className="mt-0.5 size-4 shrink-0 text-neuro-slate" /><div><dt className="font-semibold text-neuro-slate">Status sumber</dt><dd className="mt-1 text-muted-foreground">{source ? "Hasil skrining tersimpan dipilih sebagai sumber." : "Belum ada hasil skrining yang memenuhi syarat."}</dd></div></div><div className="flex gap-3"><ListChecks className="mt-0.5 size-4 shrink-0 text-neuro-slate" /><div><dt className="font-semibold text-neuro-slate">Data yang dikirim</dt><dd className="mt-1 text-muted-foreground">Server memuat ulang fakta dan gap milik akun; fakta dari browser tidak dipercaya sebagai sumber.</dd></div></div><div className="flex gap-3"><Clock3 className="mt-0.5 size-4 shrink-0 text-neuro-slate" /><div><dt className="font-semibold text-neuro-slate">Sumber dan waktu</dt><dd className="mt-1 text-muted-foreground">{source ? `${demo ? "Fixture sintetis" : "Skrining tersimpan"} · ${formatDate(source.recordedAt)}` : "Belum tersedia"}</dd></div></div></dl></div>;
}

function InsightSectionsView({ sections, generatedBy, demo }: { sections: InsightSections; generatedBy: "ai" | "template"; demo: boolean }) {
  const groups: Array<[string, string[]]> = [
    ["Faktor yang tercatat", sections.recordedFactors],
    ["Data yang belum lengkap", sections.incompleteData],
    ["Tindakan lanjutan umum", sections.generalFollowUp],
    ["Keterbatasan", sections.limitations],
  ];
  const label = generatedBy === "ai"
    ? demo ? "Ditulis AI · data demo (simulasi)" : "Ditulis AI · hasil tersimpan"
    : "Template umum · bukan AI personal";
  return <div className="mt-6" aria-live="polite"><div className={`rounded-2xl p-4 ${generatedBy === "ai" ? "bg-neuro-green" : "bg-neuro-blue"}`}><p className="text-xs font-semibold uppercase tracking-wider text-neuro-slate/60">{label}</p><p className="mt-2 text-sm leading-6 text-neuro-slate">{sections.summary}</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{groups.map(([title, items]) => <section key={title} className="rounded-2xl border border-black/5 p-4"><h3 className="text-sm font-semibold text-neuro-slate">{title}</h3><ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div></div>;
}

function TemplateNotice() { return <div className="mt-5 rounded-2xl border border-[#ead39f] bg-[#fff9ec] p-4 text-[#79520f]"><p className="text-sm font-semibold">Belum ada persetujuan pengiriman</p><p className="mt-1 text-xs leading-5 opacity-75">Tidak ada panggilan AI. Template umum di bawah tidak menggunakan atau menafsirkan data personal.</p></div>; }
function LoadingState() { return <div className="mt-6 grid min-h-40 place-items-center rounded-2xl bg-neuro-cream p-6 text-center"><div><LoaderCircle className="mx-auto size-6 animate-spin text-neuro-slate" /><p className="mt-3 text-sm text-muted-foreground">Memvalidasi penjelasan terstruktur…</p></div></div>; }
function FallbackNotice({ message }: { message: string }) { return <div className="mt-5 flex gap-3 rounded-2xl border border-[#ead39f] bg-[#fff9ec] p-4 text-[#79520f]" role="status"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-semibold">Insight AI tidak digunakan</p><p className="mt-1 text-xs leading-5 opacity-75">{message}</p></div></div>; }
function InfoCard({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) { return <div className="rounded-3xl border border-black/5 bg-white p-5"><Icon className="size-5 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p></div>; }

function DemoControls({ scenario, onChange }: { scenario: DemoScenario; onChange: (value: DemoScenario) => void }) {
  const choices: Array<[DemoScenario, string]> = [["approved", "Respons terstruktur"], ["unavailable", "AI tidak tersedia"], ["emergency", "Status keselamatan"]];
  return <div className="mt-6 rounded-3xl border border-[#ead39f] bg-[#fff9ec] p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#79520f]">Skenario data demo (simulasi)</p><div className="mt-3 flex flex-wrap gap-2">{choices.map(([value, label]) => <button type="button" key={value} onClick={() => onChange(value)} aria-pressed={scenario === value} className="focus-ring rounded-full border border-[#79520f]/15 bg-white px-3 py-2 text-xs font-medium text-[#79520f] aria-pressed:bg-[#79520f] aria-pressed:text-white">{label}</button>)}</div></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

