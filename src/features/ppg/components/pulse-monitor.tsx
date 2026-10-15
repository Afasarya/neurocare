"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  Flashlight,
  HeartPulse,
  Info,
  LoaderCircle,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { usePpgCamera, type CameraState } from "@/features/ppg/hooks/use-ppg-camera";

type DemoState = "capturing" | "analyzing" | "poor_signal" | "success" | "error" | null;

const stateLabels: Record<CameraState | Exclude<DemoState, null>, string> = {
  idle: "Belum dimulai",
  requesting: "Meminta akses kamera",
  ready: "Kamera siap",
  unsupported: "Kamera tidak didukung",
  permission_denied: "Izin kamera ditolak",
  canceled: "Dibatalkan",
  capturing: "Merekam sinyal",
  analyzing: "Menganalisis",
  poor_signal: "Sinyal kurang baik",
  success: "Hasil tersedia",
  error: "Terjadi kendala",
};

export function PulseMonitor() {
  const {
    videoRef,
    state: cameraState,
    message: cameraMessage,
    torchAvailable,
    torchEnabled,
    startCamera,
    setTorch,
    cancel: cancelCamera,
    releaseCamera,
  } = usePpgCamera();
  const [consent, setConsent] = useState(false);
  const [demoState, setDemoState] = useState<DemoState>(null);
  const displayState = demoState ?? cameraState;
  const cameraActive = cameraState === "ready" || cameraState === "requesting";

  async function activateCamera() {
    setDemoState(null);
    await startCamera();
  }

  function cancel() {
    setDemoState(null);
    cancelCamera();
  }

  function selectDemoState(next: DemoState) {
    releaseCamera();
    setDemoState(next);
  }

  return (
    <main>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F03 · NeuroPrevent</span>
            {process.env.NODE_ENV !== "production" ? <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Data demo (simulasi)</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Monitor detak dengan kamera</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Prototipe ini menyiapkan kamera belakang untuk estimasi detak jantung. Hasil bukan diagnosis atau pengganti pemeriksaan tenaga kesehatan.</p>
        </div>
        <Link href="/app/screening" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-neuro-slate/10 bg-white px-4 text-sm font-medium text-neuro-slate"><CameraOff className="size-4" />Keluar tanpa kamera</Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white">
          <div className="border-b border-black/5 p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status pengukuran</p>
                <h2 className="mt-1 text-xl font-semibold text-neuro-slate" aria-live="polite">{stateLabels[displayState]}</h2>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${cameraActive ? "bg-[#fff0e3] text-[#9a4d16]" : "bg-muted text-muted-foreground"}`}>
                <span className={`size-2 rounded-full ${cameraActive ? "animate-pulse bg-[#d56827]" : "bg-current opacity-40"}`} />
                {cameraActive ? "Kamera aktif" : "Kamera nonaktif"}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-neuro-slate">
              <video ref={videoRef} muted playsInline className={`size-full object-cover ${cameraState === "ready" ? "block" : "hidden"}`} aria-label="Pratinjau kamera belakang" />
              {cameraState !== "ready" ? (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                  <div><Camera className="mx-auto size-10 opacity-80" /><p className="mt-4 text-sm font-semibold">Pratinjau kamera akan tampil di sini</p><p className="mt-2 max-w-sm text-xs leading-5 text-white/60">Kamera tidak menyala sebelum Anda memberi persetujuan dan menekan tombol aktivasi.</p></div>
                </div>
              ) : null}
              {demoState === "capturing" ? <ProgressOverlay label="Simulasi merekam sinyal" progress={62} /> : null}
              {demoState === "analyzing" ? <ProgressOverlay label="Simulasi menganalisis" progress={100} loading /> : null}
            </div>

            {demoState === "poor_signal" ? <StateNotice icon={AlertTriangle} tone="warning" title="Sinyal belum layak" text="Gerakan, pencahayaan, atau posisi jari membuat kualitas sinyal tidak memadai. Tidak ada nilai BPM yang ditampilkan." /> : null}
            {demoState === "success" ? <StateNotice icon={CheckCircle2} tone="neutral" title="Tampilan hasil siap, tetapi tanpa angka simulasi" text="Nilai BPM hanya boleh muncul dari hasil pengukuran aktual dengan kualitas acceptable. Kontrak analisis belum disetujui, jadi demo ini tidak membuat angka." /> : null}
            {demoState === "error" ? <StateNotice icon={AlertTriangle} tone="danger" title="Pengukuran tidak dapat dilanjutkan" text="Kamera telah dihentikan dan data sementara dibersihkan. Silakan coba lagi atau gunakan jalur tanpa kamera." /> : null}
            {!demoState && cameraMessage ? <StateNotice icon={AlertTriangle} tone={cameraState === "canceled" ? "neutral" : "warning"} title={stateLabels[cameraState]} text={cameraMessage} /> : null}

            <div className="mt-6 rounded-3xl border border-black/5 bg-neuro-cream p-5">
              <h3 className="font-semibold text-neuro-slate">Sebelum mengaktifkan kamera</h3>
              <ol className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-3">
                <li><strong className="text-neuro-slate">1.</strong> Gunakan ponsel dengan HTTPS dan kamera belakang.</li>
                <li><strong className="text-neuro-slate">2.</strong> Duduk tenang di tempat dengan cahaya merata.</li>
                <li><strong className="text-neuro-slate">3.</strong> Ikuti petunjuk posisi jari setelah metode disetujui.</li>
              </ol>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-neuro-slate/10 p-4">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={cameraActive} className="mt-1 size-4 accent-[#243746]" />
              <span><span className="block text-sm font-semibold text-neuro-slate">Saya setuju mengaktifkan kamera untuk pengukuran ini.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Tidak ada video, frame kamera, atau sinyal mentah yang disimpan. Anda dapat membatalkan kapan saja.</span></span>
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {cameraState !== "ready" ? <button type="button" onClick={activateCamera} disabled={!consent || cameraState === "requesting"} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{cameraState === "requesting" ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}{cameraState === "requesting" ? "Membuka kamera…" : "Aktifkan kamera"}</button> : null}
              {cameraState === "ready" ? <button type="button" disabled title="Menunggu persetujuan kontrak capture dan quality gate" className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white opacity-45"><HeartPulse className="size-4" />Mulai pengukuran</button> : null}
              {(cameraActive || demoState) ? <button type="button" onClick={cancel} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c53030]/20 px-6 text-sm font-semibold text-[#a12626]"><CircleStop className="size-4" />Batalkan</button> : null}
              {(cameraState === "permission_denied" || cameraState === "unsupported" || cameraState === "error" || cameraState === "canceled" || demoState) ? <button type="button" onClick={() => { setDemoState(null); void activateCamera(); }} disabled={!consent} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-neuro-slate/10 px-6 text-sm font-semibold text-neuro-slate disabled:opacity-45"><RefreshCcw className="size-4" />Coba lagi</button> : null}
            </div>

            {cameraState === "ready" ? <div className="mt-5 rounded-2xl bg-neuro-blue p-4"><p className="text-sm font-semibold text-neuro-slate">Kamera siap—pengambilan sampel belum diaktifkan.</p><p className="mt-1 text-xs leading-5 text-neuro-slate/65">Sample rate, durasi, dan quality gate masih menunggu persetujuan AI Engineer. Tidak ada sampel yang dikirim ke API.</p>{torchAvailable ? <button type="button" onClick={() => void setTorch(!torchEnabled)} className="focus-ring mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-neuro-slate"><Flashlight className="size-4" />{torchEnabled ? "Matikan lampu" : "Nyalakan lampu"}</button> : <p className="mt-3 text-xs text-neuro-slate/65">Lampu kamera tidak tersedia; gunakan cahaya ruangan yang merata.</p>}</div> : null}

            {process.env.NODE_ENV !== "production" ? <DemoControls onSelect={selectDemoState} /> : null}
          </div>
        </section>

        <aside className="space-y-4">
          <InfoCard icon={Info} title="Batas pengukuran">Pencahayaan, gerakan, posisi jari, dan kualitas kamera memengaruhi hasil. Fitur ini tidak mengukur tekanan darah atau oksigen darah, serta tidak mendeteksi AF, aritmia, atau stroke.</InfoCard>
          <InfoCard icon={LockKeyhole} title="Privasi kamera">Pemrosesan capture dirancang berlangsung di memori browser. Kamera dihentikan saat batal, halaman tersembunyi, atau komponen ditutup.</InfoCard>
          <InfoCard icon={ShieldCheck} title="Terpisah dari skrining">Hasil F03 tidak masuk ke perhitungan risiko F01. Jika Anda merasa tidak sehat, jangan menunggu hasil prototipe ini.</InfoCard>
          <Link href="/app/screening/gaps" className="focus-ring flex min-h-12 items-center justify-between rounded-2xl bg-neuro-green px-4 text-sm font-semibold text-neuro-slate">Lihat gap pemeriksaan<ChevronRight className="size-4" /></Link>
        </aside>
      </div>
    </main>
  );
}

function ProgressOverlay({ label, progress, loading = false }: { label: string; progress: number; loading?: boolean }) {
  return <div className="absolute inset-0 grid place-items-center bg-neuro-slate/90 p-8 text-center text-white"><div className="w-full max-w-sm">{loading ? <LoaderCircle className="mx-auto size-9 animate-spin" /> : <HeartPulse className="mx-auto size-9" />}<p className="mt-4 text-sm font-semibold">{label}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-neuro-green" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-white/60">Data demo (simulasi)—tidak ada kamera atau BPM aktual</p></div></div>;
}

function StateNotice({ icon: Icon, tone, title, text }: { icon: typeof AlertTriangle; tone: "warning" | "danger" | "neutral"; title: string; text: string }) {
  const colors = tone === "danger" ? "bg-[#fff1f1] text-[#8b2028]" : tone === "warning" ? "bg-[#fff7e8] text-[#79520f]" : "bg-neuro-blue text-neuro-slate";
  return <div className={`mt-5 rounded-2xl p-4 ${colors}`} role="status"><div className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 opacity-75">{text}</p></div></div></div>;
}

function DemoControls({ onSelect }: { onSelect: (state: DemoState) => void }) {
  return <div className="mt-6 border-t border-dashed border-black/10 pt-5"><p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Data demo (simulasi) · pemeriksaan UI</p><div className="mt-3 flex flex-wrap gap-2">{(["capturing", "analyzing", "poor_signal", "success", "error"] as const).map((state) => <button type="button" key={state} onClick={() => onSelect(state)} className="focus-ring rounded-full border border-black/10 px-3 py-2 text-xs text-neuro-slate hover:bg-muted">{stateLabels[state]}</button>)}</div></div>;
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-black/5 bg-white p-5"><Icon className="size-5 text-neuro-slate" /><h2 className="mt-4 font-semibold text-neuro-slate">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p></div>;
}

