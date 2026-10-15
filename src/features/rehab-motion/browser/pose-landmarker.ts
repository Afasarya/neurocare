import "client-only";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type PoseLandmarkerRuntime = {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): PoseLandmarkerResult;
  close(): void;
};

export type PoseLandmarkerConfig = Readonly<{
  wasmRoot: string;
  modelAssetPath: string;
}>;

export async function loadPoseLandmarker(config: PoseLandmarkerConfig): Promise<PoseLandmarkerRuntime> {
  if (!config.wasmRoot || !config.modelAssetPath) throw new Error("POSE_ASSETS_NOT_CONFIGURED");

  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(config.wasmRoot);
  const landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: config.modelAssetPath },
    runningMode: "VIDEO",
    numPoses: 1,
    outputSegmentationMasks: false,
  });

  return {
    detectForVideo: (video, timestampMs) => landmarker.detectForVideo(video, timestampMs),
    close: () => landmarker.close(),
  };
}
