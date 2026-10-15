export type NormalizedLandmark = Readonly<{
  x: number;
  y: number;
  z: number;
  visibility?: number;
}>;

export type MotionFrame = Readonly<{
  capturedAtMs: number;
  landmarks: readonly NormalizedLandmark[];
}>;

export type MotionAnalysis = Readonly<{
  detectedReps: number;
  confidence: "acceptable" | "low" | "unavailable";
  feedback: string;
}>;

/**
 * Boundary owned by the AI/clinical implementation. F06 intentionally ships
 * without a rep-counting implementation until its exercise, calibration,
 * confidence and test-fixture contract has been reviewed.
 */
export interface ApprovedMotionAdapter {
  readonly activityId: string;
  readonly activityVersion: string;
  readonly algorithmVersion: string;
  analyze(frame: MotionFrame): MotionAnalysis;
  reset(): void;
}

export function assertApprovedMotionAdapter(adapter: ApprovedMotionAdapter | null): ApprovedMotionAdapter {
  if (!adapter) throw new Error("APPROVED_MOTION_ADAPTER_NOT_CONFIGURED");
  return adapter;
}
