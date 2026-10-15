"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardPlus,
  Clock3,
  Database,
  Info,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  recoveryProgressResponseSchema,
  type ProgressCheckin,
  type ProgressRange,
  type RecoveryProgressResponse,
} from "@/features/recovery-progress/progress.contract";
import { buildCheckinCountSeries, describeCheckinData } from "@/features/recovery-progress/progress.selectors";

type DemoScenario = "multiple" | "one" | "empty" | "no-baseline" | "sparse" | "with-activity" | "unavailable" | "network-error";

export function RecoveryProgressView() {
  const [range, setRange] = useState<ProgressRange>("90d");
  const [scenario, setScenario] = useState<DemoScenario>("multiple");
  const [emergency, setEmergency] = useState(false);
  const isDevelopment = process.env.NODE_ENV !== "production";
  const query = useQuery({
    queryKey: ["recovery-progress", range, scenario],
    queryFn: ({ signal }) => fetchProgress(range, scenario, signal),
  });

  if (emergency) return <EmergencyPanel onBack={() => setEmergency(false)} />;

  return (
    <main>
      <Link href="/app/recovery" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"><ArrowLeft className="size-4" />Kembali ke check-in</Link>
      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F07 · NeuroRecovery</span>{isDevelopment ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}</div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Perubahan catatan pemulihan</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Lihat catatan mandiri dan aktivitas yang benar-benar tersimpan. Tampilan ini bukan skor pemulihan, diagnosis, atau bukti perubahan neurologis.</p>
        </div>
        <div className="flex rounded-full border border-black/5 bg-white p-1" aria-label="Pilih rentang waktu">{(["30d", "90d", "all"] as const).map((value) => <button key={value} type="button" onClick={() => setRange(value)} aria-pressed={range === value} className={`focus-ring min-h-10 rounded-full px-4 text-xs font-semibold ${range === value ? "bg-neuro-slate text-white" : "text-muted-foreground"}`}>{value === "all" ? "Semua" : value === "30d" ? "30 hari" : "90 hari"}</button>)}</div>
      </div>

      {isDevelopment ? <DemoControls value={scenario} onChange={setScenario} /> : null}

      <section className="mt-5 flex flex-col gap-3 rounded-3xl border border-[#e6b4b8] bg-[#fff4f4] p-4 text-[#8b2028] sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><div><h2 className="text-sm font-semibold">Gejala baru yang muncul mendadak selalu lebih penting daripada grafik.</h2><p className="mt-1 text-xs leading-5 opacity-80">Jangan menunggu ringkasan aplikasi bila muncul wajah menurun satu sisi, kelemahan satu sisi, atau kesulitan bicara.</p></div></div><button type="button" onClick={() => setEmergency(true)} className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold"><AlertTriangle className="size-4" />Tampilkan bantuan darurat</button></section>

      {query.isPending ? <LoadingState /> : null}
      {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
      {query.data?.data.status === "empty" ? <EmptyState message={query.data.data.message} /> : null}
      {query.data?.data.status === "unavailable" ? <UnavailableState response={query.data} onRetry={() => query.refetch()} /> : null}
      {query.data?.data.status === "ok" ? <ProgressContent data={query.data.data} meta={query.data.meta} /> : null}
    </main>
  );
}

function ProgressContent({ data, meta }: { data: Extract<RecoveryProgressResponse["data"], { status: "ok" }>; meta: RecoveryProgressResponse["meta"] }) {
  const { checkins, activities, aggregates, insight } = data;
  const series = buildCheckinCountSeries(checkins).map((point) => ({ ...point, dateLabel: formatShortDate(point.recordedAt) }));
  const hasBaseline = checkins.some((checkin) => checkin.isBaseline);
  const limited = checkins.length <= 2;
  const activityAvailable = activities.status === "ok";

  return <>
    {!hasBaseline ? <Notice title="Baseline belum tersedia" message="Catatan pada rentang ini tidak memuat baseline. Pilih rentang yang lebih panjang atau buat check-in awal sebelum membandingkan perubahan catatan." /> : null}
    {limited ? <Notice title="Data masih terbatas" message={describeCheckinData(checkins)} /> : null}

    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan progress">
      <SummaryCard icon={ClipboardPlus} label="Check-in tercatat" value={String(aggregates.checkinCount)} hint="laporan mandiri" />
      <SummaryCard icon={CalendarDays} label="Catatan terakhir" value={aggregates.latestCheckinAt ? formatDate(aggregates.latestCheckinAt) : "Data tidak tersedia"} hint="zona waktu Asia/Jakarta" />
      <SummaryCard icon={Activity} label="Aktivitas tervalidasi" value={aggregates.activityCount === null ? "Data tidak tersedia" : String(aggregates.activityCount)} hint={activityAvailable ? "sesi F06" : "F06 belum tersedia"} />
      <SummaryCard icon={Clock3} label="Durasi aktivitas" value={aggregates.totalActivityDurationSeconds === null ? "Data tidak tersedia" : formatDuration(aggregates.totalActivityDurationSeconds)} hint={aggregates.totalDetectedReps === null ? "repetisi tidak tersedia" : `${aggregates.totalDetectedReps} repetisi terdeteksi`} />
    </section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="checkin-chart-title">
        <div className="flex items-start gap-3"><ChartNoAxesCombined className="mt-1 size-6 text-neuro-slate" /><div><h2 id="checkin-chart-title" className="text-xl font-semibold text-neuro-slate">Jumlah check-in kumulatif</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Grafik ini hanya menghitung catatan pada rentang terpilih. Garis waktu bukan nilai kemampuan atau tingkat pemulihan.</p></div></div>
        <div className="mt-6 h-64 w-full" role="img" aria-label={describeCheckinData(checkins)}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e8e5" /><XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: "#5f6b6b" }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5f6b6b" }} /><Bar dataKey="cumulativeCheckins" fill="#63806c" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <p className="mt-4 rounded-2xl bg-neuro-cream p-4 text-sm leading-6 text-neuro-slate"><strong>Ringkasan teks:</strong> {describeCheckinData(checkins)}</p>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6"><Sparkles className="size-6 text-neuro-slate" /><h2 className="mt-4 text-lg font-semibold text-neuro-slate">Ringkasan AI tidak tersedia</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.message}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">Sumber: template deterministik NeuroCare. Tidak ada data yang dikirim ke model AI.</p></section>
        <section className="rounded-[2rem] border border-black/5 bg-neuro-green p-5 sm:p-6"><Database className="size-6 text-neuro-slate" /><h2 className="mt-4 text-lg font-semibold text-neuro-slate">Sumber data</h2><p className="mt-2 text-sm leading-6 text-neuro-slate/75">Check-in: {meta.source === "demo_fixture" ? "fixture sintetis" : "database pengguna"}. Aktivitas F06: {activityAvailable ? "sesi tervalidasi" : "tidak tersedia"}.</p><p className="mt-3 text-xs text-neuro-slate/65">Diperbarui {formatDateTime(meta.generatedAt)}</p></section>
      </aside>
    </div>

    <CheckinTable checkins={checkins} />

    <section className="mt-5 flex flex-wrap gap-3 rounded-[2rem] border border-black/5 bg-white p-5"><Link href="/app/recovery" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white"><ClipboardPlus className="size-4" />Buat check-in baru</Link>{activityAvailable ? <Link href="/app/recovery/activity" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-green px-5 text-sm font-semibold text-neuro-slate"><Activity className="size-4" />Buka aktivitas</Link> : <span className="inline-flex min-h-12 items-center gap-2 rounded-full bg-muted px-5 text-sm font-semibold text-muted-foreground" aria-disabled="true"><Activity className="size-4" />Aktivitas belum tersedia</span>}<Link href="/app/timeline" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate">Buka timeline terpadu</Link></section>
  </>;
}

function CheckinTable({ checkins }: { checkins: ProgressCheckin[] }) {
  return <section className="mt-5 overflow-hidden rounded-[2rem] border border-black/5 bg-white" aria-labelledby="raw-data-title"><div className="p-5 sm:p-7"><h2 id="raw-data-title" className="text-xl font-semibold text-neuro-slate">Tabel catatan mandiri</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Alternatif tekstual untuk membandingkan jawaban yang sama. Perubahan pilihan tidak dinilai sebagai membaik atau memburuk.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[52rem] border-collapse text-left text-sm"><thead className="bg-neuro-cream text-xs text-muted-foreground"><tr><th className="px-5 py-4 font-semibold">Tanggal</th><th className="px-5 py-4 font-semibold">Jenis</th><th className="px-5 py-4 font-semibold">Aktivitas harian</th><th className="px-5 py-4 font-semibold">Kendala dirasakan</th><th className="px-5 py-4 font-semibold">Kekhawatiran baru</th><th className="px-5 py-4 font-semibold">Frekuensi latihan</th></tr></thead><tbody className="divide-y divide-black/5">{checkins.map((checkin) => <tr key={checkin.id}><td className="px-5 py-4 font-medium text-neuro-slate">{formatDateTime(checkin.recordedAt)}</td><td className="px-5 py-4 text-muted-foreground">{checkin.isBaseline ? "Baseline laporan mandiri" : "Laporan mandiri"}</td><td className="px-5 py-4 text-muted-foreground">{answerLabel(checkin.dailyActivity)}</td><td className="px-5 py-4 text-muted-foreground">{answerLabel(checkin.perceivedLimitation)}</td><td className="px-5 py-4 text-muted-foreground">{answerLabel(checkin.newConcerns)}</td><td className="px-5 py-4 text-muted-foreground">{answerLabel(checkin.practiceFrequency)}</td></tr>)}</tbody></table></div></section>;
}

function SummaryCard({ icon: Icon, label, value, hint }: { icon: typeof CalendarDays; label: string; value: string; hint: string }) { return <article className="rounded-3xl border border-black/5 bg-white p-5"><Icon className="size-5 text-neuro-slate" /><p className="mt-5 text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-medium tracking-[-0.04em] text-neuro-slate">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></article>; }
function Notice({ title, message }: { title: string; message: string }) { return <section className="mt-5 flex gap-3 rounded-3xl border border-[#d7c78f] bg-[#fff9ec] p-4 text-[#79520f]"><Info className="mt-0.5 size-5 shrink-0" /><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5">{message}</p></div></section>; }
function LoadingState() { return <section className="mt-6 grid min-h-72 place-items-center rounded-[2rem] border border-black/5 bg-white" role="status"><div className="text-center"><LoaderCircle className="mx-auto size-8 animate-spin text-neuro-slate" /><p className="mt-4 text-sm font-semibold text-neuro-slate">Memuat catatan progress…</p></div></section>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <section className="mt-6 rounded-[2rem] border border-[#e6b4b8] bg-[#fff4f4] p-6 text-[#8b2028]" role="alert"><h2 className="text-lg font-semibold">Jaringan tidak tersedia</h2><p className="mt-2 text-sm leading-6">Data tidak dimuat dan tidak diganti dengan nilai nol. Periksa koneksi lalu coba kembali.</p><button type="button" onClick={onRetry} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold"><RefreshCw className="size-4" />Coba lagi</button></section>; }
function EmptyState({ message }: { message: string }) { return <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-7 text-center"><ClipboardPlus className="mx-auto size-9 text-neuro-slate" /><h2 className="mt-4 text-xl font-semibold text-neuro-slate">Belum ada baseline atau check-in</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{message} Tidak ada persentase atau hasil yang dibuat dari data kosong.</p><Link href="/app/recovery" className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white"><ClipboardPlus className="size-4" />Buat check-in pertama</Link></section>; }
function UnavailableState({ response, onRetry }: { response: RecoveryProgressResponse; onRetry: () => void }) { if (response.data.status !== "unavailable") return null; return <section className="mt-6 rounded-[2rem] border border-[#d7c78f] bg-[#fff9ec] p-6 text-[#79520f]" role="status"><h2 className="text-lg font-semibold">Progress belum tersedia</h2><p className="mt-2 text-sm leading-6">{response.data.message} Tidak ada hasil pengganti yang dibuat.</p>{response.data.retryable ? <button type="button" onClick={onRetry} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold"><RefreshCw className="size-4" />Coba lagi</button> : null}</section>; }

function DemoControls({ value, onChange }: { value: DemoScenario; onChange: (value: DemoScenario) => void }) { const values: DemoScenario[] = ["multiple", "one", "empty", "no-baseline", "sparse", "with-activity", "unavailable", "network-error"]; return <section className="mt-6 rounded-3xl border border-dashed border-[#caa24e] bg-[#fff9ec] p-4"><p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Developer · fixture sintetis</p><div className="mt-3 flex flex-wrap gap-2">{values.map((scenario) => <button key={scenario} type="button" onClick={() => onChange(scenario)} aria-pressed={value === scenario} className={`focus-ring rounded-full px-3 py-2 text-xs ${value === scenario ? "bg-neuro-slate text-white" : "bg-white text-neuro-slate"}`}>{scenario}</button>)}</div></section>; }

function EmergencyPanel({ onBack }: { onBack: () => void }) { return <main><section className="rounded-[2rem] border border-[#e6b4b8] bg-[#fff4f4] p-6 text-[#8b2028] sm:p-8" role="alert"><ShieldAlert className="size-9" /><h1 className="mt-4 text-2xl font-semibold">Abaikan grafik dan cari bantuan darurat</h1><p className="mt-3 max-w-2xl text-sm leading-6">Hubungi layanan darurat setempat atau pergi ke fasilitas kesehatan terdekat. Jangan menunggu ringkasan aplikasi.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/app/recovery" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold"><ArrowLeft className="size-4" />Keluar dari progress</Link><button type="button" onClick={onBack} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e6b4b8] px-5 text-sm font-semibold">Kembali ke grafik</button></div></section></main>; }

async function fetchProgress(range: ProgressRange, scenario: DemoScenario, signal: AbortSignal) {
  if (scenario === "network-error") throw new Error("Simulated network error");
  const response = await fetch(`/api/recovery/progress?range=${range}&scenario=${scenario}`, { headers: process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Progress-Demo": "progress-fixture-v1" } : {}, cache: "no-store", signal });
  if (!response.ok) throw new Error("Recovery progress request failed");
  const payload: unknown = await response.json();
  const parsed = recoveryProgressResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid recovery progress response");
  return parsed.data;
}

function answerLabel(value: string) { return ({ completed: "Selesai", completed_with_assistance: "Selesai dengan bantuan", not_completed: "Belum selesai", not_reported: "Tidak ada kendala yang dicatat", some_limitation: "Ada kendala", major_limitation: "Kendala terasa besar", yes: "Ya", no: "Tidak", not_practiced: "Belum dilakukan", once: "Satu kali", more_than_once: "Lebih dari satu kali", unknown: "Tidak tahu / dilewati" } as Record<string, string>)[value] ?? "Data tidak tersedia"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function formatDuration(seconds: number) { const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return `${minutes} menit ${remainder} detik`; }
