"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ClipboardList,
  FileQuestion,
  History,
  ListChecks,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  screeningGapsResponseSchema,
  type GapDemoScenario,
  type ScreeningGap,
  type ScreeningGapsResponse,
} from "@/features/screening-gaps/screening-gap.contract";

const scenarioLabels: Array<[GapDemoScenario, string]> = [
  ["unknown-bp", "BP belum diketahui"],
  ["empty", "Belum ada assessment"],
  ["completed", "Gap selesai"],
  ["pending", "Menunggu"],
  ["unavailable", "Layanan unavailable"],
];

const gapQueryKeys = {
  currentUser: (scenario: GapDemoScenario) =>
    ["screening-gaps", "current-authenticated-user", scenario] as const,
};

export function ScreeningGapsView() {
  const [scenario, setScenario] = useState<GapDemoScenario>("unknown-bp");
  const isDemo = process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true";
  const query = useQuery({
    queryKey: gapQueryKeys.currentUser(scenario),
    queryFn: ({ signal }) => fetchScreeningGaps(scenario, signal),
  });

  return (
    <main>
      <Link href="/app/screening" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"><ArrowLeft className="size-4" />Kembali ke skrining</Link>
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F02 • NeuroPrevent</span>{isDemo ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}</div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Gap pemeriksaan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Lihat informasi yang belum tersedia, fakta pendukungnya, dan langkah yang dapat dilakukan tanpa menyimpulkan hasil medis.</p>
        </div>
        <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-neuro-slate/10 bg-white px-4 text-sm font-semibold text-neuro-slate disabled:opacity-60"><RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />Perbarui</button>
      </div>

      {isDemo ? (
        <div className="mt-6 rounded-3xl border border-[#ead39f] bg-[#fff9ec] p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#79520f]">Skenario demonstrasi</p>
          <div className="mt-3 flex flex-wrap gap-2">{scenarioLabels.map(([value, label]) => <button key={value} type="button" onClick={() => setScenario(value)} aria-pressed={scenario === value} className="focus-ring rounded-full border border-[#79520f]/15 bg-white px-3 py-2 text-xs font-medium text-[#79520f] aria-pressed:bg-[#79520f] aria-pressed:text-white">{label}</button>)}</div>
        </div>
      ) : null}

      <div className="mt-6" aria-live="polite">
        {query.isPending ? <LoadingState /> : null}
        {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
        {query.data ? <GapContent response={query.data} /> : null}
      </div>
    </main>
  );
}

async function fetchScreeningGaps(
  scenario: GapDemoScenario,
  signal: AbortSignal,
): Promise<ScreeningGapsResponse> {
  const response = await fetch(`/api/screening/gaps?scenario=${scenario}`, {
    headers:
      process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true"
        ? { "X-NeuroCare-Demo": "screening-gap-fixture-v1" }
        : {},
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Screening gaps request failed");
  const payload: unknown = await response.json();
  const parsed = screeningGapsResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid screening gaps response");
  return parsed.data;
}

function GapContent({ response }: { response: ScreeningGapsResponse }) {
  if (response.data.status === "empty") {
    return <StatePanel icon={FileQuestion} title="Belum ada assessment" description={response.data.message}><Link href="/app/screening" className="primary-action mt-6">Mulai skrining<ArrowRight className="size-4" /></Link></StatePanel>;
  }
  if (response.data.status === "unavailable") {
    return <StatePanel icon={ShieldAlert} title="Gap belum dapat dihitung" description={response.data.message} tone="warning" />;
  }

  const completed = response.data.gaps.length > 0 && response.data.gaps.every((gap) => gap.status === "completed");
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
      <section className="space-y-4">
        {completed ? <div className="rounded-3xl border border-[#b9d9bf] bg-[#effaf1] p-5 text-[#245c2d]"><CheckCircle2 className="size-5" /><h2 className="mt-3 font-semibold">Tidak ada gap berdasarkan data demo saat ini</h2><p className="mt-1 text-sm opacity-75">Status selesai tidak berarti hasil pemeriksaan normal; hanya kelengkapan pencatatan yang ditampilkan.</p></div> : null}
        {response.data.gaps.map((gap) => <GapCard key={gap.id} gap={gap} />)}
      </section>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-black/5 bg-white p-5"><ListChecks className="size-5 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">Ringkasan</h2><dl className="mt-4 grid gap-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{response.data.gaps.length}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Terbuka</dt><dd className="font-semibold">{response.data.gaps.filter((gap) => gap.status === "open").length}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Menunggu</dt><dd className="font-semibold">{response.data.gaps.filter((gap) => gap.status === "pending").length}</dd></div></dl></div>
        <div className="rounded-3xl border border-black/5 bg-neuro-blue p-5"><Stethoscope className="size-5 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">Bukan diagnosis</h2><p className="mt-2 text-sm leading-6 text-neuro-slate/65">Gap menunjukkan kelengkapan data atau tindak lanjut dari aturan terverifikasi. Data yang tidak diketahui tidak berarti tinggi, rendah, normal, atau abnormal.</p></div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 text-xs leading-5 text-muted-foreground"><p><strong className="text-neuro-slate">Sumber aturan:</strong> {response.data.ruleSource.label}</p><p className="mt-2"><strong className="text-neuro-slate">Versi:</strong> {response.data.ruleSource.version}</p><p className="mt-2"><strong className="text-neuro-slate">Diperiksa:</strong> {formatDate(response.data.evaluatedAt)}</p></div>
      </aside>
    </div>
  );
}

function GapCard({ gap }: { gap: ScreeningGap }) {
  const status = {
    open: { label: "Perlu dilengkapi", icon: AlertTriangle, className: "bg-[#fff9ec] text-[#79520f]" },
    pending: { label: "Menunggu", icon: CircleDashed, className: "bg-neuro-blue text-neuro-slate" },
    completed: { label: "Selesai", icon: Check, className: "bg-[#effaf1] text-[#245c2d]" },
  }[gap.status];
  const StatusIcon = status.icon;
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}><StatusIcon className="size-3.5" />{status.label}</span><span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">{gapTypeLabel(gap.type)}</span></div>
      <h2 className="mt-6 text-2xl font-medium tracking-[-0.035em] text-neuro-slate">{gap.title}</h2>
      <div className="mt-5 rounded-2xl bg-neuro-cream p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fakta yang tercatat</p><p className="mt-2 text-sm font-medium text-neuro-slate">{gap.supportingFact.label}</p><p className="mt-1 text-xs text-muted-foreground">{gap.supportingFact.recordedAt ? formatDate(gap.supportingFact.recordedAt) : "Belum ada tanggal pemeriksaan"}</p></div>
      <details className="group mt-4 border-y border-black/5 py-1"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-xl py-4 text-sm font-semibold text-neuro-slate">Kenapa disarankan?<ChevronDown className="size-4 transition group-open:rotate-180" /></summary><p className="pb-4 text-sm leading-6 text-muted-foreground">{gap.reason}</p></details>
      <div className="mt-5 flex flex-wrap gap-2">
        {gap.nextActions.map((action) =>
          action.enabled && action.href ? (
            <Link
              key={action.id}
              href={action.href}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-neuro-slate px-4 text-sm font-semibold text-white"
            >
              {action.kind === "view_history" ? <History className="size-4" /> : <ClipboardList className="size-4" />}
              {action.label}
            </Link>
          ) : (
            <AddToPlanButton key={action.id} gap={gap} action={action} />
          )
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/5 pt-4 text-xs text-muted-foreground"><span>Sumber: {gap.source.label}</span><span>Versi: {gap.source.version}</span>{gap.stale ? <span className="font-semibold text-[#79520f]">Perlu dihitung ulang</span> : null}</div>
    </article>
  );
}

function AddToPlanButton({ gap, action }: { gap: ScreeningGap; action: ScreeningGap["nextActions"][number] }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleAdd() {
    setStatus("saving");
    try {
      const res = await fetch("/api/action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: action.label,
          description: `${gap.title}: ${gap.reason}`,
          pathway: "neuroprevent",
          dedupeKey: `gap:${gap.id}:${action.id}`,
          sourceLabel: "Gap Skrining",
          sourceReferenceId: gap.id,
        }),
      });
      if (res.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <Link
        href="/app/action-plan"
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-neuro-green px-4 text-xs font-semibold text-neuro-slate"
      >
        <Check className="size-3.5" />
        Tersimpan di Rencana (Buka)
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={status === "saving"}
      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-neuro-slate/20 bg-white px-4 text-sm font-semibold text-neuro-slate hover:bg-neuro-cream disabled:opacity-50"
    >
      {status === "saving" ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Menyimpan…
        </>
      ) : (
        <>
          <Plus className="size-4" />
          {action.label}
        </>
      )}
    </button>
  );
}

function LoadingState() { return <div className="grid min-h-72 place-items-center rounded-[2rem] border border-black/5 bg-white p-8 text-center"><div><LoaderCircle className="mx-auto size-7 animate-spin text-neuro-slate" /><p className="mt-4 text-sm text-muted-foreground">Memuat gap pemeriksaan…</p></div></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <StatePanel icon={AlertTriangle} title="Data tidak dapat dimuat" description="Koneksi atau respons layanan bermasalah. Tidak ada saran personal yang dibuat." tone="warning"><button type="button" onClick={onRetry} className="primary-action mt-6"><RefreshCw className="size-4" />Coba lagi</button></StatePanel>; }
function StatePanel({ icon: Icon, title, description, tone = "neutral", children }: { icon: typeof AlertTriangle; title: string; description: string; tone?: "neutral" | "warning"; children?: React.ReactNode }) { return <section className={`grid min-h-72 place-items-center rounded-[2rem] border p-8 text-center ${tone === "warning" ? "border-[#ead39f] bg-[#fff9ec]" : "border-black/5 bg-white"}`}><div className="max-w-lg"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-neuro-slate shadow-sm"><Icon className="size-5" /></span><h2 className="mt-5 text-xl font-semibold text-neuro-slate">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{children}</div></section>; }
function gapTypeLabel(type: ScreeningGap["type"]) { return { unknown_measurement: "Data tidak diketahui", checkup_due: "Jadwal pemeriksaan", possible_follow_up: "Tindak lanjut", completed: "Selesai" }[type]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
