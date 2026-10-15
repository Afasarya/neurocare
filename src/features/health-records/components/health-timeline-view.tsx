"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  ClipboardCheck,
  FileQuestion,
  HeartPulse,
  History,
  ListChecks,
  LoaderCircle,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  actionItemsResponseSchema,
  timelineResponseSchema,
  type ActionItemsResponse,
  type HealthMeasurement,
  type TimelineEvent,
  type TimelineEventKind,
  type TimelineResponse,
} from "@/features/health-records/health-records.contract";
import { sortTimelineEvents } from "@/features/health-records/health-records.selectors";
import { MeasurementEntryForm } from "@/features/health-records/components/measurement-entry-form";

type Scenario = "baseline" | "empty" | "unavailable" | "network-error";
type EventFilter = "all" | TimelineEventKind;

export function HealthTimelineView() {
  const queryClient = useQueryClient();
  const [scenario, setScenario] = useState<Scenario>("baseline");
  const [filter, setFilter] = useState<EventFilter>("all");
  const demoEnabled = process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true";
  const timeline = useQuery({ queryKey: ["health-timeline", "current-user", scenario], queryFn: ({ signal }) => fetchTimeline(scenario, signal) });
  const actions = useQuery({ queryKey: ["action-items", "current-user", scenario], queryFn: ({ signal }) => fetchActions(scenario, signal) });
  const events = sortTimelineEvents(timeline.data?.data.status === "ok" ? timeline.data.data.events : []);
  const visibleEvents = filter === "all" ? events : events.filter((event) => event.kind === filter);

  function addMeasurement(measurement: HealthMeasurement) {
    void measurement;
    void queryClient.invalidateQueries({ queryKey: ["health-timeline"] });
  }

  return <main>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F08 · Shared foundation</span>{demoEnabled ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}</div><h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Timeline kesehatan</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Urutan pengukuran dan aktivitas berdasarkan waktu sumbernya. Nilai mentah tidak digunakan untuk membuat diagnosis.</p></div><Link href="/app/action-plan" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white"><ListChecks className="size-4" />Buka rencana tindakan</Link></div>

    {demoEnabled ? <DemoControls value={scenario} onChange={setScenario} /> : null}

    <TimelineWidgets events={events} actions={actions.data} />

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
      <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="timeline-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="timeline-heading" className="text-xl font-semibold text-neuro-slate">Kejadian terbaru</h2><p className="mt-1 text-sm text-muted-foreground">Diurutkan dari waktu kejadian, bukan waktu halaman dibuka.</p></div><button type="button" onClick={() => timeline.refetch()} disabled={timeline.isFetching} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-neuro-slate disabled:opacity-50"><RefreshCw className={`size-4 ${timeline.isFetching ? "animate-spin" : ""}`} />Perbarui</button></div>
        <EventFilters value={filter} onChange={setFilter} />
        <div className="mt-6" aria-live="polite">{timeline.isPending ? <LoadingState label="Memuat timeline…" /> : null}{timeline.isError ? <ErrorState onRetry={() => timeline.refetch()} /> : null}{timeline.data?.data.status === "empty" ? <EmptyState /> : null}{timeline.data?.data.status === "unavailable" ? <UnavailableState message={timeline.data.data.message} /> : null}{!timeline.isPending && !timeline.isError && visibleEvents.length > 0 ? <EventList events={visibleEvents} /> : null}{!timeline.isPending && !timeline.isError && events.length > 0 && visibleEvents.length === 0 ? <p className="rounded-2xl bg-neuro-cream p-5 text-sm text-muted-foreground">Tidak ada kejadian untuk filter ini.</p> : null}</div>
        {timeline.data?.data.status === "ok" ? <p className="mt-6 border-t border-black/5 pt-4 text-xs text-muted-foreground">Terakhir diperbarui {formatDateTime(timeline.data.data.lastUpdatedAt)} · Zona waktu Asia/Jakarta · Sumber setiap kejadian ditampilkan terpisah.</p> : null}
      </section>
      <div className="space-y-5"><MeasurementEntryForm onSaved={addMeasurement} /><section className="rounded-[2rem] border border-black/5 bg-neuro-green p-5"><ShieldCheck className="size-6 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">Privasi dan kontrol data</h2><p className="mt-2 text-sm leading-6 text-neuro-slate/70">Kebijakan ekspor, penghapusan, retention, dan consent masih menunggu persetujuan tim. NeuroCare tidak menampilkan tautan yang belum berfungsi.</p><div className="mt-4 flex gap-2"><span className="rounded-full bg-white/70 px-3 py-2 text-xs text-neuro-slate" aria-disabled="true">Ekspor belum tersedia</span><span className="rounded-full bg-white/70 px-3 py-2 text-xs text-neuro-slate" aria-disabled="true">Hapus data belum tersedia</span></div></section></div>
    </div>
  </main>;
}

function TimelineWidgets({ events, actions }: { events: TimelineEvent[]; actions?: ActionItemsResponse }) {
  const measurement = events.find((event) => event.kind === "measurement");
  const activity = events.find((event) => event.kind === "recovery_activity" || event.kind === "recovery_checkin");
  const nextAction = actions?.data.status === "ok" ? actions.data.items.find((item) => item.status === "pending") : null;
  return <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Ringkasan timeline"><Widget icon={Stethoscope} label="Pengukuran terakhir" value={measurement?.title ?? "Belum diukur"} hint={measurement ? formatDateTime(measurement.occurredAt) : "Data tidak tersedia"} /><Widget icon={Activity} label="Aktivitas terbaru" value={activity?.title ?? "Belum tercatat"} hint={activity ? formatDateTime(activity.occurredAt) : "Data tidak tersedia"} /><Widget icon={CalendarClock} label="Rencana selanjutnya" value={nextAction?.title ?? "Belum ada rencana"} hint={nextAction?.dueAt ? formatDateTime(nextAction.dueAt) : "Tanpa tenggat yang disetujui"} /></section>;
}

function Widget({ icon: Icon, label, value, hint }: { icon: typeof Activity; label: string; value: string; hint: string }) { return <article className="rounded-3xl border border-black/5 bg-white p-5"><Icon className="size-5 text-neuro-slate" /><p className="mt-5 text-xs text-muted-foreground">{label}</p><p className="mt-2 font-semibold text-neuro-slate">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p></article>; }
function EventFilters({ value, onChange }: { value: EventFilter; onChange: (value: EventFilter) => void }) { const options: Array<[EventFilter, string]> = [["all", "Semua"], ["measurement", "Pengukuran"], ["screening", "Skrining"], ["pulse_measurement", "Detak"], ["recovery_checkin", "Check-in"], ["recovery_activity", "Aktivitas"]]; return <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filter jenis kejadian">{options.map(([key, label]) => <button type="button" key={key} onClick={() => onChange(key)} aria-pressed={value === key} className="focus-ring min-h-10 shrink-0 rounded-full border border-black/10 px-3 text-xs font-semibold text-muted-foreground aria-pressed:border-neuro-slate aria-pressed:bg-neuro-slate aria-pressed:text-white">{label}</button>)}</div>; }
function EventList({ events }: { events: TimelineEvent[] }) { return <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-black/10">{events.map((event) => <li key={event.id} className="relative grid grid-cols-[2.4rem_1fr] gap-3"><span className="z-10 grid size-9 place-items-center rounded-full border border-black/10 bg-white"><EventIcon kind={event.kind} /></span><article className="rounded-3xl bg-neuro-cream p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">{kindLabel(event.kind)} · {pathwayLabel(event.pathway)}</p><h3 className="mt-1 font-semibold text-neuro-slate">{event.title}</h3></div><time dateTime={event.occurredAt} className="text-xs font-medium text-neuro-slate">{formatDateTime(event.occurredAt)}</time></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{event.description}</p>{event.details.length ? <dl className="mt-3 flex flex-wrap gap-2">{event.details.map((detail) => <div key={`${detail.label}-${detail.value}`} className="rounded-xl bg-white px-3 py-2"><dt className="text-[0.65rem] text-muted-foreground">{detail.label}</dt><dd className="text-sm font-semibold text-neuro-slate">{detail.value}{detail.unit ? ` ${detail.unit}` : ""}</dd></div>)}</dl> : null}<p className="mt-3 text-xs text-muted-foreground">Sumber: {event.source.label}</p></article></li>)}</ol>; }
function EventIcon({ kind }: { kind: TimelineEventKind }) { const Icon = kind === "measurement" ? Ruler : kind === "screening" ? ClipboardCheck : kind === "pulse_measurement" ? HeartPulse : kind === "action_item" ? ListChecks : History; return <Icon className="size-4 text-neuro-slate" />; }
function LoadingState({ label }: { label: string }) { return <div className="grid min-h-52 place-items-center"><p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{label}</p></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl bg-[#fff1f1] p-5 text-[#8b2028]" role="alert"><p className="font-semibold">Timeline tidak dapat dimuat</p><p className="mt-1 text-sm">Tidak ada data pengganti yang dibuat.</p><button type="button" onClick={onRetry} className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-semibold"><RefreshCw className="size-3.5" />Coba lagi</button></div>; }
function EmptyState() { return <div className="grid min-h-52 place-items-center text-center"><div><FileQuestion className="mx-auto size-8 text-neuro-slate" /><p className="mt-4 font-semibold text-neuro-slate">Timeline masih kosong</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan pengukuran yang benar-benar dilakukan untuk memulai riwayat.</p></div></div>; }
function UnavailableState({ message }: { message: string }) { return <div className="rounded-2xl bg-[#fff9ec] p-5 text-[#79520f]" role="status"><p className="font-semibold">Timeline belum tersedia</p><p className="mt-1 text-sm leading-6">{message}</p></div>; }
function DemoControls({ value, onChange }: { value: Scenario; onChange: (value: Scenario) => void }) { return <section className="mt-6 rounded-3xl border border-dashed border-[#caa24e] bg-[#fff9ec] p-4"><p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Developer · fixture sintetis</p><div className="mt-3 flex flex-wrap gap-2">{(["baseline", "empty", "unavailable", "network-error"] as Scenario[]).map((scenario) => <button key={scenario} type="button" onClick={() => onChange(scenario)} aria-pressed={value === scenario} className="focus-ring rounded-full bg-white px-3 py-2 text-xs text-neuro-slate aria-pressed:bg-neuro-slate aria-pressed:text-white">{scenario}</button>)}</div></section>; }

async function fetchTimeline(scenario: Scenario, signal: AbortSignal): Promise<TimelineResponse> { if (scenario === "network-error") throw new Error("Simulated network error"); const response = await fetch(`/api/timeline?scenario=${scenario}`, { headers: demoHeaders(), cache: "no-store", signal }); if (!response.ok) throw new Error("Timeline request failed"); const payload: unknown = await response.json(); const parsed = timelineResponseSchema.safeParse(payload); if (!parsed.success) throw new Error("Invalid timeline response"); return parsed.data; }
async function fetchActions(scenario: Scenario, signal: AbortSignal): Promise<ActionItemsResponse> { const apiScenario = scenario === "empty" || scenario === "unavailable" ? scenario : "baseline"; const response = await fetch(`/api/action-items?scenario=${apiScenario}`, { headers: demoHeaders(), cache: "no-store", signal }); if (!response.ok) throw new Error("Action request failed"); const payload: unknown = await response.json(); const parsed = actionItemsResponseSchema.safeParse(payload); if (!parsed.success) throw new Error("Invalid action response"); return parsed.data; }
function demoHeaders(): Record<string, string> { return process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true" ? { "X-NeuroCare-Records-Demo": "health-records-fixture-v1" } : {}; }
function kindLabel(kind: TimelineEventKind) { return { screening: "Skrining", measurement: "Pengukuran", pulse_measurement: "Pengukuran detak", recovery_checkin: "Check-in pemulihan", recovery_activity: "Aktivitas pemulihan", action_item: "Rencana tindakan" }[kind]; }
function pathwayLabel(pathway: TimelineEvent["pathway"]) { return { neuroprevent: "NeuroPrevent", neurorecovery: "NeuroRecovery", shared: "Bersama" }[pathway]; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
