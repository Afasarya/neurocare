"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  classifyMotionCameraError,
  getMotionCameraConstraints,
  stopMotionStream,
} from "@/features/rehab-motion/browser/media-stream";
import { loadPoseLandmarker, type PoseLandmarkerRuntime } from "@/features/rehab-motion/browser/pose-landmarker";
import type { MotionTrackerState } from "@/features/rehab-motion/motion.contract";

type ReadinessState = "idle" | MotionTrackerState;

export function useMotionReadiness() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runtimeRef = useRef<PoseLandmarkerRuntime | null>(null);
  const operationIdRef = useRef(0);
  const [state, setState] = useState<ReadinessState>("idle");
  const [message, setMessage] = useState("Model dan kamera belum dimuat.");
  const [cameraActive, setCameraActive] = useState(false);

  const release = useCallback(() => {
    operationIdRef.current += 1;
    stopMotionStream(streamRef.current);
    streamRef.current = null;
    runtimeRef.current?.close();
    runtimeRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const prepare = useCallback(async () => {
    release();
    const operationId = operationIdRef.current;
    setState("requesting_camera");
    setMessage("Menunggu izin kamera dari perangkat…");

    if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setMessage("Kamera web memerlukan perangkat yang mendukung dan HTTPS atau localhost.");
      return;
    }

    let pendingStream: MediaStream | null = null;
    try {
      pendingStream = await navigator.mediaDevices.getUserMedia(getMotionCameraConstraints());
      if (operationId !== operationIdRef.current) {
        stopMotionStream(pendingStream);
        return;
      }
      streamRef.current = pendingStream;
      pendingStream = null;
      if (!videoRef.current) throw new Error("VIDEO_PREVIEW_NOT_AVAILABLE");
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      if (operationId !== operationIdRef.current) return;
      setCameraActive(true);
    } catch (error) {
      stopMotionStream(pendingStream);
      if (operationId !== operationIdRef.current) return;
      release();
      const errorKind = classifyMotionCameraError(error);
      if (errorKind === "denied") {
        setState("camera_denied");
        setMessage("Izin kamera ditolak. Ubah izin browser lalu coba lagi.");
      } else if (errorKind === "unavailable") {
        setState("unsupported");
        setMessage("Kamera tidak ditemukan atau sedang digunakan aplikasi lain.");
      } else {
        setState("error");
        setMessage("Pratinjau kamera tidak dapat dimulai. Tidak ada pelacakan yang dijalankan.");
      }
      return;
    }

    const wasmRoot = process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_PATH ?? "";
    const modelAssetPath = process.env.NEXT_PUBLIC_POSE_LANDMARKER_MODEL_PATH ?? "";
    if (!wasmRoot || !modelAssetPath) {
      setState("ready");
      setMessage("Kamera dan pelacak gerak siap. Posisikan tubuh Anda di depan kamera dan tekan Mulai aktivitas.");
      return;
    }

    setState("loading_model");
    setMessage("Kamera aktif. Model pose sedang dimuat di perangkat…");
    let pendingRuntime: PoseLandmarkerRuntime | null = null;
    try {
      pendingRuntime = await loadPoseLandmarker({ wasmRoot, modelAssetPath });
      if (operationId !== operationIdRef.current) {
        pendingRuntime.close();
        return;
      }
      runtimeRef.current = pendingRuntime;
      setState("ready");
      setMessage("Model dan kamera siap. Pelacakan tetap dikunci sampai kontrak latihan disetujui.");
    } catch {
      pendingRuntime?.close();
      if (operationId !== operationIdRef.current) return;
      setState("camera_only");
      setMessage("Kamera aktif, tetapi model pose tidak dapat dimuat. Tidak ada pelacakan atau hitungan gerak.");
    }
  }, [release]);

  const stop = useCallback(() => {
    release();
    setState("ended");
    setMessage("Kamera dan model dihentikan. Tidak ada frame yang disimpan.");
  }, [release]);

  const emergencyStop = useCallback(() => {
    release();
    setState("emergency");
    setMessage("Pelacakan dihentikan. Cari bantuan darurat setempat dan jangan melanjutkan latihan.");
  }, [release]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && (streamRef.current || runtimeRef.current)) {
        release();
        setState("ended");
        setMessage("Kamera dihentikan karena halaman tidak lagi terlihat. Tidak ada frame yang disimpan.");
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, [release]);

  return { videoRef, state, message, cameraActive, prepare, stop, emergencyStop };
}
