"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  BellRing,
  Clock3,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import {
  CAREGIVER_CONTRACT_VERSION,
  CAREGIVER_DEMO_HEADER,
  caregiverInvitationResponseSchema,
  reminderPreferenceResponseSchema,
  type CaregiverInvitationRequest,
  type CaregiverInvitationResponse,
  type CaregiverScope,
  type ReminderPreferenceCreate,
} from "@/features/caregiver/caregiver.contract";
import {
  caregiverInviteFormSchema,
  reminderPreferenceFormSchema,
  type CaregiverInviteFormValues,
  type ReminderPreferenceFormValues,
} from "@/features/caregiver/caregiver.forms";

type InvitationSummary = Extract<CaregiverInvitationResponse["data"], { status: "simulated" }>["invitation"];

const scopeCopy: Record<CaregiverScope, { label: string; description: string }> = {
  action_status_summary: {
    label: "Status rencana tindakan",
    description: "Hanya status umum belum selesai/selesai; tanpa hasil pemeriksaan atau diagnosis.",
  },
  checkin_schedule_summary: {
    label: "Jadwal check-in",
    description: "Hanya tanggal rencana; tanpa jawaban check-in atau catatan pemulihan.",
  },
};

export function CaregiverControlView() {
  const [invitation, setInvitation] = useState<InvitationSummary | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const isDevelopment = process.env.NODE_ENV !== "production";

  const inviteForm = useForm<CaregiverInviteFormValues>({
    resolver: zodResolver(caregiverInviteFormSchema),
    defaultValues: { recipientEmail: "", scopes: ["action_status_summary"], confirmation: false },
  });
  const selectedScopes = useWatch({ control: inviteForm.control, name: "scopes" }) ?? [];

  const reminderForm = useForm<ReminderPreferenceFormValues>({
    resolver: zodResolver(reminderPreferenceFormSchema),
    defaultValues: {
      reminderType: "checkin",
      localTime: "09:00",
      quietHoursEnabled: true,
      quietHoursStart: "21:00",
      quietHoursEnd: "07:00",
      enabled: true,
      confirmation: false,
    },
  });
  const quietHoursEnabled = useWatch({ control: reminderForm.control, name: "quietHoursEnabled" });
  const remindersEnabled = useWatch({ control: reminderForm.control, name: "enabled" });

  const invitationMutation = useMutation({
    mutationFn: submitCaregiverInvitation,
    onSuccess: (response) => {
      if (response.data.status !== "simulated") return;
      setInvitation(response.data.invitation);
      setConfirmingRevoke(false);
      if (response.data.operation === "invite") {
        inviteForm.reset({ recipientEmail: "", scopes: ["action_status_summary"], confirmation: false });
      }
    },
  });

  const reminderMutation = useMutation({ mutationFn: submitReminderPreference });

  const submitInvite = inviteForm.handleSubmit((values) => {
    if (invitationMutation.isPending) return;
    invitationMutation.mutate({
      action: "invite",
      requestId: crypto.randomUUID(),
      recipientEmail: values.recipientEmail,
      scopes: values.scopes,
      consentConfirmed: true,
      contractVersion: CAREGIVER_CONTRACT_VERSION,
    });
  });

  const submitReminder = reminderForm.handleSubmit((values) => {
    if (reminderMutation.isPending) return;
    reminderMutation.mutate({
      requestId: crypto.randomUUID(),
      reminderType: values.reminderType,
      localTime: values.localTime,
      timezone: "Asia/Jakarta",
      channel: "in_app",
      quietHours: {
        enabled: values.quietHoursEnabled,
        start: values.quietHoursStart,
        end: values.quietHoursEnd,
      },
      enabled: values.enabled,
      confirmation: true,
      contractVersion: CAREGIVER_CONTRACT_VERSION,
    });
  });

  function toggleScope(scope: CaregiverScope, checked: boolean) {
    const nextScopes = checked
      ? Array.from(new Set([...selectedScopes, scope]))
      : selectedScopes.filter((item) => item !== scope);
    inviteForm.setValue("scopes", nextScopes, { shouldValidate: true, shouldDirty: true });
  }

  function revokeInvitation() {
    if (!invitation || invitationMutation.isPending) return;
    invitationMutation.mutate({
      action: "revoke",
      requestId: crypto.randomUUID(),
      invitationId: invitation.id,
      confirmation: true,
      contractVersion: CAREGIVER_CONTRACT_VERSION,
    });
  }

  return (
    <main>
      <Link href="/app/action-plan" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate">
        <ArrowLeft className="size-4" />Kembali ke rencana tindakan
      </Link>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F11 · P2 Prototype</span>
          <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Berbagi default mati</span>
          {isDevelopment ? <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">Data demo (simulasi)</span> : null}
        </div>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Kontrol caregiver & pengingat</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Anda tetap memegang kendali atas data. Prototipe ini tidak memberikan akses caregiver, mengirim undangan, atau menjadwalkan notifikasi sungguhan.</p>
      </div>

      <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6" aria-labelledby="sharing-status-heading">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 size-6 shrink-0 text-neuro-slate" />
          <div>
            <h2 id="sharing-status-heading" className="font-semibold text-neuro-slate">Tidak ada akses caregiver aktif</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Mengetahui email atau ID pengguna tidak pernah cukup untuk membuka data. Akses kelak harus melalui undangan, verifikasi identitas penerima, persetujuan scope oleh pemilik, RLS, dan audit trail.</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="invite-heading">
          <UsersRound className="size-7 text-neuro-slate" />
          <h2 id="invite-heading" className="mt-4 text-xl font-semibold text-neuro-slate">Draft undangan caregiver</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Alamat email hanya tujuan undangan. Undangan pending tidak memberikan akses dan tidak boleh dipakai sebagai bukti identitas.</p>

          {invitation ? (
            <InvitationStatus
              invitation={invitation}
              confirmingRevoke={confirmingRevoke}
              pending={invitationMutation.isPending}
              onAskRevoke={() => setConfirmingRevoke(true)}
              onCancelRevoke={() => setConfirmingRevoke(false)}
              onRevoke={revokeInvitation}
              onCreateAnother={() => { setInvitation(null); invitationMutation.reset(); }}
            />
          ) : (
            <form onSubmit={submitInvite} className="mt-6" noValidate>
              <label htmlFor="caregiver-email" className="text-sm font-semibold text-neuro-slate">Email tujuan undangan</label>
              <input id="caregiver-email" type="email" autoComplete="off" {...inviteForm.register("recipientEmail")} className="field-control mt-2" placeholder="caregiver@example.com" />
              {inviteForm.formState.errors.recipientEmail ? <ErrorText message={inviteForm.formState.errors.recipientEmail.message} /> : null}

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-neuro-slate">Ringkasan yang kelak boleh diminta</legend>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Tidak termasuk hasil pemeriksaan, jawaban check-in, catatan, atau diagnosis.</p>
                <div className="mt-3 space-y-3">
                  {(Object.keys(scopeCopy) as CaregiverScope[]).map((scope) => (
                    <label key={scope} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30">
                      <input type="checkbox" checked={selectedScopes.includes(scope)} onChange={(event) => toggleScope(scope, event.target.checked)} className="mt-1 size-5 accent-[#243746]" />
                      <span><span className="block text-sm font-semibold text-neuro-slate">{scopeCopy[scope].label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{scopeCopy[scope].description}</span></span>
                    </label>
                  ))}
                </div>
                {inviteForm.formState.errors.scopes ? <ErrorText message={inviteForm.formState.errors.scopes.message} /> : null}
              </fieldset>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-neuro-cream p-4 focus-within:ring-3 focus-within:ring-ring/30">
                <input type="checkbox" {...inviteForm.register("confirmation")} className="mt-1 size-5 accent-[#243746]" />
                <span><span className="block text-sm font-semibold text-neuro-slate">Saya memahami undangan belum memberikan akses.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Akses tetap nol sampai model consent dan verifikasi disetujui.</span></span>
              </label>
              {inviteForm.formState.errors.confirmation ? <ErrorText message={inviteForm.formState.errors.confirmation.message} /> : null}

              <button type="submit" disabled={invitationMutation.isPending} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">{invitationMutation.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Mail className="size-4" />}{invitationMutation.isPending ? "Memproses…" : isDevelopment ? "Buat undangan simulasi" : "Kirim undangan"}</button>
            </form>
          )}

          {invitationMutation.data?.data.status === "unavailable" ? <p className="mt-5 rounded-2xl bg-[#fff9ec] p-4 text-sm leading-6 text-[#79520f]" role="status">{invitationMutation.data.data.message}</p> : null}
          {invitationMutation.isError ? <p className="mt-5 rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#8b2028]" role="alert">Undangan tidak dapat diproses. Tidak ada akses yang dibuat.</p> : null}
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-7" aria-labelledby="reminder-heading">
          <BellRing className="size-7 text-neuro-slate" />
          <h2 id="reminder-heading" className="mt-4 text-xl font-semibold text-neuro-slate">Preferensi pengingat</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Channel sementara hanya dalam aplikasi. Push dan email dikunci sampai provider, consent, kegagalan pengiriman, dan dukungan perangkat diputuskan.</p>

          <form onSubmit={submitReminder} className="mt-6" noValidate>
            <label htmlFor="reminder-type" className="text-sm font-semibold text-neuro-slate">Jenis pengingat</label>
            <select id="reminder-type" {...reminderForm.register("reminderType")} className="field-control mt-2">
              <option value="checkin">Waktunya meninjau check-in</option>
              <option value="follow_up">Tinjau rencana tindak lanjut</option>
              <option value="action_review">Periksa rencana tindakan</option>
            </select>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="reminder-time" className="text-sm font-semibold text-neuro-slate">Waktu lokal</label><input id="reminder-time" type="time" {...reminderForm.register("localTime")} className="field-control mt-2" /><ErrorText message={reminderForm.formState.errors.localTime?.message} /></div>
              <div><span className="text-sm font-semibold text-neuro-slate">Channel</span><div className="mt-2 flex min-h-12 items-center rounded-xl border border-black/10 bg-muted px-3 text-sm text-neuro-slate"><BellRing className="mr-2 size-4" />Dalam aplikasi</div></div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30">
              <input type="checkbox" {...reminderForm.register("quietHoursEnabled")} className="mt-1 size-5 accent-[#243746]" />
              <span><span className="block text-sm font-semibold text-neuro-slate">Aktifkan jam tenang</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Tidak mengirim pengingat selama rentang waktu ini.</span></span>
            </label>

            {quietHoursEnabled ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="quiet-start" className="text-sm font-semibold text-neuro-slate">Mulai jam tenang</label><input id="quiet-start" type="time" {...reminderForm.register("quietHoursStart")} className="field-control mt-2" /><ErrorText message={reminderForm.formState.errors.quietHoursStart?.message} /></div>
                <div><label htmlFor="quiet-end" className="text-sm font-semibold text-neuro-slate">Selesai jam tenang</label><input id="quiet-end" type="time" {...reminderForm.register("quietHoursEnd")} className="field-control mt-2" /><ErrorText message={reminderForm.formState.errors.quietHoursEnd?.message} /></div>
              </div>
            ) : null}

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30">
              <input type="checkbox" {...reminderForm.register("enabled")} className="mt-1 size-5 accent-[#243746]" />
              <span><span className="block text-sm font-semibold text-neuro-slate">Pengingat {remindersEnabled ? "diaktifkan" : "dinonaktifkan"}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Anda dapat memilih opt-out kapan saja.</span></span>
            </label>

            <div className="mt-5 rounded-2xl bg-neuro-blue p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neuro-slate/60">Pratinjau generik</p>
              <p className="mt-2 text-sm font-semibold text-neuro-slate">Anda memiliki pengingat NeuroCare.</p>
              <p className="mt-1 text-xs leading-5 text-neuro-slate/70">Tidak memuat diagnosis, hasil kesehatan, atau isi tindakan.</p>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-neuro-cream p-4 focus-within:ring-3 focus-within:ring-ring/30">
              <input type="checkbox" {...reminderForm.register("confirmation")} className="mt-1 size-5 accent-[#243746]" />
              <span><span className="block text-sm font-semibold text-neuro-slate">Saya memahami ini hanya preferensi simulasi.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Belum ada provider atau jadwal pengiriman aktif.</span></span>
            </label>
            {reminderForm.formState.errors.confirmation ? <ErrorText message={reminderForm.formState.errors.confirmation.message} /> : null}

            <button type="submit" disabled={reminderMutation.isPending} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">{reminderMutation.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Clock3 className="size-4" />}{reminderMutation.isPending ? "Memproses…" : isDevelopment ? "Simpan simulasi" : "Simpan preferensi"}</button>
          </form>

          {reminderMutation.data ? <div className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${reminderMutation.data.data.status === "simulated" ? "bg-neuro-green text-neuro-slate" : "bg-[#fff9ec] text-[#79520f]"}`} role="status" aria-live="polite"><p className="font-semibold">{reminderMutation.data.data.status === "simulated" ? "Simulasi diperbarui" : "Pengingat belum tersedia"}</p><p className="mt-1">{reminderMutation.data.data.message}</p></div> : null}
          {reminderMutation.isError ? <p className="mt-5 rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#8b2028]" role="alert">Preferensi tidak dapat diproses. Tidak ada pengingat yang dijadwalkan.</p> : null}
        </section>
      </div>

      <section className="mt-5 rounded-[2rem] border border-black/5 bg-neuro-cream p-5 sm:p-6">
        <div className="flex gap-3"><Info className="mt-0.5 size-6 shrink-0 text-neuro-slate" /><div><h2 className="font-semibold text-neuro-slate">Belum ada tampilan data untuk caregiver</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Dashboard read-only baru boleh dibuat setelah server dapat memverifikasi penerima, scope aktif, consent yang belum dicabut, dan izin per record. Prototipe ini sengaja tidak memuat data screening, recovery, timeline, atau tindakan pengguna.</p></div></div>
      </section>
    </main>
  );
}

function InvitationStatus({ invitation, confirmingRevoke, pending, onAskRevoke, onCancelRevoke, onRevoke, onCreateAnother }: { invitation: InvitationSummary; confirmingRevoke: boolean; pending: boolean; onAskRevoke: () => void; onCancelRevoke: () => void; onRevoke: () => void; onCreateAnother: () => void }) {
  const revoked = invitation.state === "revoked";
  return (
    <div className={`mt-6 rounded-3xl p-5 ${revoked ? "bg-muted" : "bg-neuro-green"}`} aria-live="polite">
      {revoked ? <UserRoundX className="size-7 text-neuro-slate" /> : <ShieldCheck className="size-7 text-neuro-slate" />}
      <h3 className="mt-4 font-semibold text-neuro-slate">{revoked ? "Undangan simulasi dicabut" : "Undangan simulasi menunggu verifikasi"}</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Penerima tersamarkan</dt><dd className="mt-1 font-medium text-neuro-slate">{invitation.recipientHint}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Akses data saat ini</dt><dd className="mt-1 font-medium text-neuro-slate">Tidak ada</dd></div>
        {!revoked ? <div><dt className="text-xs text-muted-foreground">Scope yang diminta</dt><dd className="mt-2 space-y-1 text-neuro-slate">{invitation.scopes.map((scope) => <span key={scope} className="block">• {scopeCopy[scope].label}</span>)}</dd></div> : null}
      </dl>
      {!revoked && !confirmingRevoke ? <button type="button" onClick={onAskRevoke} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-[#8b2028]/25 bg-white px-5 text-sm font-semibold text-[#8b2028]"><UserRoundX className="size-4" />Cabut undangan</button> : null}
      {!revoked && confirmingRevoke ? <div className="mt-5 rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-neuro-slate">Cabut undangan simulasi ini?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tindakan ini mempertahankan kondisi tanpa akses.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onCancelRevoke} className="focus-ring min-h-11 rounded-full border border-black/10 px-4 text-sm font-semibold text-neuro-slate">Batal</button><button type="button" onClick={onRevoke} disabled={pending} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-[#8b2028] px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <UserRoundX className="size-4" />}Konfirmasi cabut</button></div></div> : null}
      {revoked ? <button type="button" onClick={onCreateAnother} className="focus-ring mt-5 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-neuro-slate">Kembali ke formulir</button> : null}
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-[#8b2028]" role="alert">{message}</p> : null;
}

async function submitCaregiverInvitation(input: CaregiverInvitationRequest) {
  const response = await fetch("/api/caregiver/invitations", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Caregiver-Demo": CAREGIVER_DEMO_HEADER } : {}),
    },
    body: JSON.stringify(input),
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("caregiver_invitation_request_failed");
  return caregiverInvitationResponseSchema.parse(payload);
}

async function submitReminderPreference(input: ReminderPreferenceCreate) {
  const response = await fetch("/api/caregiver/reminder-preferences", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NODE_ENV !== "production" ? { "X-NeuroCare-Caregiver-Demo": CAREGIVER_DEMO_HEADER } : {}),
    },
    body: JSON.stringify(input),
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("reminder_preference_request_failed");
  return reminderPreferenceResponseSchema.parse(payload);
}
