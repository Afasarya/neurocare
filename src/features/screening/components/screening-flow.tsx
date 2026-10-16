"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Path, type UseFormRegister } from "react-hook-form";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Clock3,
  Info,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  apiErrorResponseSchema,
  screeningAnalyzeResponseSchema,
  type ScreeningResult,
} from "@/features/screening/screening.contract";
import {
  screeningClientSchema,
  type ScreeningFormValues,
} from "@/features/screening/screening.schema";

const steps = ["Keselamatan", "Kelayakan", "Data kesehatan", "Tinjau"] as const;

const defaultValues: Partial<ScreeningFormValues> = {
  pathway: "neuroprevent",
  dateOfBirth: "",
  systolicBpStatus: "unknown",
  systolicBpMmHg: "",
  systolicBpMeasuredAt: "",
  heightStatus: "unknown",
  heightCm: "",
  weightStatus: "unknown",
  weightKg: "",
  consentToAnalyze: false,
};

export function ScreeningFlow() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [isDemoResult, setIsDemoResult] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningClientSchema),
    defaultValues,
    mode: "onTouched",
  });

  const values = useWatch({ control });

  async function continueStep() {
    if (step === 0) {
      const valid = await trigger("emergencySymptoms");
      if (!valid) return;
      if (values.emergencySymptoms === "yes") {
        setResult({
          status: "emergency",
          message:
            "Hentikan skrining dan segera cari bantuan darurat setempat atau fasilitas kesehatan terdekat.",
        });
        setIsDemoResult(false);
        setStep(4);
        return;
      }
    }
    if (step === 1) {
      const valid = await trigger(["dateOfBirth", "sexForChart", "priorCvd"]);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await trigger([
        "smokingStatus",
        "systolicBpStatus",
        "systolicBpMmHg",
        "systolicBpMeasuredAt",
        "heightStatus",
        "heightCm",
        "weightStatus",
        "weightKg",
      ]);
      if (!valid) return;
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  const submitScreening = handleSubmit(async (formValues) => {
    setSubmitError(null);
    const requestId = crypto.randomUUID();
    const payload = {
      ...formValues,
      systolicBpMmHg:
        formValues.systolicBpStatus === "known" ? formValues.systolicBpMmHg : null,
      systolicBpMeasuredAt:
        formValues.systolicBpStatus === "known" ? formValues.systolicBpMeasuredAt : null,
      heightCm: formValues.heightStatus === "known" ? formValues.heightCm : null,
      weightKg: formValues.weightStatus === "known" ? formValues.weightKg : null,
      requestId,
    };

    try {
      const response = await fetch("/api/screening/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true"
            ? { "X-NeuroCare-Demo": "screening-fixture-v1" }
            : {}),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      const responsePayload: unknown = await response.json();

      if (!response.ok) {
        const parsedError = apiErrorResponseSchema.safeParse(responsePayload);
        setSubmitError(
          parsedError.success
            ? parsedError.data.error.message
            : "Skrining tidak dapat dikirim. Tidak ada hasil yang dibuat.",
        );
        return;
      }

      const parsed = screeningAnalyzeResponseSchema.safeParse(responsePayload);
      if (!parsed.success) {
        setResult({
          status: "unavailable",
          reason: "invalid_engine_response",
          retryable: false,
          message: "Respons layanan tidak valid. Tidak ada hasil yang dibuat.",
        });
        setIsDemoResult(false);
      } else {
        setResult(parsed.data.data);
        setIsDemoResult(parsed.data.meta.demo);
      }
      setStep(4);
    } catch {
      setResult({
        status: "unavailable",
        reason: "timeout",
        retryable: true,
        message: "Layanan belum merespons. Tidak ada hasil atau angka risiko yang dibuat.",
      });
      setIsDemoResult(false);
      setStep(4);
    }
  });

  function restart() {
    reset(defaultValues);
    setResult(null);
    setIsDemoResult(false);
    setSubmitError(null);
    setStep(0);
  }

  return (
    <main>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F01 • NeuroPrevent</span>
            {process.env.NEXT_PUBLIC_NEUROCARE_DEMO_MODE === "true" ? (
              <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span>
            ) : null}
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Skrining faktor risiko</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Catat data yang Anda ketahui untuk memeriksa kelengkapan informasi dan kelayakan analisis CVD 10 tahun.</p>
        </div>
        <Link href="/app/screening/history" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-neuro-slate/10 bg-white px-4 text-sm font-medium text-neuro-slate"><Clock3 className="size-4" />Lihat riwayat</Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white">
          {step < 4 ? (
            <div className="border-b border-black/5 px-5 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-neuro-slate">Langkah {step + 1} dari 4</p>
                <p className="text-xs text-muted-foreground">{steps[step]}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label={`Langkah ${step + 1} dari 4`}>
                <div className="h-full rounded-full bg-neuro-slate transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} />
              </div>
            </div>
          ) : null}

          <form onSubmit={submitScreening} className="p-5 sm:p-8" noValidate>
            {step === 0 ? <SafetyStep register={register} error={errors.emergencySymptoms?.message} /> : null}
            {step === 1 ? <EligibilityStep register={register} errors={errors} /> : null}
            {step === 2 ? <HealthDataStep register={register} errors={errors} values={values} /> : null}
            {step === 3 ? <ReviewStep register={register} values={values} error={errors.consentToAnalyze?.message} /> : null}
            {step === 4 && result ? <ResultPanel result={result} demo={isDemoResult} /> : null}

            <div aria-live="polite">
              {submitError ? <p className="mt-6 rounded-2xl bg-[#f8d7da] p-4 text-sm leading-6 text-[#8b2028]">{submitError}</p> : null}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 && step < 4 ? (
                <button type="button" onClick={() => setStep((current) => current - 1)} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-muted-foreground hover:bg-muted"><ArrowLeft className="size-4" />Kembali</button>
              ) : <span />}
              {step < 3 ? (
                <button type="button" onClick={continueStep} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white hover:bg-[#182a38]">Lanjutkan<ArrowRight className="size-4" /></button>
              ) : null}
              {step === 3 ? (
                <button type="submit" disabled={isSubmitting} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white hover:bg-[#182a38] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}{isSubmitting ? "Memeriksa…" : "Kirim untuk diperiksa"}</button>
              ) : null}
              {step === 4 ? (
                <button type="button" onClick={restart} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white"><RotateCcw className="size-4" />Mulai ulang</button>
              ) : null}
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-black/5 bg-neuro-blue p-5"><Info className="size-5 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">Tentang hasil</h2><p className="mt-2 text-sm leading-6 text-neuro-slate/65">Jika tersedia dan Anda memenuhi syarat, hasil berarti estimasi risiko kejadian penyakit kardiovaskular (CVD) gabungan 10 tahun—bukan kemungkinan stroke individual.</p></div>
          <div className="rounded-3xl border border-black/5 bg-white p-5"><LockKeyhole className="size-5 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">Privasi data</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Jawaban tidak disimpan di localStorage. Mode demo development tidak membuat riwayat atau menulis ke database.</p></div>
        </aside>
      </div>
    </main>
  );
}

function SafetyStep({ register, error }: { register: UseFormRegister<ScreeningFormValues>; error?: string }) {
  return <div><StepHeading icon={ShieldAlert} eyebrow="Pemeriksaan keselamatan" title="Sebelum memulai, periksa kondisi saat ini." description="Jika Anda sedang mengalami gejala yang muncul mendadak seperti wajah menurun pada satu sisi, kelemahan satu sisi tubuh, atau kesulitan bicara, jangan lanjutkan skrining rutin." /><div className="mt-8 rounded-3xl border border-[#e6b4b8] bg-[#fff4f4] p-5"><p className="text-sm font-semibold text-[#8b2028]">Apakah Anda sedang mengalami gejala mendadak tersebut sekarang?</p><p className="mt-2 text-xs leading-5 text-[#8b2028]/75">Teks safety gate ini masih memerlukan persetujuan klinis final dan tidak menilai tingkat kegawatan.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><RadioOption register={register} name="emergencySymptoms" value="yes" label="Ya, sedang mengalami" description="Hentikan alur dan cari bantuan darurat." /><RadioOption register={register} name="emergencySymptoms" value="no" label="Tidak" description="Lanjutkan ke skrining rutin." /></div><ErrorText message={error} /></div></div>;
}

function EligibilityStep({ register, errors }: { register: UseFormRegister<ScreeningFormValues>; errors: ReturnType<typeof useForm<ScreeningFormValues>>["formState"]["errors"] }) {
  return <div><StepHeading icon={ShieldCheck} eyebrow="Kelayakan" title="Pastikan jalur skrining sesuai dengan riwayat Anda." description="Informasi ini digunakan untuk menentukan apakah data dapat dikirim ke engine primary-prevention yang disetujui." /><div className="mt-8 grid gap-6"><Field label="Tanggal lahir" hint="Digunakan untuk kelompok usia; tidak menghasilkan skor di browser."><input type="date" {...register("dateOfBirth")} className="field-control" aria-invalid={!!errors.dateOfBirth} /><ErrorText message={errors.dateOfBirth?.message} /></Field><Field label="Kategori jenis kelamin pada chart" hint="Pilih sesuai dokumen kesehatan. Pilihan ini mengikuti kebutuhan chart dan bukan identitas gender."><div className="grid gap-3 sm:grid-cols-3"><RadioOption register={register} name="sexForChart" value="female" label="Perempuan" /><RadioOption register={register} name="sexForChart" value="male" label="Laki-laki" /><RadioOption register={register} name="sexForChart" value="unknown" label="Tidak tahu" /></div><ErrorText message={errors.sexForChart?.message} /></Field><Field label="Apakah pernah didiagnosis stroke, TIA, atau penyakit kardiovaskular?" hint="Pengguna dengan riwayat tersebut tidak boleh menerima skor primary-prevention WHO."><div className="grid gap-3 sm:grid-cols-3"><RadioOption register={register} name="priorCvd" value="yes" label="Ya" /><RadioOption register={register} name="priorCvd" value="no" label="Tidak" /><RadioOption register={register} name="priorCvd" value="unknown" label="Tidak tahu" /></div><ErrorText message={errors.priorCvd?.message} /></Field></div></div>;
}

function HealthDataStep({ register, errors, values }: { register: UseFormRegister<ScreeningFormValues>; errors: ReturnType<typeof useForm<ScreeningFormValues>>["formState"]["errors"]; values: Partial<ScreeningFormValues> }) {
  return <div><StepHeading icon={ClipboardCheck} eyebrow="Data kesehatan" title="Masukkan yang diketahui, tandai yang belum tersedia." description="NeuroCare tidak menebak hasil pengukuran yang kosong. Gunakan angka dari pengukuran atau catatan Anda." /><div className="mt-8 grid gap-7"><Field label="Status merokok"><div className="grid gap-3 sm:grid-cols-3"><RadioOption register={register} name="smokingStatus" value="yes" label="Ya" /><RadioOption register={register} name="smokingStatus" value="no" label="Tidak" /><RadioOption register={register} name="smokingStatus" value="unknown" label="Tidak tahu" /></div><ErrorText message={errors.smokingStatus?.message} /></Field><MeasurementGroup label="Tekanan darah sistolik" statusName="systolicBpStatus" register={register}><div className="grid gap-3 sm:grid-cols-2"><Field label="Nilai (mmHg)"><input inputMode="decimal" maxLength={8} disabled={values.systolicBpStatus !== "known"} {...register("systolicBpMmHg")} className="field-control disabled:cursor-not-allowed disabled:opacity-45" placeholder="Contoh: 120" /><ErrorText message={errors.systolicBpMmHg?.message} /></Field><Field label="Tanggal pengukuran"><input type="date" disabled={values.systolicBpStatus !== "known"} {...register("systolicBpMeasuredAt")} className="field-control disabled:cursor-not-allowed disabled:opacity-45" /><ErrorText message={errors.systolicBpMeasuredAt?.message} /></Field></div></MeasurementGroup><div className="grid gap-6 sm:grid-cols-2"><MeasurementGroup label="Tinggi badan" statusName="heightStatus" register={register}><Field label="Tinggi (cm)"><input inputMode="decimal" maxLength={8} disabled={values.heightStatus !== "known"} {...register("heightCm")} className="field-control disabled:opacity-45" placeholder="Contoh: 165" /><ErrorText message={errors.heightCm?.message} /></Field></MeasurementGroup><MeasurementGroup label="Berat badan" statusName="weightStatus" register={register}><Field label="Berat (kg)"><input inputMode="decimal" maxLength={8} disabled={values.weightStatus !== "known"} {...register("weightKg")} className="field-control disabled:opacity-45" placeholder="Contoh: 60" /><ErrorText message={errors.weightKg?.message} /></Field></MeasurementGroup></div></div></div>;
}

function ReviewStep({ register, values, error }: { register: UseFormRegister<ScreeningFormValues>; values: Partial<ScreeningFormValues>; error?: string }) {
  const rows = [["Tanggal lahir", values.dateOfBirth || "Belum diisi"], ["Jenis kelamin pada chart", labelValue(values.sexForChart)], ["Riwayat stroke/TIA/CVD", labelValue(values.priorCvd)], ["Status merokok", labelValue(values.smokingStatus)], ["Tekanan darah sistolik", values.systolicBpStatus === "known" ? `${values.systolicBpMmHg || "—"} mmHg` : "Tidak diketahui"], ["Tinggi badan", values.heightStatus === "known" ? `${values.heightCm || "—"} cm` : "Tidak diketahui"], ["Berat badan", values.weightStatus === "known" ? `${values.weightKg || "—"} kg` : "Tidak diketahui"]];
  return <div><StepHeading icon={Check} eyebrow="Tinjau jawaban" title="Pastikan informasi sudah sesuai." description="Data baru akan dikirim setelah Anda memberi persetujuan. Di mode demo, data tidak disimpan." /><dl className="mt-8 divide-y divide-black/5 rounded-3xl border border-black/5 bg-neuro-cream px-5">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto]"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-sm font-semibold text-neuro-slate">{value}</dd></div>)}</dl><label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-neuro-slate/10 p-4"><input type="checkbox" {...register("consentToAnalyze")} className="mt-1 size-4 accent-[#243746]" /><span><span className="block text-sm font-semibold text-neuro-slate">Saya setuju data minimum ini dikirim untuk analisis skrining.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Hasil tervalidasi disimpan di riwayat akun. Pengiriman ke AI Gateway hanya dilakukan bila persetujuan AI eksternal yang tersimpan masih aktif.</span></span></label><ErrorText message={error} /></div>;
}

function ResultPanel({ result, demo }: { result: ScreeningResult; demo: boolean }) {
  if (result.status === "emergency") return <StatusCard tone="danger" icon={ShieldAlert} label="Darurat" title="Cari bantuan darurat sekarang" message={result.message}><p id="bantuan-darurat" className="mt-4 text-sm leading-6">Hubungi layanan darurat setempat atau pergi ke instalasi gawat darurat terdekat. Jangan menunggu hasil skrining, login, atau respons AI.</p></StatusCard>;
  if (result.status === "eligibility_unknown") return <StatusCard tone="warning" icon={AlertTriangle} label="Kelayakan belum diketahui" title="Konfirmasi riwayat kesehatan terlebih dahulu" message={result.message}><ul className="mt-4 list-inside list-disc text-sm">{result.missingFields.map((field) => <li key={field}>{field}</li>)}</ul>{demo ? <DemoNotice /> : null}</StatusCard>;
  if (result.status === "not_eligible") return <StatusCard tone="blue" icon={Info} label="Tidak memenuhi kriteria" title="Tidak ada skor WHO yang dibuat" message={result.message}>{demo ? <DemoNotice /> : null}</StatusCard>;
  if (result.status === "insufficient_data") return <StatusCard tone="warning" icon={AlertTriangle} label="Data belum cukup" title="Lengkapi data sebelum analisis" message={result.message}><ul className="mt-4 list-inside list-disc text-sm">{result.missingFields.map((field) => <li key={field}>{field}</li>)}</ul><Link href="/app/screening/gaps" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-neuro-slate px-4 text-sm font-semibold text-white">Lihat gap pemeriksaan<ArrowRight className="size-4" /></Link>{demo ? <DemoNotice /> : null}</StatusCard>;
  if (result.status === "unavailable") return <StatusCard tone="neutral" icon={Clock3} label="Layanan belum tersedia" title="Tidak ada hasil yang dibuat" message={result.message}>{demo ? <DemoNotice /> : null}</StatusCard>;
  return <StatusCard tone="success" icon={ShieldCheck} label="Hasil terverifikasi" title="Estimasi risiko penyakit kardiovaskular (CVD) 10 tahun" message={result.categoryLabel}><div className="mt-5 grid gap-2 text-xs"><p>Sumber: {result.source.name} • {result.source.region}</p><p>Versi chart: {result.source.version} • Engine: {result.source.engineVersion}</p><p>Waktu hasil: {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(result.completedAt))}</p></div><ul className="mt-4 list-inside list-disc text-xs leading-5">{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></StatusCard>;
}

function StatusCard({ tone, icon: Icon, label, title, message, children }: { tone: "danger" | "blue" | "warning" | "neutral" | "success"; icon: typeof Info; label: string; title: string; message: string; children?: React.ReactNode }) {
  const tones = { danger: "border-[#e6b4b8] bg-[#fff4f4] text-[#8b2028]", blue: "border-[#bfd3ea] bg-[#edf5ff] text-neuro-slate", warning: "border-[#ead39f] bg-[#fff9ec] text-[#79520f]", neutral: "border-black/10 bg-neuro-cream text-neuro-slate", success: "border-[#b9d9bf] bg-[#effaf1] text-[#245c2d]" };
  return <div className={`rounded-3xl border p-6 sm:p-8 ${tones[tone]}`} role="status"><span className="grid size-12 place-items-center rounded-2xl bg-white/75"><Icon className="size-5" /></span><p className="mt-6 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{title}</h2><p className="mt-4 max-w-2xl text-sm leading-6 opacity-80">{message}</p>{children}</div>;
}

function DemoNotice() { return <p className="mt-5 rounded-2xl bg-white/70 p-3 font-mono text-[0.65rem] font-semibold uppercase tracking-wider">Data demo (simulasi) • tidak disimpan</p>; }

function StepHeading({ icon: Icon, eyebrow, title, description }: { icon: typeof Info; eyebrow: string; title: string; description: string }) { return <div className="max-w-2xl"><span className="grid size-11 place-items-center rounded-2xl bg-neuro-green text-neuro-slate"><Icon className="size-5" /></span><p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neuro-slate sm:text-3xl">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></div>; }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <div><p className="text-sm font-semibold text-neuro-slate">{label}</p>{hint ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p> : null}<div className="mt-3">{children}</div></div>; }

function MeasurementGroup({ label, statusName, register, children }: { label: string; statusName: "systolicBpStatus" | "heightStatus" | "weightStatus"; register: UseFormRegister<ScreeningFormValues>; children: React.ReactNode }) { return <fieldset className="rounded-3xl border border-black/5 p-5"><legend className="px-2 text-sm font-semibold text-neuro-slate">{label}</legend><div className="grid gap-3 sm:grid-cols-2"><RadioOption register={register} name={statusName} value="known" label="Saya tahu nilainya" /><RadioOption register={register} name={statusName} value="unknown" label="Belum diketahui" /></div><div className="mt-5">{children}</div></fieldset>; }

function RadioOption({ register, name, value, label, description }: { register: UseFormRegister<ScreeningFormValues>; name: Path<ScreeningFormValues>; value: string; label: string; description?: string }) { return <label className="relative cursor-pointer"><input type="radio" value={value} {...register(name)} className="peer sr-only" /><span className="flex min-h-14 flex-col justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neuro-slate transition peer-checked:border-neuro-slate peer-checked:bg-neuro-green peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40"><span className="font-semibold">{label}</span>{description ? <span className="mt-1 text-xs leading-5 text-muted-foreground">{description}</span> : null}</span></label>; }

function ErrorText({ message }: { message?: string }) { return message ? <p className="mt-2 text-xs font-medium text-destructive" role="alert">{message}</p> : null; }

function labelValue(value: string | undefined) { if (value === "yes") return "Ya"; if (value === "no") return "Tidak"; if (value === "female") return "Perempuan"; if (value === "male") return "Laki-laki"; return "Tidak diketahui"; }
