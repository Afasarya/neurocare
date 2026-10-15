"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Check,
  CirclePause,
  GlassWater,
  HandHelping,
  Info,
  LoaderCircle,
  MessageCircle,
  MicOff,
  RotateCcw,
  ShieldCheck,
  Smile,
  Type,
  X,
} from "lucide-react";
import {
  COMMUNICATION_REHAB_CONTRACT_VERSION,
  COMMUNICATION_REHAB_DEMO_HEADER,
  communicationSessionResponseSchema,
  type CommunicationSessionCreate,
} from "@/features/communication-rehab/communication-rehab.contract";
import {
  communicationSessionFormSchema,
  type CommunicationSessionFormValues,
} from "@/features/communication-rehab/communication-form.schema";

const phraseCards = [
  { id: "yes", phrase: "Ya", detail: "Jawaban setuju", icon: Check },
  { id: "no", phrase: "Tidak", detail: "Jawaban tidak setuju", icon: X },
  { id: "help", phrase: "Tolong bantu saya", detail: "Meminta bantuan", icon: HandHelping },
  { id: "water", phrase: "Saya ingin minum", detail: "Kebutuhan minum", icon: GlassWater },
  { id: "pause", phrase: "Saya butuh istirahat", detail: "Meminta jeda", icon: CirclePause },
  { id: "thanks", phrase: "Terima kasih", detail: "Ucapan terima kasih", icon: Smile },
] as const;

type PracticeState = "idle" | "active" | "review" | "complete";

export function CommunicationRehabView() {
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const [largeText, setLargeText] = useState(true);
  const isDevelopment = process.env.NODE_ENV !== "production";
  const form = useForm<CommunicationSessionFormValues>({
    resolver: zodResolver(communicationSessionFormSchema),
    defaultValues: { notes: "", confirmation: false },
  });

  const submitMutation = useMutation({
    mutationFn: submitCommunicationSession,
    onSuccess: () => setPracticeState("complete"),
  });

  function startPractice() {
    submitMutation.reset();
    form.reset({ notes: "", confirmation: false });
    setSelectedPhrase(null);
    setSessionDate(new Date().toISOString());
    setPracticeState("active");
  }

  function resetPractice() {
    submitMutation.reset();
    form.reset({ notes: "", confirmation: false });
    setSelectedPhrase(null);
    setSessionDate(null);
    setPracticeState("idle");
  }

  const submit = form.handleSubmit((values) => {
    if (!sessionDate || submitMutation.isPending) return;
    submitMutation.mutate({
      requestId: crypto.randomUUID(),
      sessionDate,
      activityType: "phrase_cards",
      completed: true,
      notes: values.notes || undefined,
      source: "self_report",
      contractVersion: COMMUNICATION_REHAB_CONTRACT_VERSION,
      confirmation: true,
    });
  });

  return (
    <main>
      <Link href="/app/recovery" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate">
        <ArrowLeft className="size-4" />Kembali ke NeuroRecovery
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F09 · P2 Prototype</span>
            <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Belum ditinjau ahli wicara</span>
            {isDevelopment ? <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">Data demo (simulasi)</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Kartu bantu komunikasi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Pilih kartu untuk menampilkan frasa dengan ukuran besar. Ini adalah alat bantu komunikasi non-diagnostik, bukan terapi, tes bahasa, atau pengukur pemulihan.</p>
        </div>
      </div>

      <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6" aria-labelledby="privacy-heading">
        <div className="flex items-start gap-3">
          <MicOff className="mt-0.5 size-6 shrink-0 text-neuro-slate" />
          <div>
            <h2 id="privacy-heading" className="font-semibold text-neuro-slate">Tanpa mikrofon dan tanpa rekaman</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Prototipe ini tidak meminta izin mikrofon, tidak merekam suara, tidak membuat transkrip, dan tidak mengirim audio ke layanan lain. Umpan balik audio belum tersedia sampai sumber dan persetujuan privasinya ditinjau.</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="cards-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Latihan tanpa rekaman</p>
              <h2 id="cards-heading" className="mt-2 text-xl font-semibold text-neuro-slate">Pilih frasa yang ingin ditampilkan</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Tidak ada batas waktu. Anda dapat berhenti kapan saja.</p>
            </div>
            <button type="button" aria-pressed={largeText} onClick={() => setLargeText((current) => !current)} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-neuro-slate">
              <Type className="size-4" />Teks besar {largeText ? "aktif" : "nonaktif"}
            </button>
          </div>

          {practiceState === "idle" ? (
            <div className="mt-7 rounded-3xl bg-neuro-cream p-6 text-center">
              <MessageCircle className="mx-auto size-9 text-neuro-slate" />
              <p className="mt-4 font-semibold text-neuro-slate">Belum ada sesi yang dimulai</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Mulai bila Anda siap. Tidak ada kamera, mikrofon, penghitungan waktu, atau penilaian jawaban.</p>
              <button type="button" onClick={startPractice} className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white">Mulai latihan tanpa mikrofon</button>
            </div>
          ) : null}

          {practiceState === "active" ? (
            <>
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Kartu frasa komunikasi">
                {phraseCards.map((card) => {
                  const Icon = card.icon;
                  const selected = selectedPhrase === card.phrase;
                  return (
                    <button key={card.id} type="button" aria-pressed={selected} onClick={() => setSelectedPhrase(card.phrase)} className={`focus-ring min-h-32 rounded-3xl border p-5 text-left transition-colors ${selected ? "border-neuro-slate bg-neuro-green" : "border-black/10 bg-white hover:bg-muted"}`}>
                      <Icon className="size-6 text-neuro-slate" />
                      <span className="mt-4 block text-lg font-semibold text-neuro-slate">{card.phrase}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{card.detail}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 min-h-44 rounded-[2rem] bg-neuro-slate p-6 text-center text-white" role="status" aria-live="polite" aria-atomic="true">
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-white/60">Frasa terpilih</p>
                <p className={`mt-5 font-medium tracking-[-0.04em] ${largeText ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>{selectedPhrase ?? "Pilih salah satu kartu"}</p>
              </div>

              <button type="button" onClick={() => setPracticeState("review")} className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate sm:w-auto"><CirclePause className="size-4" />Akhiri latihan</button>
            </>
          ) : null}

          {practiceState === "review" ? (
            <form onSubmit={submit} className="mt-7" noValidate>
              <div className="rounded-3xl bg-neuro-cream p-5">
                <h3 className="font-semibold text-neuro-slate">Catatan penggunaan opsional</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Jangan masukkan transkrip percakapan, rekaman, diagnosis, atau identitas orang lain. Catatan ini bukan skor klinis.</p>
                <label htmlFor="communication-notes" className="mt-5 block text-sm font-semibold text-neuro-slate">Catatan singkat</label>
                <textarea id="communication-notes" rows={4} maxLength={500} {...form.register("notes")} className="field-control mt-2 min-h-28 py-3" placeholder="Contoh: kartu digunakan dengan bantuan pendamping." />
                {form.formState.errors.notes ? <p className="mt-2 text-sm text-[#8b2028]" role="alert">{form.formState.errors.notes.message}</p> : null}
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30">
                <input type="checkbox" {...form.register("confirmation")} className="mt-1 size-5 accent-[#243746]" />
                <span><span className="block text-sm font-semibold text-neuro-slate">Saya memahami ini hanya catatan penggunaan.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Bukan hasil terapi, diagnosis, atau ukuran kemajuan pemulihan.</span></span>
              </label>
              {form.formState.errors.confirmation ? <p className="mt-2 text-sm text-[#8b2028]" role="alert">{form.formState.errors.confirmation.message}</p> : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setPracticeState("active")} className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate">Kembali ke kartu</button>
                <button type="submit" disabled={submitMutation.isPending} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">{submitMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{submitMutation.isPending ? "Memproses…" : isDevelopment ? "Selesaikan simulasi" : "Simpan catatan"}</button>
              </div>
            </form>
          ) : null}

          {practiceState === "complete" ? (
            <div className="mt-7 rounded-3xl bg-neuro-green p-6" role="status" aria-live="polite">
              <ShieldCheck className="size-8 text-neuro-slate" />
              <h3 className="mt-4 text-xl font-semibold text-neuro-slate">{submitMutation.data?.data.status === "simulated" ? "Simulasi selesai" : "Penyimpanan belum tersedia"}</h3>
              <p className="mt-2 text-sm leading-6 text-neuro-slate/75">{submitMutation.data?.data.message}</p>
              <button type="button" onClick={resetPractice} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neuro-slate"><RotateCcw className="size-4" />Mulai kembali</button>
            </div>
          ) : null}

          {submitMutation.isError ? <p className="mt-5 rounded-2xl bg-[#fff1f1] p-4 text-sm leading-6 text-[#8b2028]" role="alert">Sesi tidak dapat diproses. Tidak ada catatan yang disimpan. Silakan coba lagi.</p> : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-black/5 bg-neuro-blue p-5 sm:p-6">
            <Info className="size-6 text-neuro-slate" />
            <h2 className="mt-4 text-lg font-semibold text-neuro-slate">Cara menggunakan</h2>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-neuro-slate/75">
              <li>1. Pilih kartu dengan sentuhan, mouse, atau keyboard.</li>
              <li>2. Tunjukkan teks besar kepada orang di sekitar Anda.</li>
              <li>3. Akhiri tanpa tekanan waktu kapan pun diperlukan.</li>
            </ol>
          </section>
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6">
            <ShieldCheck className="size-6 text-neuro-slate" />
            <h2 className="mt-4 text-lg font-semibold text-neuro-slate">Batas prototipe</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Konten kartu belum ditinjau ahli wicara. Riwayat, kartu buatan pengguna, audio, dan integrasi timeline belum diaktifkan. Jika kesulitan bicara muncul mendadak atau memburuk, jangan mengandalkan prototipe ini untuk menilai kondisi.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

async function submitCommunicationSession(input: CommunicationSessionCreate) {
  const response = await fetch("/api/recovery/communication-sessions", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Communication-Demo": COMMUNICATION_REHAB_DEMO_HEADER } : {}),
    },
    body: JSON.stringify(input),
  });

  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("communication_session_request_failed");
  return communicationSessionResponseSchema.parse(payload);
}
