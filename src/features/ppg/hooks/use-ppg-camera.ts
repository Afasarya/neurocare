"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stopMediaStream } from "@/features/ppg/browser/media-stream";

export type CameraState =
  | "idle"
  | "requesting"
  | "ready"
  | "unsupported"
  | "permission_denied"
  | "canceled"
  | "error";

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraintSet = MediaTrackConstraintSet & { torch?: boolean };

export function usePpgCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const releaseCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchAvailable(false);
    setTorchEnabled(false);
  }, []);

  const tryEnableTorch = useCallback(async (stream?: MediaStream | null) => {
    const track = (stream ?? streamRef.current)?.getVideoTracks()[0];
    if (!track) return false;
    const capabilities = track.getCapabilities?.() as TorchCapabilities | undefined;
    if (capabilities && capabilities.torch === false) return false;
    try {
      const advanced: TorchConstraintSet[] = [{ torch: true }];
      await track.applyConstraints({ advanced } as MediaTrackConstraints);
      setTorchAvailable(true);
      setTorchEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setMessage(null);
    if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setMessage("Kamera web memerlukan perangkat yang mendukung dan koneksi HTTPS atau localhost.");
      return;
    }

    releaseCamera();
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      });
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      const capabilities = track?.getCapabilities?.() as TorchCapabilities | undefined;
      setTorchAvailable(capabilities?.torch === true);

      if (!videoRef.current) {
        releaseCamera();
        setState("error");
        setMessage("Pratinjau kamera tidak tersedia. Silakan coba lagi.");
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setState("ready");
      // Capabilities pada Android sering baru lengkap setelah stream berjalan; coba nyalakan lampu langsung.
      void tryEnableTorch(stream);
    } catch (error) {
      releaseCamera();
      if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
        setState("permission_denied");
        setMessage("Izin kamera ditolak. Anda dapat mengubah izin browser lalu mencoba lagi.");
      } else if (error instanceof DOMException && (error.name === "NotFoundError" || error.name === "OverconstrainedError")) {
        setState("unsupported");
        setMessage("Kamera yang sesuai tidak ditemukan pada perangkat ini.");
      } else {
        setState("error");
        setMessage("Kamera tidak dapat dimulai. Pastikan kamera tidak sedang digunakan aplikasi lain.");
      }
    }
  }, [releaseCamera, tryEnableTorch]);

  const setTorch = useCallback(async (enabled: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const advanced: TorchConstraintSet[] = [{ torch: enabled }];
      await track.applyConstraints({ advanced } as MediaTrackConstraints);
      setTorchAvailable(true);
      setTorchEnabled(enabled);
    } catch {
      setTorchAvailable(false);
      setTorchEnabled(false);
      setMessage("Lampu kamera tidak didukung browser ini (iOS Safari tidak mendukung). Gunakan Chrome Android atau cahaya ruangan yang terang.");
    }
  }, []);

  const captureSamples = useCallback(
    (durationMs: number, onProgress: (fraction: number) => void, signal: { aborted: boolean }) =>
      new Promise<{ elapsedMs: number; redMean: number }[]>((resolve) => {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const samples: { elapsedMs: number; redMean: number }[] = [];
        if (!video || !ctx) return resolve(samples);
        const start = performance.now();
        const tick = () => {
          if (signal.aborted) return resolve([]);
          const elapsed = performance.now() - start;
          const vw = video.videoWidth || 1;
          const vh = video.videoHeight || 1;
          // Ambil area tengah frame (tempat jari menutupi lensa).
          const side = Math.min(vw, vh) / 2;
          ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, 32, 32);
          const px = ctx.getImageData(0, 0, 32, 32).data;
          let sum = 0;
          for (let i = 0; i < px.length; i += 4) sum += px[i];
          samples.push({ elapsedMs: elapsed, redMean: sum / (px.length / 4) });
          onProgress(Math.min(1, elapsed / durationMs));
          if (elapsed >= durationMs) return resolve(samples);
          setTimeout(tick, 33);
        };
        tick();
      }),
    [],
  );

  const cancel = useCallback(() => {
    releaseCamera();
    setState("canceled");
    setMessage("Pengukuran dibatalkan. Tidak ada rekaman atau sampel yang disimpan.");
  }, [releaseCamera]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && streamRef.current) {
        releaseCamera();
        setState("canceled");
        setMessage("Kamera dihentikan karena halaman tidak lagi terlihat. Tidak ada data yang disimpan.");
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseCamera();
    };
  }, [releaseCamera]);

  return {
    videoRef,
    state,
    message,
    torchAvailable,
    torchEnabled,
    startCamera,
    setTorch,
    tryEnableTorch,
    captureSamples,
    cancel,
    releaseCamera,
  };
}

