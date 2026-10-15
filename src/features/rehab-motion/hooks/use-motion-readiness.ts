"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stopMotionStream } from "@/features/rehab-motion/browser/media-stream";
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

  const release = useCallback(() => {
    operationIdRef.current += 1;
    stopMotionStream(streamRef.current);
    streamRef.current = null;
    runtimeRef.current?.close();
    runtimeRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const prepare = useCallback(async () => {
    release();
    const operationId = operationIdRef.current;
    setState("loading_model");
    setMessage("Memuat model pose di perangkat…");

    if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setMessage("Kamera web memerlukan perangkat yang mendukung dan HTTPS atau localhost.");
      return;
    }

    const wasmRoot = process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_PATH ?? "";
    const modelAssetPath = process.env.NEXT_PUBLIC_POSE_LANDMARKER_MODEL_PATH ?? "";
    if (!wasmRoot || !modelAssetPath) {
      setState("error");
      setMessage("Asset model yang telah ditinjau belum dikonfigurasi. Kamera tidak dibuka.");
      return;
    }

    let pendingRuntime: PoseLandmarkerRuntime | null = null;
    let pendingStream: MediaStream | null = null;
    try {
      pendingRuntime = await loadPoseLandmarker({ wasmRoot, modelAssetPath });
      if (operationId !== operationIdRef.current) {
        pendingRuntime.close();
        return;
      }
      runtimeRef.current = pendingRuntime;
      pendingRuntime = null;

      pendingStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
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
      setState("ready");
      setMessage("Model dan kamera siap. Pelacakan tetap dikunci sampai kontrak latihan disetujui.");
    } catch (error) {
      pendingRuntime?.close();
      stopMotionStream(pendingStream);
      if (operationId !== operationIdRef.current) return;
      release();
      if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
        setState("camera_denied");
        setMessage("Izin kamera ditolak. Ubah izin browser lalu coba lagi.");
      } else if (error instanceof DOMException && (error.name === "NotFoundError" || error.name === "OverconstrainedError")) {
        setState("unsupported");
        setMessage("Kamera yang sesuai tidak ditemukan pada perangkat ini.");
      } else {
        setState("error");
        setMessage("Model atau kamera tidak dapat dimuat. Tidak ada pelacakan yang dimulai.");
      }
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

  return { videoRef, state, message, prepare, stop, emergencyStop };
}
