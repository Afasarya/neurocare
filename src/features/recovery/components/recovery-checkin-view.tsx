"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, type Path, type UseFormRegister } from "react-hook-form";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  HandHelping,
  History,
  Info,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import {
  RECOVERY_DEMO_INSTRUMENT_VERSION,
  recoveryCreateResponseSchema,
  recoveryListResponseSchema,
  type RecoveryCheckin,
  type RecoveryCheckinCreate,
  type RecoveryCreateResponse,
  type RecoveryListResponse,
} from "@/features/recovery/recovery.contract";
import { recoveryFormSchema, type RecoveryFormValues } from "@/features/recovery/recovery-form.schema";

type DemoScenario = "baseline" | "empty" | "unavailable" | "save-error" | "network-error";

const stepNames = ["Keselamatan", "Cara pengisian", "Penilaian mandiri", "Konfirmasi"] as const;
const defaultValues: Partial<RecoveryFormValues> = { assistanceNote: "", responseNote: "", confirmation: false };

export function RecoveryCheckinView() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [emergency, setEmergency] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario>("baseline");
  const [createdCheckins, setCreatedCheckins] = useState<RecoveryCheckin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDevelopment = process.env.NODE_ENV !== "production";
  const form = useForm<RecoveryFormValues>({ resolver: zodResolver(recoveryFormSchema), defaultValues, mode: "onTouched" });
  const values = useWatch({ control: form.control });

  const historyQuery = useQuery({
    queryKey: ["recovery-checkins", "current-authenticated-user", scenario],
    queryFn: ({ signal }) => fetchRecoveryHistory(scenario, signal),
  });
  const serverCheckins = historyQuery.data?.data.status === "ok" ? historyQuery.data.data.checkins : [];
  const checkins = [...createdCheckins, ...serverCheckins].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  const createMutation = useMutation({
    mutationFn: async (input: RecoveryCheckinCreate) => {
      if (isDevelopment && scenario === "network-error") throw new Error("Simulated network loss");
      return createRecoveryCheckin(input, checkins.length === 0, scenario);
    },
    onSuccess: (response) => {
      if (response.data.status !== "saved") return;
      void queryClient.invalidateQueries({ queryKey: ["recovery-progress"] });
      const checkin = response.data.checkin;
      setCreatedCheckins((current) => current.some((item) => item.id === checkin.id) ? current : [checkin, ...current]);
      setSelectedId(checkin.id);
      setStep(4);
    },
  });

  async function continueStep() {
    if (step === 0) {
      if (!(await form.trigger("emergencySymptoms"))) return;
      if (values.emergencySymptoms === "yes") {
        setEmergency(true);
        return;
      }
    }
    if (step === 1 && !(await form.trigger(["source", "assistanceNote"]))) return;
    if (step === 2 && !(await form.trigger(["dailyActivity", "perceivedLimitation", "newConcerns", "practiceFrequency", "responseNote"]))) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  const submit = form.handleSubmit((formValues) => {
    if (formValues.emergencySymptoms === "yes" || createMutation.isPending) {
      setEmergency(formValues.emergencySymptoms === "yes");
      return;
    }
    createMutation.mutate(toCreateInput(formValues));
  });

  function restart() {
    createMutation.reset();
    form.reset(defaultValues);
    setEmergency(false);
    setStep(0);
  }

  function chooseScenario(next: DemoScenario) {
    setScenario(next);
    setCreatedCheckins([]);
    setSelectedId(null);
    restart();
  }

  const selected = checkins.find((checkin) => checkin.id === selectedId) ?? null;
  const baseline = checkins.find((checkin) => checkin.isBaseline) ?? null;

  return (
    <main>
      <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate"><ArrowLeft className="size-4" />Kembali ke beranda</Link>
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F05 · NeuroRecovery</span>{isDevelopment ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}</div><h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Penilaian mandiri pemulihan</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Catat pengalaman aktivitas dan kendala yang Anda rasakan. Check-in ini bukan skor klinis dan tidak menentukan apakah Anda aman untuk berlatih.</p></div>
      </div>

      {isDevelopment ? <DemoControls scenario={scenario} onChange={chooseScenario} /> : null}

      {emergency ? <EmergencyPanel onRestart={restart} /> : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white">
            {step < 4 ? <div className="border-b border-black/5 px-5 py-5 sm:px-8"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold text-neuro-slate">Langkah {step + 1} dari 4</p><p className="text-xs text-muted-foreground">{stepNames[step]}</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label={`Langkah ${step + 1} dari 4`}><div className="h-full rounded-full bg-neuro-slate transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} /></div></div> : null}
            <form onSubmit={submit} className="p-5 sm:p-8" noValidate>
              {step === 0 ? <SafetyStep register={form.register} error={form.formState.errors.emergencySymptoms?.message} /> : null}
              {step === 1 ? <AssistanceStep register={form.register} source={values.source} errors={form.formState.errors} /> : null}
              {step === 2 ? <QuestionsStep register={form.register} errors={form.formState.errors} hasNewConcerns={values.newConcerns === "yes"} onEmergency={() => { form.setValue("emergencySymptoms", "yes"); setEmergency(true); }} /> : null}
              {step === 3 ? <ReviewStep register={form.register} values={values} error={form.formState.errors.confirmation?.message} /> : null}
              {step === 4 ? <SavedPanel response={createMutation.data} onRestart={restart} /> : null}

              <div aria-live="polite">
                {createMutation.isError ? <p className="mt-6 rounded-2xl bg-[#fff1f1] p-4 text-sm leading-6 text-[#8b2028]">Jaringan tidak tersedia. Tidak ada check-in yang disimpan. Periksa koneksi lalu coba lagi.</p> : null}
                {createMutation.data?.data.status === "unavailable" ? <p className="mt-6 rounded-2xl bg-[#fff9ec] p-4 text-sm leading-6 text-[#79520f]">{createMutation.data.data.message}</p> : null}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 && step < 4 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-muted-foreground hover:bg-muted"><ArrowLeft className="size-4" />Kembali</button> : <span />}
                {step < 3 ? <button type="button" onClick={continueStep} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white">Lanjutkan<ArrowRight className="size-4" /></button> : null}
                {step === 3 ? <button type="submit" disabled={createMutation.isPending} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">{createMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{createMutation.isPending ? "Mengirim…" : "Konfirmasi check-in"}</button> : null}
              </div>
            </form>
          </section>

          <HistoryPanel query={historyQuery} checkins={checkins} selectedId={selectedId} onSelect={setSelectedId} onRetry={() => historyQuery.refetch()} />
        </div>
      )}

      {!emergency && selected ? <CheckinDetail checkin={selected} baseline={baseline} /> : null}
    </main>
  );
}

function SafetyStep({ register, error }: { register: UseFormRegister<RecoveryFormValues>; error?: string }) {
  return <div><StepHeading icon={ShieldAlert} eyebrow="Pemeriksaan keselamatan" title="Periksa gejala baru sebelum check-in." description="Pertanyaan keselamatan ini harus dijawab sebelum penilaian mandiri. Teks final masih menunggu persetujuan klinis." /><div className="mt-7 rounded-3xl border border-[#e6b4b8] bg-[#fff4f4] p-5"><p className="text-base font-semibold leading-6 text-[#8b2028]">Apakah Anda sedang mengalami gejala baru yang muncul mendadak, seperti wajah menurun pada satu sisi, kelemahan satu sisi tubuh, atau kesulitan bicara?</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><RadioOption register={register} name="emergencySymptoms" value="yes" label="Ya, sedang mengalami" description="Hentikan check-in dan tampilkan bantuan darurat." /><RadioOption register={register} name="emergencySymptoms" value="no" label="Tidak" description="Lanjutkan ke penilaian mandiri." /></div><ErrorText message={error} /></div></div>;
}

function AssistanceStep({ register, source, errors }: { register: UseFormRegister<RecoveryFormValues>; source?: RecoveryFormValues["source"]; errors: ReturnType<typeof useForm<RecoveryFormValues>>["formState"]["errors"] }) {
  return <div><StepHeading icon={HandHelping} eyebrow="Cara pengisian" title="Check-in dapat diisi sendiri atau dengan bantuan." description="Jawaban tetap merupakan laporan pengguna, bukan observasi klinis dari pendamping." /><div className="mt-7 grid gap-3 sm:grid-cols-2"><RadioOption register={register} name="source" value="self_report" label="Saya mengisi sendiri" /><RadioOption register={register} name="source" value="assisted" label="Saya dibantu" /></div><ErrorText message={errors.source?.message} />{source === "assisted" ? <Field label="Catatan bantuan" hint="Jelaskan bentuk bantuan, tanpa memasukkan nama atau kontak pendamping."><textarea {...register("assistanceNote")} rows={4} maxLength={280} className="field-control min-h-28 py-3" /><ErrorText message={errors.assistanceNote?.message} /></Field> : null}</div>;
}

function QuestionsStep({ register, errors, hasNewConcerns, onEmergency }: { register: UseFormRegister<RecoveryFormValues>; errors: ReturnType<typeof useForm<RecoveryFormValues>>["formState"]["errors"]; hasNewConcerns: boolean; onEmergency: () => void }) {
  return <div><StepHeading icon={ClipboardList} eyebrow="Question set demonstrasi" title="Catat pengalaman tanpa membuat skor pemulihan." description="Pertanyaan dan pilihan ini hanya fixture UI sambil menunggu review research teammate; data produksi belum dapat disimpan." /><div className="mt-7 space-y-7"><Question label="Status aktivitas harian yang Anda pilih" register={register} name="dailyActivity" error={errors.dailyActivity?.message} choices={[["completed", "Selesai"], ["completed_with_assistance", "Selesai dengan bantuan"], ["not_completed", "Belum selesai"], ["unknown", "Tidak tahu / lewati"]]} /><Question label="Kendala yang dirasakan saat aktivitas" register={register} name="perceivedLimitation" error={errors.perceivedLimitation?.message} choices={[["not_reported", "Tidak ada kendala yang dicatat"], ["some_limitation", "Ada kendala"], ["major_limitation", "Kendala terasa besar"], ["unknown", "Tidak tahu / lewati"]]} /><Question label="Kekhawatiran baru yang ingin dicatat" register={register} name="newConcerns" error={errors.newConcerns?.message} choices={[["yes", "Ya"], ["no", "Tidak"], ["unknown", "Tidak tahu / lewati"]]} />{hasNewConcerns ? <div className="rounded-2xl border border-[#e6b4b8] bg-[#fff4f4] p-4 text-[#8b2028]"><p className="text-sm font-semibold">Apakah kekhawatiran ini berupa gejala baru yang muncul mendadak?</p><p className="mt-1 text-xs leading-5 opacity-75">Jika ya, hentikan check-in dan jangan melanjutkan latihan.</p><button type="button" onClick={onEmergency} className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold"><ShieldAlert className="size-4" />Ya, tampilkan bantuan darurat</button></div> : null}<Question label="Frekuensi latihan yang dipilih sejak check-in sebelumnya" register={register} name="practiceFrequency" error={errors.practiceFrequency?.message} choices={[["not_practiced", "Belum dilakukan"], ["once", "Satu kali"], ["more_than_once", "Lebih dari satu kali"], ["unknown", "Tidak tahu / lewati"]]} /><Field label="Catatan opsional" hint="Tuliskan pengalaman dengan kata-kata Anda sendiri; teks disimpan apa adanya pada kontrak."><textarea {...register("responseNote")} rows={4} maxLength={280} className="field-control min-h-28 py-3" /><ErrorText message={errors.responseNote?.message} /></Field></div></div>;
}

function ReviewStep({ register, values, error }: { register: UseFormRegister<RecoveryFormValues>; values: Partial<RecoveryFormValues>; error?: string }) {
  const rows = [["Cara pengisian", values.source === "assisted" ? "Dengan bantuan" : "Mandiri"], ["Aktivitas harian", answerLabel(values.dailyActivity)], ["Kendala", answerLabel(values.perceivedLimitation)], ["Kekhawatiran baru", answerLabel(values.newConcerns)], ["Frekuensi latihan", answerLabel(values.practiceFrequency)]];
  return <div><StepHeading icon={Check} eyebrow="Tinjau isian" title="Pastikan laporan sudah sesuai." description="Konfirmasi hanya menyimpan fixture pada sesi demo setelah server merespons. Tidak ada skor klinis yang dihitung." /><dl className="mt-7 divide-y divide-black/5 rounded-3xl border border-black/5 bg-neuro-cream px-5">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto]"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-sm font-semibold text-neuro-slate">{value}</dd></div>)}</dl><label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-neuro-slate/10 p-4"><input type="checkbox" {...register("confirmation")} className="mt-1 size-5 accent-[#243746]" /><span><span className="block text-sm font-semibold text-neuro-slate">Saya mengonfirmasi isian ini adalah laporan mandiri.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Laporan ini bukan diagnosis, skor pemulihan, atau persetujuan untuk memulai latihan.</span></span></label><ErrorText message={error} /></div>;
}

function SavedPanel({ response, onRestart }: { response?: RecoveryCreateResponse; onRestart: () => void }) {
  if (!response || response.data.status !== "saved") return <div className="grid min-h-60 place-items-center text-center"><div><AlertTriangle className="mx-auto size-7 text-[#79520f]" /><h2 className="mt-4 text-xl font-semibold">Check-in belum disimpan</h2><p className="mt-2 text-sm text-muted-foreground">Tidak ada konfirmasi keberhasilan dari server.</p></div></div>;
  return <div className="grid min-h-60 place-items-center text-center"><div className="max-w-lg"><CheckCircle2 className="mx-auto size-10 text-[#2e6b3a]" /><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#2e6b3a]">Ditambahkan ke sesi demo sementara</p><h2 className="mt-2 text-2xl font-semibold text-neuro-slate">Check-in tercatat sebagai {response.data.checkin.isBaseline ? "baseline" : "follow-up"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Waktu: {formatDate(response.data.checkin.recordedAt)}. Muat ulang halaman akan menghapus entri demo ini.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={onRestart} className="primary-action"><RotateCcw className="size-4" />Check-in lagi</button><Link href="/app/action-plan" className="focus-ring inline-flex min-h-11 items-center rounded-full border border-black/10 px-4 text-sm font-semibold text-neuro-slate">Lihat rencana tindakan</Link></div></div></div>;
}

function HistoryPanel({ query, checkins, selectedId, onSelect, onRetry }: { query: ReturnType<typeof useQuery<RecoveryListResponse>>; checkins: RecoveryCheckin[]; selectedId: string | null; onSelect: (id: string) => void; onRetry: () => void }) {
  return <aside className="rounded-[2rem] border border-black/5 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Riwayat</p><h2 className="mt-1 font-semibold text-neuro-slate">Penilaian mandiri</h2></div><History className="size-5 text-neuro-slate" /></div><div className="mt-5" aria-live="polite">{query.isPending ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Memuat riwayat…</p> : null}{query.isError || query.data?.data.status === "unavailable" ? <div className="rounded-2xl bg-[#fff9ec] p-4"><p className="text-sm text-[#79520f]">Riwayat tidak tersedia. Check-in baru belum dianggap tersimpan.</p><button type="button" onClick={onRetry} className="focus-ring mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-semibold"><RefreshCw className="size-3.5" />Coba lagi</button></div> : null}{!query.isPending && !query.isError && checkins.length === 0 ? <div className="rounded-2xl bg-neuro-cream p-4"><FileQuestion className="size-5 text-neuro-slate" /><p className="mt-3 text-sm font-semibold text-neuro-slate">Belum ada riwayat</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Check-in pertama akan ditandai baseline setelah server mengonfirmasi.</p></div> : null}<div className="grid gap-2">{checkins.map((checkin) => <button type="button" key={checkin.id} onClick={() => onSelect(checkin.id)} aria-pressed={selectedId === checkin.id} className="focus-ring min-h-16 rounded-2xl border border-black/5 p-3 text-left aria-pressed:border-neuro-slate aria-pressed:bg-neuro-blue"><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-neuro-slate">{checkin.isBaseline ? "Baseline" : "Follow-up"}</span><span className="text-[0.65rem] uppercase text-muted-foreground">{checkin.source === "assisted" ? "Dibantu" : "Mandiri"}</span></span><span className="mt-1 block text-xs text-muted-foreground">{formatDate(checkin.recordedAt)}</span></button>)}</div></div></aside>;
}

function CheckinDetail({ checkin, baseline }: { checkin: RecoveryCheckin; baseline: RecoveryCheckin | null }) {
  return <section className="mt-5 rounded-[2rem] border border-black/5 bg-white p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detail read-only</p><h2 className="mt-2 text-2xl font-semibold text-neuro-slate">{checkin.isBaseline ? "Baseline penilaian mandiri" : "Follow-up penilaian mandiri"}</h2></div><span className="rounded-full bg-neuro-blue px-3 py-2 text-xs font-semibold text-neuro-slate">{formatDate(checkin.recordedAt)}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Perbandingan hanya menunjukkan apakah teks pilihan berubah dari baseline. Ini bukan peningkatan, penurunan, atau skor klinis.</p><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm"><thead><tr className="border-b border-black/10 text-muted-foreground"><th className="p-3 font-medium">Pertanyaan</th><th className="p-3 font-medium">Baseline</th><th className="p-3 font-medium">Isian ini</th><th className="p-3 font-medium">Perbandingan</th></tr></thead><tbody>{checkin.answers.map((answer) => { const baselineAnswer = baseline?.answers.find((item) => item.questionId === answer.questionId); const changed = baselineAnswer ? baselineAnswer.responseId !== answer.responseId : null; return <tr key={answer.questionId} className="border-b border-black/5"><th className="p-3 font-medium text-neuro-slate">{questionLabel(answer.questionId)}</th><td className="p-3 text-muted-foreground">{baselineAnswer ? answerLabel(baselineAnswer.responseId) : "Data tidak tersedia"}</td><td className="p-3 text-neuro-slate">{answerLabel(answer.responseId)}</td><td className="p-3 text-muted-foreground">{changed === null ? "Tidak dibandingkan" : changed ? "Jawaban berbeda" : "Jawaban sama"}</td></tr>; })}</tbody></table></div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>Sumber: {checkin.source === "assisted" ? "Laporan mandiri dengan bantuan" : "Laporan mandiri"}</span><span>Instrumen: fixture pending review</span><span>Status: selesai di demo</span></div></section>;
}

function EmergencyPanel({ onRestart }: { onRestart: () => void }) { return <section className="mt-6 rounded-[2rem] border border-[#e6b4b8] bg-[#fff4f4] p-6 text-[#8b2028] sm:p-8" role="alert"><ShieldAlert className="size-8" /><h2 className="mt-4 text-2xl font-semibold">Hentikan check-in dan cari bantuan darurat</h2><p className="mt-3 max-w-2xl text-sm leading-6">Hubungi layanan darurat setempat atau pergi ke fasilitas kesehatan terdekat. Jangan melanjutkan check-in atau latihan dan jangan menunggu penilaian aplikasi.</p><p className="mt-3 text-xs leading-5 opacity-75">NeuroCare tidak menilai tingkat kegawatan dan tidak menyimpan check-in rutin dari jalur ini.</p><button type="button" onClick={onRestart} className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#8b2028]"><RotateCcw className="size-4" />Tinjau kembali jawaban</button></section>; }

function StepHeading({ icon: Icon, eyebrow, title, description }: { icon: typeof Info; eyebrow: string; title: string; description: string }) { return <div><span className="grid size-11 place-items-center rounded-2xl bg-neuro-blue text-neuro-slate"><Icon className="size-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neuro-slate">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="mt-6 block"><span className="text-sm font-semibold text-neuro-slate">{label}</span>{hint ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{hint}</span> : null}<span className="mt-3 block">{children}</span></label>; }
function ErrorText({ message }: { message?: string }) { return message ? <p className="mt-2 text-sm text-[#a12626]" role="alert">{message}</p> : null; }

function RadioOption<TName extends Path<RecoveryFormValues>>({ register, name, value, label, description }: { register: UseFormRegister<RecoveryFormValues>; name: TName; value: string; label: string; description?: string }) { return <label className="focus-within:ring-ring/30 flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3"><input type="radio" value={value} {...register(name)} className="mt-1 size-5 shrink-0 accent-[#243746]" /><span><span className="block text-sm font-semibold text-neuro-slate">{label}</span>{description ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span> : null}</span></label>; }

function Question<TName extends Path<RecoveryFormValues>>({ label, register, name, choices, error }: { label: string; register: UseFormRegister<RecoveryFormValues>; name: TName; choices: Array<[string, string]>; error?: string }) { return <fieldset><legend className="text-base font-semibold text-neuro-slate">{label}</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{choices.map(([value, choiceLabel]) => <RadioOption key={value} register={register} name={name} value={value} label={choiceLabel} />)}</div><ErrorText message={error} /></fieldset>; }

function DemoControls({ scenario, onChange }: { scenario: DemoScenario; onChange: (value: DemoScenario) => void }) { const choices: Array<[DemoScenario, string]> = [["baseline", "Ada baseline"], ["empty", "Check-in pertama"], ["unavailable", "Riwayat gagal"], ["save-error", "Simpan gagal"], ["network-error", "Jaringan terputus"]]; return <div className="mt-6 rounded-3xl border border-[#ead39f] bg-[#fff9ec] p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#79520f]">Skenario data demo (simulasi)</p><div className="mt-3 flex flex-wrap gap-2">{choices.map(([value, label]) => <button type="button" key={value} onClick={() => onChange(value)} aria-pressed={scenario === value} className="focus-ring min-h-10 rounded-full border border-[#79520f]/15 bg-white px-3 text-xs font-medium text-[#79520f] aria-pressed:bg-[#79520f] aria-pressed:text-white">{label}</button>)}</div></div>; }

async function fetchRecoveryHistory(scenario: DemoScenario, signal: AbortSignal): Promise<RecoveryListResponse> {
  if (process.env.NODE_ENV !== "production" && scenario === "network-error") throw new Error("Simulated network loss");
  const apiScenario = scenario === "empty" ? "empty" : scenario === "unavailable" ? "unavailable" : "baseline";
  const response = await fetch(`/api/recovery/checkins?scenario=${apiScenario}`, { headers: process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Recovery-Demo": "recovery-fixture-v1" } : {}, cache: "no-store", signal });
  if (!response.ok) throw new Error("Recovery history request failed");
  const payload: unknown = await response.json();
  const parsed = recoveryListResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid recovery history response");
  return parsed.data;
}

async function createRecoveryCheckin(input: RecoveryCheckinCreate, isBaseline: boolean, scenario: DemoScenario): Promise<RecoveryCreateResponse> {
  const response = await fetch("/api/recovery/checkins", { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Recovery-Demo": "recovery-fixture-v1", "X-NeuroCare-Recovery-Entry": isBaseline ? "baseline" : "follow-up", ...(scenario === "save-error" ? { "X-NeuroCare-Recovery-Create": "unavailable" } : {}) } : {}) }, body: JSON.stringify(input), cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("Recovery create request failed");
  const payload: unknown = await response.json();
  const parsed = recoveryCreateResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid recovery create response");
  return parsed.data;
}

function toCreateInput(values: RecoveryFormValues): RecoveryCheckinCreate {
  const note = values.responseNote || null;
  return { requestId: crypto.randomUUID(), instrumentVersion: RECOVERY_DEMO_INSTRUMENT_VERSION, observedAt: new Date().toISOString(), safetyStatus: "clear", source: values.source, assistanceNote: values.source === "assisted" ? values.assistanceNote || null : null, answers: [{ questionId: "daily_activity_completion", responseId: values.dailyActivity, note: null }, { questionId: "perceived_limitation", responseId: values.perceivedLimitation, note: null }, { questionId: "new_concerns", responseId: values.newConcerns, note }, { questionId: "practice_frequency", responseId: values.practiceFrequency, note: null }], confirmation: true };
}

function questionLabel(value: RecoveryCheckin["answers"][number]["questionId"]) { return { daily_activity_completion: "Aktivitas harian", perceived_limitation: "Kendala yang dirasakan", new_concerns: "Kekhawatiran baru", practice_frequency: "Frekuensi latihan" }[value]; }
function answerLabel(value?: string) { if (!value) return "Belum dijawab"; return { self_report: "Mandiri", assisted: "Dengan bantuan", completed: "Selesai", completed_with_assistance: "Selesai dengan bantuan", not_completed: "Belum selesai", not_reported: "Tidak ada kendala yang dicatat", some_limitation: "Ada kendala", major_limitation: "Kendala terasa besar", yes: "Ya", no: "Tidak", not_practiced: "Belum dilakukan", once: "Satu kali", more_than_once: "Lebih dari satu kali", unknown: "Tidak tahu / dilewati" }[value] ?? "Data tidak tersedia"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }

