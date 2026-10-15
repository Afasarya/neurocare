"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  Check,
  CircleStop,
  Coffee,
  Info,
  Leaf,
  LoaderCircle,
  Music2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  COGNITIVE_ACTIVITY_CONTRACT_VERSION,
  COGNITIVE_ACTIVITY_DEMO_HEADER,
  cognitiveActivitySessionResponseSchema,
  type CognitiveActivitySessionCreate,
} from "@/features/cognitive-activities/cognitive-activity.contract";
import {
  createCognitiveActivityState,
  createCognitiveDeck,
  dismissCognitiveMismatch,
  isCognitiveActivityComplete,
  selectCognitiveCard,
  type CognitiveActivityState,
  type CognitiveCard,
} from "@/features/cognitive-activities/cognitive-activity.logic";

type ViewState = "idle" | "active" | "review" | "complete";
type EndedReason = "completed" | "stopped";

const cardIcons: Record<CognitiveCard["pairId"], LucideIcon> = {
  leaf: Leaf,
  cup: Coffee,
  music: Music2,
};

export function CognitiveActivityView() {
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [pairCount, setPairCount] = useState<2 | 3>(2);
  const [game, setGame] = useState<CognitiveActivityState>(createCognitiveActivityState);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [endedReason, setEndedReason] = useState<EndedReason | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const deck = useMemo(() => createCognitiveDeck(pairCount), [pairCount]);
  const activityComplete = isCognitiveActivityComplete(game, pairCount);
  const isDevelopment = process.env.NODE_ENV !== "production";

  const submitMutation = useMutation({
    mutationFn: submitCognitiveActivitySession,
    onSuccess: () => setViewState("complete"),
  });

  function startActivity() {
    setGame(createCognitiveActivityState());
    setStartedAt(new Date().toISOString());
    setEndedAt(null);
    setEndedReason(null);
    setConfirmation(false);
    submitMutation.reset();
    setViewState("active");
  }

  function endActivity(reason: EndedReason) {
    setEndedAt(new Date().toISOString());
    setEndedReason(reason);
    setConfirmation(false);
    setViewState("review");
  }

  function resetActivity() {
    setViewState("idle");
    setGame(createCognitiveActivityState());
    setStartedAt(null);
    setEndedAt(null);
    setEndedReason(null);
    setConfirmation(false);
    submitMutation.reset();
  }

  function submitSession() {
    if (!startedAt || !endedAt || !endedReason || !confirmation || submitMutation.isPending) return;
    submitMutation.mutate({
      requestId: crypto.randomUUID(),
      startedAt,
      endedAt,
      activityType: "symbol_matching",
      completed: endedReason === "completed",
      endedReason,
      source: "self_report",
      contractVersion: COGNITIVE_ACTIVITY_CONTRACT_VERSION,
      confirmation: true,
    });
  }

  return (
    <main>
      <Link href="/app/recovery" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate">
        <ArrowLeft className="size-4" />Kembali ke NeuroRecovery
      </Link>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F10 · P2 Prototype</span>
          <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Aktivitas belum ditinjau klinisi</span>
          {isDevelopment ? <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">Data demo (simulasi)</span> : null}
        </div>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Aktivitas mencocokkan simbol</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Aktivitas opsional tanpa batas waktu dan tanpa penilaian medis. Hasil permainan tidak digunakan untuk mendiagnosis kemampuan kognitif atau menilai efektivitas pemulihan.</p>
      </div>

      <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6" aria-labelledby="activity-privacy-heading">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-neuro-slate" />
          <div>
            <h2 id="activity-privacy-heading" className="font-semibold text-neuro-slate">Berjalan di perangkat tanpa leaderboard</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Pilihan kartu diproses sementara di halaman ini. Tidak ada skor, akurasi, jumlah kesalahan, waktu reaksi, atau perbandingan dengan pengguna lain yang disimpan.</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="matching-heading">
          <div>
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Sesi aktivitas · tanpa timer</p>
            <h2 id="matching-heading" className="mt-2 text-xl font-semibold text-neuro-slate">Temukan dua simbol yang sama</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Buka dua kartu. Jika berbeda, kartu tetap terbuka sampai Anda siap melanjutkan.</p>
          </div>

          {viewState === "idle" ? (
            <div className="mt-7">
              <fieldset>
                <legend className="text-sm font-semibold text-neuro-slate">Pilih jumlah kartu yang nyaman</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ComfortChoice checked={pairCount === 2} onChange={() => setPairCount(2)} label="4 kartu" description="Dua pasangan simbol" />
                  <ComfortChoice checked={pairCount === 3} onChange={() => setPairCount(3)} label="6 kartu" description="Tiga pasangan simbol" />
                </div>
              </fieldset>
              <div className="mt-6 rounded-3xl bg-neuro-cream p-6 text-center">
                <Brain className="mx-auto size-9 text-neuro-slate" />
                <p className="mt-4 font-semibold text-neuro-slate">Mulai sesuai kenyamanan Anda</p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Tidak ada hitung mundur, hukuman, nilai gagal, atau kewajiban menyelesaikan semua kartu.</p>
                <button type="button" onClick={startActivity} className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white">Mulai sesi aktivitas</button>
              </div>
            </div>
          ) : null}

          {viewState === "active" ? (
            <>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Kartu pencocokan simbol">
                {deck.map((card) => (
                  <CognitiveCardButton
                    key={card.id}
                    card={card}
                    revealed={game.openCardIds.includes(card.id) || game.matchedPairIds.includes(card.pairId)}
                    matched={game.matchedPairIds.includes(card.pairId)}
                    disabled={game.mismatchPending || game.matchedPairIds.includes(card.pairId)}
                    onSelect={() => setGame((current) => selectCognitiveCard(current, card, deck))}
                  />
                ))}
              </div>

              <div className="mt-5" aria-live="polite" aria-atomic="true">
                {game.mismatchPending ? (
                  <div className="rounded-3xl bg-[#fff9ec] p-5 text-[#79520f]">
                    <p className="font-semibold">Simbolnya berbeda—tidak apa-apa.</p>
                    <p className="mt-1 text-sm leading-6">Tidak ada pengurangan nilai. Lanjutkan saat Anda siap.</p>
                    <button type="button" onClick={() => setGame(dismissCognitiveMismatch)} className="focus-ring mt-4 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold">Tutup kartu dan lanjutkan</button>
                  </div>
                ) : activityComplete ? (
                  <div className="rounded-3xl bg-neuro-green p-5 text-neuro-slate">
                    <p className="font-semibold">Semua pasangan sudah ditemukan.</p>
                    <p className="mt-1 text-sm leading-6 text-neuro-slate/75">Ini hanya penyelesaian aktivitas, bukan hasil tes kemampuan atau skor pemulihan.</p>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Pilih kartu berikutnya sesuai kenyamanan Anda.</p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {activityComplete ? <button type="button" onClick={() => endActivity("completed")} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white"><Check className="size-4" />Selesaikan aktivitas</button> : null}
                <button type="button" onClick={() => endActivity("stopped")} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate"><CircleStop className="size-4" />Berhenti kapan saja</button>
              </div>
            </>
          ) : null}

          {viewState === "review" ? (
            <div className="mt-7">
              <div className="rounded-3xl bg-neuro-cream p-5">
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Ringkasan sesi saat ini</p>
                <h3 className="mt-3 text-xl font-semibold text-neuro-slate">{endedReason === "completed" ? "Aktivitas diselesaikan" : "Aktivitas dihentikan"}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Berhenti bukan kegagalan. Ringkasan ini hanya mencatat bahwa sesi dijalankan dan tidak berisi skor atau kesimpulan medis.</p>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30">
                <input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} className="mt-1 size-5 accent-[#243746]" />
                <span><span className="block text-sm font-semibold text-neuro-slate">Saya memahami ini hanya catatan penggunaan.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Tidak ada skor kognitif, diagnosis, atau perbandingan pengguna.</span></span>
              </label>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={resetActivity} className="focus-ring inline-flex min-h-12 items-center rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate">Keluar tanpa menyimpan</button>
                <button type="button" onClick={submitSession} disabled={!confirmation || submitMutation.isPending} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitMutation.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Check className="size-4" />}{submitMutation.isPending ? "Memproses…" : isDevelopment ? "Selesaikan simulasi" : "Simpan sesi"}</button>
              </div>
            </div>
          ) : null}

          {viewState === "complete" ? (
            <div className="mt-7 rounded-3xl bg-neuro-green p-6" role="status" aria-live="polite">
              <ShieldCheck className="size-8 text-neuro-slate" />
              <h3 className="mt-4 text-xl font-semibold text-neuro-slate">{submitMutation.data?.data.status === "simulated" ? "Simulasi selesai" : "Penyimpanan belum tersedia"}</h3>
              <p className="mt-2 text-sm leading-6 text-neuro-slate/75">{submitMutation.data?.data.message}</p>
              <button type="button" onClick={resetActivity} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neuro-slate"><RotateCcw className="size-4" />Kembali ke awal</button>
            </div>
          ) : null}

          {submitMutation.isError ? <p className="mt-5 rounded-2xl bg-[#fff1f1] p-4 text-sm leading-6 text-[#8b2028]" role="alert">Sesi tidak dapat diproses. Tidak ada data yang disimpan. Silakan coba lagi atau keluar.</p> : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-black/5 bg-neuro-blue p-5 sm:p-6">
            <Info className="size-6 text-neuro-slate" />
            <h2 className="mt-4 text-lg font-semibold text-neuro-slate">Cara menggunakan</h2>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-neuro-slate/75">
              <li>1. Pilih satu kartu untuk melihat simbol.</li>
              <li>2. Pilih kartu lain yang mungkin sama.</li>
              <li>3. Lanjutkan atau berhenti tanpa tekanan waktu.</li>
            </ol>
          </section>
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6">
            <Sparkles className="size-6 text-neuro-slate" />
            <h2 className="mt-4 text-lg font-semibold text-neuro-slate">Batas prototipe</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Pilihan aktivitas dan teks belum ditinjau klinisi/research. Riwayat, persistensi, integrasi timeline, serta rekomendasi tingkat kesulitan belum diaktifkan.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ComfortChoice({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description: string }) {
  return <label className={`focus-within:ring-3 focus-within:ring-ring/30 flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border p-4 ${checked ? "border-neuro-slate bg-neuro-green" : "border-black/10"}`}><input type="radio" name="pair-count" checked={checked} onChange={onChange} className="size-5 accent-[#243746]" /><span><span className="block text-sm font-semibold text-neuro-slate">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span></label>;
}

function CognitiveCardButton({ card, revealed, matched, disabled, onSelect }: { card: CognitiveCard; revealed: boolean; matched: boolean; disabled: boolean; onSelect: () => void }) {
  const Icon = cardIcons[card.pairId];
  return (
    <button type="button" onClick={onSelect} disabled={disabled} aria-label={revealed ? `${card.label}${matched ? ", pasangan ditemukan" : ", terbuka"}` : "Kartu tertutup"} className={`focus-ring grid min-h-36 place-items-center rounded-3xl border p-4 disabled:opacity-100 ${matched ? "border-neuro-slate bg-neuro-green" : revealed ? "border-neuro-slate bg-neuro-blue" : "border-black/10 bg-neuro-slate text-white"}`}>
      {revealed ? <span className="text-center"><Icon className="mx-auto size-10 text-neuro-slate" /><span className="mt-3 block text-lg font-semibold text-neuro-slate">{card.label}</span>{matched ? <span className="mt-1 block text-xs text-neuro-slate/70">Pasangan ditemukan</span> : null}</span> : <span className="text-center"><Brain className="mx-auto size-8" /><span className="mt-3 block text-sm font-semibold">Buka kartu</span></span>}
    </button>
  );
}

async function submitCognitiveActivitySession(input: CognitiveActivitySessionCreate) {
  const response = await fetch("/api/recovery/cognitive-activity-sessions", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Cognitive-Demo": COGNITIVE_ACTIVITY_DEMO_HEADER } : {}),
    },
    body: JSON.stringify(input),
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("cognitive_activity_session_request_failed");
  return cognitiveActivitySessionResponseSchema.parse(payload);
}
