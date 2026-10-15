"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleDashed, FileQuestion, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import {
  actionItemsResponseSchema,
  actionItemUpdateResponseSchema,
  type ActionItem,
  type ActionItemsResponse,
  type ActionItemUpdateResponse,
} from "@/features/health-records/health-records.contract";
import { sortActionItems } from "@/features/health-records/health-records.selectors";

type Scenario = "baseline" | "empty" | "unavailable" | "network-error";
type StatusFilter = "pending" | "completed";

export function ActionPlanView() {
  const [scenario, setScenario] = useState<Scenario>("baseline");
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const queryClient = useQueryClient();
  const queryKey = ["action-items", "current-user", scenario] as const;
  const query = useQuery({ queryKey, queryFn: ({ signal }) => fetchActionItems(scenario, signal) });
  const mutation = useMutation({
    mutationFn: ({ item, status }: { item: ActionItem; status: ActionItem["status"] }) => updateActionItem(item.id, status),
    onSuccess: (response) => {
      if (response.data.status !== "saved") return;
      const savedItem = response.data.item;
      queryClient.setQueryData<ActionItemsResponse>(queryKey, (current) => {
        if (!current || current.data.status !== "ok") return current;
        return { ...current, data: { ...current.data, items: sortActionItems(current.data.items.map((item) => item.id === savedItem.id ? savedItem : item)), lastUpdatedAt: response.meta.generatedAt } };
      });
      void queryClient.invalidateQueries({ queryKey: ["health-timeline"] });
    },
  });
  const items = query.data?.data.status === "ok" ? query.data.data.items : [];
  const visible = items.filter((item) => item.status === filter);

  return <main>
    <Link href="/app/timeline" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"><ArrowLeft className="size-4" />Kembali ke timeline</Link>
    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F08 · Action planner</span>{process.env.NODE_ENV !== "production" ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}</div><h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Rencana tindak lanjut</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Daftar administratif dari sumber yang terlihat. Rencana ini bukan resep, diagnosis, atau pengganti arahan tenaga kesehatan.</p></div></div>

    {process.env.NODE_ENV !== "production" ? <DemoControls value={scenario} onChange={setScenario} /> : null}

    <section className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="Ringkasan rencana"><Summary label="Belum dikerjakan" value={items.filter((item) => item.status === "pending").length} /><Summary label="Selesai" value={items.filter((item) => item.status === "completed").length} /><Summary label="Duplikat aktif" value={duplicateCount(items)} /></section>

    <section className="mt-5 rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-neuro-slate">Daftar rencana</h2><p className="mt-1 text-sm text-muted-foreground">Status berubah hanya setelah server mengonfirmasi penyimpanan.</p></div><div className="flex rounded-full bg-neuro-cream p-1" aria-label="Filter status">{(["pending", "completed"] as const).map((status) => <button type="button" key={status} onClick={() => setFilter(status)} aria-pressed={filter === status} className="focus-ring min-h-10 rounded-full px-4 text-xs font-semibold text-muted-foreground aria-pressed:bg-neuro-slate aria-pressed:text-white">{status === "pending" ? "Belum dikerjakan" : "Selesai"}</button>)}</div></div>
      <div className="mt-6" aria-live="polite">{query.isPending ? <LoadingState /> : null}{query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}{query.data?.data.status === "empty" ? <EmptyState /> : null}{query.data?.data.status === "unavailable" ? <UnavailableState message={query.data.data.message} /> : null}{query.data?.data.status === "ok" && visible.length === 0 ? <p className="rounded-2xl bg-neuro-cream p-5 text-sm text-muted-foreground">Tidak ada rencana dengan status ini.</p> : null}<div className="grid gap-3">{visible.map((item) => <ActionCard key={item.id} item={item} pending={mutation.isPending && mutation.variables?.item.id === item.id} onToggle={() => mutation.mutate({ item, status: item.status === "pending" ? "completed" : "pending" })} />)}</div>{mutation.isError ? <p className="mt-4 rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#8b2028]" role="alert">Status tidak disimpan. Daftar tetap menggunakan nilai sebelumnya.</p> : null}{mutation.data?.data.status === "unavailable" ? <p className="mt-4 rounded-2xl bg-[#fff9ec] p-4 text-sm text-[#79520f]">{mutation.data.data.message}</p> : null}</div>
      {query.data?.data.status === "ok" ? <p className="mt-6 border-t border-black/5 pt-4 text-xs text-muted-foreground">Terakhir diperbarui {formatDateTime(query.data.data.lastUpdatedAt)} · Sumber dan status disimpan terpisah.</p> : null}
    </section>

    <section className="mt-5 rounded-[2rem] border border-black/5 bg-neuro-blue p-5 sm:p-6"><ShieldCheck className="size-6 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">Deduplikasi berdasarkan sumber</h2><p className="mt-2 text-sm leading-6 text-neuro-slate/70">Setiap rencana memiliki kunci deduplikasi. Fixture tidak membuat dua item aktif untuk sumber yang sama; constraint database final masih menunggu review schema.</p></section>
  </main>;
}

function ActionCard({ item, pending, onToggle }: { item: ActionItem; pending: boolean; onToggle: () => void }) { return <article className="rounded-3xl border border-black/5 bg-neuro-cream p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${item.status === "completed" ? "bg-[#effaf1] text-[#245c2d]" : "bg-white text-neuro-slate"}`}>{item.status === "completed" ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}{item.status === "completed" ? "Selesai" : "Belum dikerjakan"}</span><h3 className="mt-4 text-lg font-semibold text-neuro-slate">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></div><button type="button" onClick={onToggle} disabled={pending} className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-neuro-slate px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="size-4 animate-spin" /> : item.status === "pending" ? <Check className="size-4" /> : <RefreshCw className="size-4" />}{item.status === "pending" ? "Tandai selesai" : "Buka kembali"}</button></div><dl className="mt-5 grid gap-3 border-t border-black/5 pt-4 text-xs sm:grid-cols-3"><div><dt className="text-muted-foreground">Sumber</dt><dd className="mt-1 font-semibold text-neuro-slate">{item.source.label}</dd></div><div><dt className="text-muted-foreground">Tenggat</dt><dd className="mt-1 font-semibold text-neuro-slate">{item.dueAt ? formatDateTime(item.dueAt) : "Tidak ditentukan"}</dd></div><div><dt className="text-muted-foreground">Diperbarui</dt><dd className="mt-1 font-semibold text-neuro-slate">{formatDateTime(item.updatedAt)}</dd></div></dl></article>; }
function Summary({ label, value }: { label: string; value: number }) { return <article className="rounded-3xl border border-black/5 bg-white p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-medium text-neuro-slate">{value}</p></article>; }
function LoadingState() { return <div className="grid min-h-52 place-items-center"><p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Memuat rencana…</p></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl bg-[#fff1f1] p-5 text-[#8b2028]" role="alert"><p className="font-semibold">Rencana tidak dapat dimuat</p><p className="mt-1 text-sm">Tidak ada status yang diubah.</p><button type="button" onClick={onRetry} className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-semibold"><RefreshCw className="size-3.5" />Coba lagi</button></div>; }
function EmptyState() { return <div className="grid min-h-52 place-items-center text-center"><div><FileQuestion className="mx-auto size-8 text-neuro-slate" /><p className="mt-4 font-semibold text-neuro-slate">Belum ada rencana</p><p className="mt-1 text-sm text-muted-foreground">Rencana akan muncul dari gap atau alur yang memiliki sumber jelas.</p></div></div>; }
function UnavailableState({ message }: { message: string }) { return <div className="rounded-2xl bg-[#fff9ec] p-5 text-[#79520f]"><p className="font-semibold">Rencana belum tersedia</p><p className="mt-1 text-sm leading-6">{message}</p></div>; }
function DemoControls({ value, onChange }: { value: Scenario; onChange: (value: Scenario) => void }) { return <section className="mt-6 rounded-3xl border border-dashed border-[#caa24e] bg-[#fff9ec] p-4"><p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Developer · fixture sintetis</p><div className="mt-3 flex flex-wrap gap-2">{(["baseline", "empty", "unavailable", "network-error"] as Scenario[]).map((scenario) => <button key={scenario} type="button" onClick={() => onChange(scenario)} aria-pressed={value === scenario} className="focus-ring rounded-full bg-white px-3 py-2 text-xs text-neuro-slate aria-pressed:bg-neuro-slate aria-pressed:text-white">{scenario}</button>)}</div></section>; }

async function fetchActionItems(scenario: Scenario, signal: AbortSignal): Promise<ActionItemsResponse> { if (scenario === "network-error") throw new Error("Simulated network error"); const response = await fetch(`/api/action-items?scenario=${scenario}`, { headers: demoHeaders(), cache: "no-store", signal }); if (!response.ok) throw new Error("Action items request failed"); const payload: unknown = await response.json(); const parsed = actionItemsResponseSchema.safeParse(payload); if (!parsed.success) throw new Error("Invalid action items response"); return parsed.data; }
async function updateActionItem(id: string, status: ActionItem["status"]): Promise<ActionItemUpdateResponse> { const response = await fetch(`/api/action-items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...demoHeaders() }, body: JSON.stringify({ requestId: crypto.randomUUID(), status }), cache: "no-store", signal: AbortSignal.timeout(10_000) }); if (!response.ok) throw new Error("Action update failed"); const payload: unknown = await response.json(); const parsed = actionItemUpdateResponseSchema.safeParse(payload); if (!parsed.success) throw new Error("Invalid action update response"); return parsed.data; }
function demoHeaders(): Record<string, string> { return process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Records-Demo": "health-records-fixture-v1" } : {}; }
function duplicateCount(items: ActionItem[]) { return items.length - new Set(items.map((item) => item.dedupeKey)).size; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
