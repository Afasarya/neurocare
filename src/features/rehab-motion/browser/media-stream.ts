export type StoppableMotionStream = Pick<MediaStream, "getTracks">;

export type MotionCameraErrorKind = "denied" | "unavailable" | "unknown";

export function getMotionCameraConstraints(): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: { ideal: "user" },
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  };
}

export function classifyMotionCameraError(error: unknown): MotionCameraErrorKind {
  const name = error instanceof DOMException
    ? error.name
    : typeof error === "object" && error && "name" in error
      ? String(error.name)
      : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") return "unavailable";
  return "unknown";
}

export function stopMotionStream(stream: StoppableMotionStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
