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
        video: { facingMode: { ideal: "environment" } },
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
  }, [releaseCamera]);

  const setTorch = useCallback(async (enabled: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchAvailable) return;
    try {
      const advanced: TorchConstraintSet[] = [{ torch: enabled }];
      await track.applyConstraints({ advanced } as MediaTrackConstraints);
      setTorchEnabled(enabled);
    } catch {
      setTorchAvailable(false);
      setTorchEnabled(false);
      setMessage("Lampu kamera tidak dapat digunakan. Gunakan pencahayaan ruangan yang merata.");
    }
  }, [torchAvailable]);

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
    cancel,
    releaseCamera,
  };
}

