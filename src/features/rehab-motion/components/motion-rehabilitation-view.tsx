"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  CirclePause,
  CircleStop,
  Info,
  LoaderCircle,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useMotionReadiness } from "@/features/rehab-motion/hooks/use-motion-readiness";
import type { MotionTrackerState } from "@/features/rehab-motion/motion.contract";

type DisplayState = "idle" | MotionTrackerState;

const stateCopy: Record<DisplayState, { label: string; message: string; tone: string }> = {
  idle: { label: "Belum dimulai", message: "Baca pemeriksaan keselamatan dan beri persetujuan sebelum menyalakan kamera.", tone: "bg-muted text-neuro-slate" },
  requesting_camera: { label: "Menunggu izin kamera", message: "Setujui permintaan kamera dari perangkat untuk menampilkan pratinjau.", tone: "bg-neuro-blue text-neuro-slate" },
  loading_model: { label: "Memuat model", message: "Kamera aktif dan model pose sedang dimuat di perangkat.", tone: "bg-neuro-blue text-neuro-slate" },
  camera_only: { label: "Kamera aktif tanpa pelacakan", message: "Pratinjau tersedia, tetapi model pose belum siap. Tidak ada repetisi atau durasi yang dihitung.", tone: "bg-[#fff9ec] text-[#79520f]" },
  camera_denied: { label: "Izin kamera ditolak", message: "Ubah izin kamera pada browser, lalu coba lagi. Anda tetap dapat kembali tanpa kamera.", tone: "bg-[#fff9ec] text-[#79520f]" },
  unsupported: { label: "Perangkat tidak didukung", message: "Kamera atau lingkungan aman yang diperlukan tidak tersedia pada perangkat ini.", tone: "bg-[#fff9ec] text-[#79520f]" },
  ready: { label: "Perangkat siap", message: "Kamera dan model siap. Aktivitas belum dapat dimulai sampai kontrak latihan disetujui.", tone: "bg-neuro-green text-neuro-slate" },
  tracking: { label: "Aktivitas terdeteksi", message: "Pelacakan aktif. Ikuti hanya instruksi latihan yang telah disetujui untuk Anda.", tone: "bg-neuro-green text-neuro-slate" },
  low_confidence: { label: "Posisi belum terbaca", message: "Pelacakan dijeda. Sesuaikan posisi hanya sesuai panduan latihan yang telah disetujui.", tone: "bg-[#fff9ec] text-[#79520f]" },
  paused: { label: "Dijeda", message: "Pelacakan dijeda. Kamera dapat dihentikan kapan saja.", tone: "bg-neuro-blue text-neuro-slate" },
  ended: { label: "Sesi berakhir", message: "Kamera dan model dihentikan. Tidak ada frame yang disimpan.", tone: "bg-muted text-neuro-slate" },
  error: { label: "Pelacakan tidak tersedia", message: "Komponen yang telah ditinjau belum lengkap. Kamera tidak digunakan untuk pelacakan.", tone: "bg-[#fff1f1] text-[#8b2028]" },
  emergency: { label: "Hentikan latihan", message: "Cari bantuan darurat setempat dan jangan menunggu penilaian aplikasi.", tone: "bg-[#fff1f1] text-[#8b2028]" },
};

export function MotionRehabilitationView() {
  const { videoRef, state, message, cameraActive, prepare, stop, emergencyStop: stopForEmergency } = useMotionReadiness();
  const [safetyAnswer, setSafetyAnswer] = useState<"clear" | "emergency" | null>(null);
  const [consent, setConsent] = useState(false);
  const [simulatedState, setSimulatedState] = useState<DisplayState | null>(null);
  const isDevelopment = process.env.NODE_ENV !== "production";
  const displayState = simulatedState ?? state;
  const copy = stateCopy[displayState];
  const canPrepare = safetyAnswer === "clear" && consent && state !== "requesting_camera" && state !== "loading_model";

  function emergencyStop() {
    setSimulatedState(null);
    setSafetyAnswer("emergency");
    stopForEmergency();
  }

  function reset() {
    stop();
    setSafetyAnswer(null);
    setConsent(false);
    setSimulatedState(null);
  }

  if (safetyAnswer === "emergency" || state === "emergency") {
    return <EmergencyPanel onReset={reset} />;
  }

  return (
    <main>
      <Link href="/app/recovery" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate">
        <ArrowLeft className="size-4" />Kembali tanpa kamera
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F06 · NeuroRecovery</span>
            <span className="rounded-full bg-[#f7e8c6] px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Belum untuk latihan klinis</span>
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Pelacak gerak rehabilitasi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Persiapan pelacakan pose di perangkat. NeuroCare belum menawarkan latihan atau menghitung repetisi sampai exercise set dan algoritme tervalidasi disetujui.</p>
        </div>
      </div>

      {isDevelopment ? <StateSimulator value={simulatedState} onChange={setSimulatedState} /> : null}

      <section className="mt-6 rounded-[2rem] border border-[#e6b4b8] bg-[#fff4f4] p-5 text-[#8b2028] sm:p-6" aria-labelledby="motion-safety-heading">
        <div className="flex gap-3"><ShieldAlert className="mt-0.5 size-6 shrink-0" /><div><h2 id="motion-safety-heading" className="font-semibold">Periksa keselamatan sebelum menyalakan kamera</h2><p className="mt-2 text-sm leading-6">Jika ada gejala baru yang muncul mendadak—seperti wajah menurun pada satu sisi, kelemahan satu sisi tubuh, atau kesulitan bicara—hentikan dan cari bantuan darurat setempat. Jangan memulai latihan.</p></div></div>
        <fieldset className="mt-5"><legend className="text-sm font-semibold">Apakah Anda sedang mengalami gejala tersebut?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><SafetyChoice checked={false} onChange={() => emergencyStop()} label="Ya, hentikan" /><SafetyChoice checked={safetyAnswer === "clear"} onChange={() => setSafetyAnswer("clear")} label="Tidak" /></div></fieldset>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white">
          <div className="relative aspect-video min-h-52 bg-neuro-slate sm:min-h-64">
            <video ref={videoRef} muted playsInline className={`block h-full w-full object-cover transition-opacity ${cameraActive ? "opacity-100" : "opacity-0"}`} aria-label="Pratinjau kamera gerak" />
            {!cameraActive ? <div className="absolute inset-0 grid place-items-center p-6 text-center text-white"><div><CameraOff className="mx-auto size-10 opacity-70" /><p className="mt-4 font-semibold">Kamera tidak aktif</p><p className="mt-2 max-w-md text-sm leading-6 text-white/70">Tidak ada video atau frame yang direkam maupun disimpan.</p></div></div> : null}
            {cameraActive ? <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white"><span className="size-2 rounded-full bg-[#9ed46f]" />Kamera aktif · diproses di perangkat</div> : null}
          </div>

          <div className="p-5 sm:p-7">
            <div className={`rounded-2xl p-4 ${copy.tone}`} role="status" aria-live="polite">
              <div className="flex items-start gap-3">{displayState === "requesting_camera" || displayState === "loading_model" ? <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin" /> : <Info className="mt-0.5 size-5 shrink-0" />}<div><p className="text-sm font-semibold">{copy.label}{simulatedState ? " · simulasi UI" : ""}</p><p className="mt-1 text-xs leading-5 opacity-80">{simulatedState ? copy.message : message}</p></div></div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Repetisi terdeteksi" value="—" hint="Menunggu algoritme disetujui" />
              <Metric label="Durasi tervalidasi" value="—" hint="Belum ada sesi" />
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 focus-within:ring-3 focus-within:ring-ring/30">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-5 accent-[#243746]" />
              <span><span className="block text-sm font-semibold text-neuro-slate">Saya setuju menyalakan kamera untuk uji kesiapan.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Frame diproses sementara di perangkat dan tidak disimpan. Persetujuan dapat ditarik dengan menghentikan kamera.</span></span>
            </label>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <button type="button" onClick={() => { setSimulatedState(null); void prepare(); }} disabled={!canPrepare} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"><Camera className="size-4" />{cameraActive ? "Muat ulang kamera" : "Nyalakan kamera"}</button>
              <button type="button" disabled title="Menunggu exercise set dan algoritme yang disetujui" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-green px-5 text-sm font-semibold text-neuro-slate opacity-50 sm:w-auto"><Play className="size-4" />Mulai aktivitas</button>
              <button type="button" disabled className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate opacity-50 sm:w-auto"><CirclePause className="size-4" />Jeda</button>
              <button type="button" onClick={stop} disabled={!cameraActive && state !== "requesting_camera" && state !== "loading_model"} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"><CircleStop className="size-4" />Hentikan kamera</button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6">
            <LockKeyhole className="size-6 text-neuro-slate" /><h2 className="mt-4 text-lg font-semibold text-neuro-slate">Latihan dikunci secara aman</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Instruksi latihan duduk, kewaspadaan, kalibrasi, confidence threshold, dan aturan repetisi masih menunggu persetujuan. Karena itu NeuroCare tidak menampilkan gerakan generik atau angka buatan.</p>
          </section>
          <section className="rounded-[2rem] border border-black/5 bg-neuro-green p-5 sm:p-6">
            <CheckCircle2 className="size-6 text-neuro-slate" /><h2 className="mt-4 text-lg font-semibold text-neuro-slate">Penyimpanan belum aktif</h2><p className="mt-2 text-sm leading-6 text-neuro-slate/75">Tombol simpan dan tautan tindak lanjut F07/F08 baru muncul setelah sesi menghasilkan durasi dan repetisi dari algoritme yang disetujui, lalu server mengonfirmasi penyimpanan.</p>
          </section>
          <button type="button" onClick={emergencyStop} className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#e6b4b8] bg-[#fff4f4] px-5 text-sm font-semibold text-[#8b2028]"><AlertTriangle className="size-4" />Hentikan karena gejala mendadak</button>
          <Link href="/app/recovery" className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-neuro-slate"><ArrowLeft className="size-4" />Lanjut tanpa kamera</Link>
        </aside>
      </div>
    </main>
  );
}

function SafetyChoice({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-white/75 px-4 text-sm font-semibold"><input type="radio" name="motion-safety" checked={checked} onChange={onChange} className="size-5 accent-[#8b2028]" />{label}</label>;
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="rounded-2xl bg-neuro-cream p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neuro-slate">{value}</p><p className="mt-1 text-[0.7rem] text-muted-foreground">{hint}</p></div>;
}

function StateSimulator({ value, onChange }: { value: DisplayState | null; onChange: (value: DisplayState | null) => void }) {
  const states: DisplayState[] = ["requesting_camera", "loading_model", "camera_only", "camera_denied", "unsupported", "ready", "tracking", "low_confidence", "paused", "ended", "error"];
  return <section className="mt-6 rounded-3xl border border-dashed border-[#caa24e] bg-[#fff9ec] p-4"><p className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#79520f]">Developer · simulasi state UI saja</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onChange(null)} className={`focus-ring rounded-full px-3 py-2 text-xs ${value === null ? "bg-neuro-slate text-white" : "bg-white text-neuro-slate"}`}>Live</button>{states.map((state) => <button key={state} type="button" onClick={() => onChange(state)} className={`focus-ring rounded-full px-3 py-2 text-xs ${value === state ? "bg-neuro-slate text-white" : "bg-white text-neuro-slate"}`}>{state}</button>)}</div></section>;
}

function EmergencyPanel({ onReset }: { onReset: () => void }) {
  return <main><Link href="/app/recovery" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground"><ArrowLeft className="size-4" />Kembali tanpa kamera</Link><section className="mt-6 rounded-[2rem] border border-[#e6b4b8] bg-[#fff4f4] p-6 text-[#8b2028] sm:p-8" role="alert"><ShieldAlert className="size-9" /><h1 className="mt-4 text-2xl font-semibold">Hentikan latihan dan cari bantuan darurat</h1><p className="mt-3 max-w-2xl text-sm leading-6">Hubungi layanan darurat setempat atau pergi ke fasilitas kesehatan terdekat. Jangan melanjutkan latihan dan jangan menunggu penilaian aplikasi.</p><p className="mt-3 text-xs leading-5 opacity-75">Kamera dan model telah dihentikan. NeuroCare tidak menilai tingkat kegawatan.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/app/recovery" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold"><ArrowLeft className="size-4" />Keluar tanpa kamera</Link><button type="button" onClick={onReset} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e6b4b8] px-5 text-sm font-semibold"><RotateCcw className="size-4" />Tinjau kembali</button></div></section></main>;
}
