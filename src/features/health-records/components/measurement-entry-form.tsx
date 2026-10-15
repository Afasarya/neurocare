"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, LoaderCircle, Ruler, Save, Scale, Stethoscope } from "lucide-react";
import {
  measurementCreateResponseSchema,
  type HealthMeasurement,
  type HealthMeasurementCreate,
  type MeasurementCreateResponse,
} from "@/features/health-records/health-records.contract";
import { measurementFormSchema, type MeasurementFormValues } from "@/features/health-records/measurement-form.schema";

export function MeasurementEntryForm({ onSaved }: { onSaved: (measurement: HealthMeasurement) => void }) {
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: { type: "blood_pressure", primaryValue: "", secondaryValue: "", measuredAt: "", confirmation: false },
    mode: "onTouched",
  });
  const type = useWatch({ control: form.control, name: "type" });
  const mutation = useMutation({
    mutationFn: saveMeasurement,
    onSuccess: (response) => {
      if (response.data.status !== "saved") return;
      onSaved(response.data.measurement);
      form.reset({ type, primaryValue: "", secondaryValue: "", measuredAt: "", confirmation: false });
    },
  });

  const submit = form.handleSubmit((values) => mutation.mutate(toCreateInput(values)));
  const primary = type === "blood_pressure" ? { label: "Sistolik", unit: "mmHg", icon: Stethoscope } : type === "weight" ? { label: "Berat", unit: "kg", icon: Scale } : { label: "Tinggi", unit: "cm", icon: Ruler };
  const PrimaryIcon = primary.icon;

  return <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="measurement-form-title">
    <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neuro-blue"><PrimaryIcon className="size-5 text-neuro-slate" /></span><div><h2 id="measurement-form-title" className="text-xl font-semibold text-neuro-slate">Catat pengukuran</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Masukkan hasil yang benar-benar diukur. NeuroCare hanya menyimpan nilai dan tidak menilai normal atau abnormal.</p></div></div>
    <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
      <label className="block"><span className="text-sm font-semibold text-neuro-slate">Jenis pengukuran</span><select {...form.register("type")} className="field-control mt-2"><option value="blood_pressure">Tekanan darah</option><option value="weight">Berat badan</option><option value="height">Tinggi badan</option></select></label>
      <div className={`grid gap-4 ${type === "blood_pressure" ? "sm:grid-cols-2" : ""}`}>
        <Field label={primary.label} unit={primary.unit} error={form.formState.errors.primaryValue?.message}><input inputMode="decimal" {...form.register("primaryValue")} className="field-control pr-16" aria-invalid={Boolean(form.formState.errors.primaryValue)} /></Field>
        {type === "blood_pressure" ? <Field label="Diastolik" unit="mmHg" error={form.formState.errors.secondaryValue?.message}><input inputMode="numeric" {...form.register("secondaryValue")} className="field-control pr-16" aria-invalid={Boolean(form.formState.errors.secondaryValue)} /></Field> : null}
      </div>
      <label className="block"><span className="text-sm font-semibold text-neuro-slate">Waktu pengukuran</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Gunakan waktu asli saat pengukuran dilakukan.</span><input type="datetime-local" {...form.register("measuredAt")} className="field-control mt-2" aria-invalid={Boolean(form.formState.errors.measuredAt)} /><ErrorText message={form.formState.errors.measuredAt?.message} /></label>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30"><input type="checkbox" {...form.register("confirmation")} className="mt-1 size-5 accent-[#243746]" /><span><span className="block text-sm font-semibold text-neuro-slate">Saya mengonfirmasi ini adalah hasil yang saya laporkan.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Sumber akan disimpan sebagai laporan pengguna, bukan hasil diagnosis NeuroCare.</span></span></label><ErrorText message={form.formState.errors.confirmation?.message} />
      <div aria-live="polite">{mutation.isError ? <p className="rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#8b2028]">Jaringan bermasalah. Pengukuran tidak disimpan.</p> : null}{mutation.data?.data.status === "unavailable" ? <p className="rounded-2xl bg-[#fff9ec] p-4 text-sm text-[#79520f]">{mutation.data.data.message}</p> : null}{mutation.data?.data.status === "saved" ? <p className="flex items-center gap-2 rounded-2xl bg-[#effaf1] p-4 text-sm text-[#245c2d]"><CheckCircle2 className="size-4" />Tersimpan pada sesi demo sementara.</p> : null}</div>
      <button type="submit" disabled={mutation.isPending} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white disabled:opacity-50">{mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{mutation.isPending ? "Menyimpan…" : "Simpan pengukuran"}</button>
    </form>
  </section>;
}

function Field({ label, unit, error, children }: { label: string; unit: string; error?: string; children: React.ReactNode }) { return <label className="block"><span className="text-sm font-semibold text-neuro-slate">{label}</span><span className="relative mt-2 block">{children}<span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-muted-foreground">{unit}</span></span><ErrorText message={error} /></label>; }
function ErrorText({ message }: { message?: string }) { return message ? <p className="mt-2 text-sm text-[#a12626]" role="alert">{message}</p> : null; }

function toCreateInput(values: MeasurementFormValues): HealthMeasurementCreate {
  const requestId = crypto.randomUUID();
  const measuredAt = new Date(values.measuredAt).toISOString();
  const primary = Number(values.primaryValue.replace(",", "."));
  if (values.type === "blood_pressure") return { requestId, type: values.type, measuredAt, source: "user_reported", confirmation: true, systolic: primary, diastolic: Number(values.secondaryValue), unit: "mmHg" };
  if (values.type === "weight") return { requestId, type: values.type, measuredAt, source: "user_reported", confirmation: true, value: primary, unit: "kg" };
  return { requestId, type: values.type, measuredAt, source: "user_reported", confirmation: true, value: primary, unit: "cm" };
}

async function saveMeasurement(input: HealthMeasurementCreate): Promise<MeasurementCreateResponse> {
  const response = await fetch("/api/measurements", { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Records-Demo": "health-records-fixture-v1" } : {}) }, body: JSON.stringify(input), cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("Measurement request failed");
  const payload: unknown = await response.json();
  const parsed = measurementCreateResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid measurement response");
  return parsed.data;
}
