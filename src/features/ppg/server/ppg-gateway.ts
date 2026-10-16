import { z } from "zod";
import type {
  PpgAnalyzeRequest,
  PpgAnalyzeResponse,
} from "@/features/ppg/ppg.contract";

export const ppgGatewayRequestSchema = z
  .object({
    signal: z.array(z.number().finite()).min(32).max(100_000),
    samplingRateHz: z.number().finite().min(10).max(240),
  })
  .strict();

const processingMetaSchema = z
  .object({
    filteredSamples: z.number().int().nonnegative(),
    detectedBeats: z.number().int().nonnegative(),
    dspVersion: z.string().min(1),
  })
  .strict();

export const ppgGatewayResponseSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("PROCESSED"),
      heartRateBpm: z.number().finite().positive(),
      sqi: z.number().min(0).max(1),
      ibiMsList: z.array(z.number().finite().positive()).min(1),
      rejectionReason: z.null(),
      processingMeta: processingMetaSchema,
    })
    .strict(),
  z
    .object({
      status: z.literal("REJECTED"),
      heartRateBpm: z.null(),
      sqi: z.number().min(0).max(1),
      ibiMsList: z.null(),
      rejectionReason: z.enum([
        "EXCESSIVE_MOTION",
        "SIGNAL_TOO_SHORT",
        "INSUFFICIENT_BEATS",
      ]),
      processingMeta: processingMetaSchema,
    })
    .strict(),
]);

export type PpgGatewayRequest = z.infer<typeof ppgGatewayRequestSchema>;
export type PpgGatewayResponse = z.infer<typeof ppgGatewayResponseSchema>;

export type PpgGatewayPreparation =
  | { kind: "gateway"; body: PpgGatewayRequest }
  | { kind: "local"; response: PpgAnalyzeResponse };

export function preparePpgGatewayRequest(
  input: PpgAnalyzeRequest,
  now = new Date(),
): PpgGatewayPreparation {
  if (input.capture.samples.length < 32) {
    return {
      kind: "local",
      response: poorSignal(input.requestId, "insufficient_samples", now),
    };
  }

  const samplingRateHz = 1_000 / input.capture.observedMeanIntervalMs;
  const parsed = ppgGatewayRequestSchema.safeParse({
    signal: input.capture.samples.map((sample) => sample.redMean),
    samplingRateHz,
  });
  if (!parsed.success) {
    return {
      kind: "local",
      response: poorSignal(input.requestId, "unsupported_capture_profile", now),
    };
  }
  return { kind: "gateway", body: parsed.data };
}

export function mapPpgGatewayResponse(
  input: PpgAnalyzeRequest,
  response: PpgGatewayResponse,
  now = new Date(),
): PpgAnalyzeResponse {
  if (response.status === "REJECTED") {
    const reasonCode = response.rejectionReason === "EXCESSIVE_MOTION"
      ? "motion"
      : response.rejectionReason === "SIGNAL_TOO_SHORT"
        ? "insufficient_duration"
        : "insufficient_samples";
    return poorSignal(input.requestId, reasonCode, now);
  }

  return {
    data: {
      status: "ok",
      bpm: response.heartRateBpm,
      quality: "acceptable",
      measuredAt: input.capturedAt,
      collection: {
        durationMs: input.capture.durationMs,
        sampleCount: input.capture.samples.length,
        observedMeanIntervalMs: input.capture.observedMeanIntervalMs,
      },
      source: {
        algorithm: "AI-Neurocare PPG DSP",
        algorithmVersion: response.processingMeta.dspVersion,
        captureContractVersion: input.capture.contractVersion,
      },
      limitations: [
        "Hasil hanya estimasi detak jantung BPM dan bukan pengukuran tekanan darah, diagnosis aritmia, atau prediksi stroke.",
      ],
    },
    meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: false },
  };
}

function poorSignal(
  requestId: string,
  reasonCode:
    | "motion"
    | "lighting"
    | "insufficient_duration"
    | "insufficient_samples"
    | "unsupported_capture_profile",
  now: Date,
): PpgAnalyzeResponse {
  return {
    data: {
      status: "poor_signal",
      quality: "unusable",
      reasonCode,
      message: "Sinyal belum cukup baik untuk menghasilkan BPM. Tidak ada angka yang dibuat.",
    },
    meta: { requestId, generatedAt: now.toISOString(), demo: false },
  };
}
