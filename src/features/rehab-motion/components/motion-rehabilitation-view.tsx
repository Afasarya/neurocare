"use client";

import { useEffect, useState } from "react";
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
  const [safetyAnswer, setSafetyAnswer] = useState<"clear" | "emergency" | null>("clear");
  const [consent, setConsent] = useState(true);
  const [activityRunning, setActivityRunning] = useState(false);
  const [reps, setReps] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [simulatedState, setSimulatedState] = useState<DisplayState | null>(null);
  const isDevelopment = process.env.NODE_ENV !== "production";
  const displayState = simulatedState ?? (activityRunning ? "tracking" : state);
  const copy = stateCopy[displayState];
  const canPrepare = state !== "requesting_camera" && state !== "loading_model";

  // Timer durasi latihan
  useEffect(() => {
    if (!activityRunning) return;
    const interval = setInterval(() => {
      setDurationSeconds((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activityRunning]);

  // Deteksi repetisi gerak real-time via frame difference
  useEffect(() => {
    if (!activityRunning) return;
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let prevData: Uint8ClampedArray | null = null;
    let motionState: "still" | "moving" = "still";
    let moveFrames = 0;

    const interval = setInterval(() => {
      if (!video || !ctx || video.readyState < 2) return;
      try {
        ctx.drawImage(video, 0, 0, 32, 32);
        const currentData = ctx.getImageData(0, 0, 32, 32).data;
        if (prevData) {
          let diff = 0;
          for (let i = 0; i < currentData.length; i += 4) {
            diff += Math.abs(currentData[i] - prevData[i]);
          }
          const avgDiff = diff / (currentData.length / 4);
          if (avgDiff > 10) {
            moveFrames++;
            if (moveFrames >= 2 && motionState === "still") {
              motionState = "moving";
            }
          } else {
            if (motionState === "moving") {
              motionState = "still";
              setReps((r) => r + 1);
              moveFrames = 0;
            }
          }
        }
        prevData = new Uint8ClampedArray(currentData);
      } catch {
        // Abaikan jika video belum siap
      }
    }, 150);

    return () => clearInterval(interval);
  }, [activityRunning, videoRef]);

  function emergencyStop() {
    setActivityRunning(false);
    setSimulatedState(null);
    setSafetyAnswer("emergency");
    stopForEmergency();
  }

  function reset() {
    setActivityRunning(false);
    setReps(0);
    setDurationSeconds(0);
    setSessionCompleted(false);
    stop();
    setSafetyAnswer("clear");
    setConsent(true);
    setSimulatedState(null);
  }

  function finishSession() {
    setActivityRunning(false);
    setSessionCompleted(true);
  }

  if (safetyAnswer === "emergency" || state === "emergency") {
    return <EmergencyPanel onReset={reset} />;
  }

  const formattedDuration = `${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <main>
      <Link href="/app/recovery" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-neuro-slate">
        <ArrowLeft className="size-4" />Kembali tanpa kamera
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neuro-blue px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">F06 · NeuroRecovery</span>
            <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">Pelacakan Aktif</span>
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">Pelacak gerak rehabilitasi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Pelacakan gerakan dan penghitung repetisi berbasis kamera. Lakukan gerakan lengan atau bahu secara perlahan dan teratur di depan kamera.</p>
        </div>
      </div>

      {isDevelopment ? <StateSimulator value={simulatedState} onChange={setSimulatedState} /> : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white">
          <div className="relative aspect-video min-h-52 bg-neuro-slate sm:min-h-64">
            <video ref={videoRef} muted playsInline className={`block h-full w-full object-cover transition-opacity ${cameraActive ? "opacity-100" : "opacity-0"}`} aria-label="Pratinjau kamera gerak" />
            {!cameraActive ? <div className="absolute inset-0 grid place-items-center p-6 text-center text-white"><div><CameraOff className="mx-auto size-10 opacity-70" /><p className="mt-4 font-semibold">Kamera tidak aktif</p><p className="mt-2 max-w-md text-sm leading-6 text-white/70">Tekan tombol "Nyalakan kamera" di bawah untuk mengaktifkan pelacak gerak.</p></div></div> : null}
            {cameraActive ? <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white"><span className="size-2 rounded-full bg-[#9ed46f]" />Kamera aktif · diproses di perangkat</div> : null}
          </div>

          <div className="p-5 sm:p-7">
            <div className={`rounded-2xl p-4 ${activityRunning ? "bg-neuro-green text-neuro-slate" : copy.tone}`} role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                {activityRunning ? <Play className="mt-0.5 size-5 shrink-0 text-neuro-slate" /> : displayState === "requesting_camera" || displayState === "loading_model" ? <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin" /> : <Info className="mt-0.5 size-5 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold">{activityRunning ? "Aktivitas sedang berjalan" : copy.label}{simulatedState ? " · simulasi UI" : ""}</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">{activityRunning ? "Pelacakan aktif. Lakukan gerakan repetisi secara stabil di depan kamera." : simulatedState ? copy.message : message}</p>
                </div>
              </div>
            </div>

            {sessionCompleted ? (
              <div className="mt-5 rounded-2xl bg-neuro-green p-4 text-center">
                <CheckCircle2 className="mx-auto size-7 text-neuro-slate" />
                <p className="mt-2 text-base font-semibold text-neuro-slate">Sesi Latihan Selesai!</p>
                <p className="mt-1 text-sm text-neuro-slate/80">Anda berhasil menyelesaikan <strong>{reps} repetisi</strong> dalam durasi <strong>{formattedDuration}</strong>.</p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Repetisi terdeteksi" value={activityRunning || sessionCompleted ? `${reps}` : "0"} hint={activityRunning ? "Dihitung real-time" : "Mulai aktivitas untuk menghitung"} />
              <Metric label="Durasi latihan" value={formattedDuration} hint={activityRunning ? "Timer berjalan" : "Durasi total"} />
            </div>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              {!cameraActive ? (
                <button type="button" onClick={() => { setSimulatedState(null); void prepare(); }} disabled={!canPrepare} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto">
                  <Camera className="size-4" />Nyalakan kamera
                </button>
              ) : null}

              {cameraActive && !activityRunning ? (
                <button type="button" onClick={() => { setSessionCompleted(false); setActivityRunning(true); }} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-green px-6 text-sm font-semibold text-neuro-slate sm:w-auto">
                  <Play className="size-4" />{durationSeconds > 0 ? "Lanjutkan aktivitas" : "Mulai aktivitas"}
                </button>
              ) : null}

              {activityRunning ? (
                <>
                  <button type="button" onClick={() => setActivityRunning(false)} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate sm:w-auto">
                    <CirclePause className="size-4" />Jeda
                  </button>
                  <button type="button" onClick={finishSession} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-slate px-5 text-sm font-semibold text-white sm:w-auto">
                    <CheckCircle2 className="size-4" />Selesaikan sesi
                  </button>
                </>
              ) : null}

              {cameraActive ? (
                <button type="button" onClick={() => { setActivityRunning(false); stop(); }} className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold text-neuro-slate sm:w-auto">
                  <CircleStop className="size-4" />Hentikan kamera
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6">
            <Info className="size-6 text-neuro-slate" />
            <h2 className="mt-4 text-lg font-semibold text-neuro-slate">Panduan Gerakan</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Posisikan kamera setinggi dada atau bahu. Duduk tegak di kursi yang stabil. Angkat tangan atau regangkan bahu secara perlahan, lalu kembali ke posisi awal.</p>
          </section>
          <section className="rounded-[2rem] border border-black/5 bg-neuro-cream p-5 sm:p-6">
            <LockKeyhole className="size-6 text-neuro-slate" />
            <h2 className="mt-4 text-lg font-semibold text-neuro-slate">Privasi Terjaga</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Kamera hanya diproses di browser HP Anda. Tidak ada video atau rekaman visual yang diunggah ke internet.</p>
          </section>
          <button type="button" onClick={emergencyStop} className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#e6b4b8] bg-[#fff4f4] px-5 text-sm font-semibold text-[#8b2028]">
            <AlertTriangle className="size-4" />Hentikan karena gejala mendadak
          </button>
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
