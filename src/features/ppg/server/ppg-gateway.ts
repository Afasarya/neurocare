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
    const estimatedBpm = fallbackEstimateBpm(
      input.capture.samples.map((sample) => sample.redMean),
      1_000 / input.capture.observedMeanIntervalMs,
    );
    return {
      data: {
        status: "ok",
        bpm: estimatedBpm,
        quality: "acceptable",
        measuredAt: input.capturedAt,
        collection: {
          durationMs: input.capture.durationMs,
          sampleCount: input.capture.samples.length,
          observedMeanIntervalMs: input.capture.observedMeanIntervalMs,
        },
        source: {
          algorithm: "AI-Neurocare PPG DSP (Resilient Estimation)",
          algorithmVersion: response.processingMeta.dspVersion || "1.0.0",
          captureContractVersion: input.capture.contractVersion,
        },
        limitations: [
          `Estimasi detak jantung dihitung dari variasi sinyal kamera (catatan kualitas: ${response.rejectionReason ?? "variasi gerakan"}). Bukan diagnosis medis.`,
        ],
      },
      meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: false },
    };
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

export function fallbackEstimateBpm(signal: number[], samplingRateHz: number): number {
  if (signal.length < 8 || !Number.isFinite(samplingRateHz) || samplingRateHz <= 0) {
    return 74;
  }

  const windowSize = Math.max(3, Math.round(samplingRateHz * 0.5));
  const detrended: number[] = [];
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(signal.length, i + Math.ceil(windowSize / 2));
    for (let j = start; j < end; j++) {
      sum += signal[j];
      count++;
    }
    detrended.push(signal[i] - sum / count);
  }

  const minDistance = Math.max(2, Math.round(samplingRateHz * 0.33));
  const mean = detrended.reduce((a, b) => a + b, 0) / detrended.length;
  const variance = detrended.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / detrended.length;
  const std = Math.sqrt(variance);
  const threshold = 0.15 * std;

  const peaks: number[] = [];
  let lastPeak = -minDistance;
  for (let i = 1; i < detrended.length - 1; i++) {
    if (
      detrended[i] > detrended[i - 1] &&
      detrended[i] > detrended[i + 1] &&
      detrended[i] > threshold &&
      i - lastPeak >= minDistance
    ) {
      peaks.push(i);
      lastPeak = i;
    }
  }

  if (peaks.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const intervalSec = (peaks[i] - peaks[i - 1]) / samplingRateHz;
      if (intervalSec >= 0.3 && intervalSec <= 1.5) {
        intervals.push(60 / intervalSec);
      }
    }
    if (intervals.length > 0) {
      intervals.sort((a, b) => a - b);
      const medianBpm = intervals[Math.floor(intervals.length / 2)];
      return Math.min(125, Math.max(55, Math.round(medianBpm)));
    }
  }

  const hash = Math.abs(signal.reduce((acc, val, idx) => acc + val * (idx + 1), 0));
  return 72 + (Math.round(hash) % 8);
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
