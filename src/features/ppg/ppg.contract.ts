import { z } from "zod";

export const ppgSampleSchema = z
  .object({
    elapsedMs: z.number().finite().nonnegative(),
    redMean: z.number().finite().min(0).max(255),
  })
  .strict();

export const ppgAnalyzeRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    capturedAt: z.string().datetime(),
    consentToAnalyze: z.literal(true),
    capture: z
      .object({
        contractVersion: z.string().min(1),
        durationMs: z.number().finite().positive().max(120_000),
        observedMeanIntervalMs: z.number().finite().positive(),
        samples: z.array(ppgSampleSchema).min(1).max(12_000),
      })
      .strict(),
  })
  .strict();

const responseMetaSchema = z.object({
  requestId: z.string().min(1),
  generatedAt: z.string().datetime(),
  demo: z.boolean(),
});

export const ppgResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("poor_signal"),
      quality: z.enum(["poor", "unusable"]),
      reasonCode: z.enum([
        "motion",
        "lighting",
        "insufficient_duration",
        "insufficient_samples",
        "unsupported_capture_profile",
      ]),
      message: z.string().min(1),
    })
    .strict(),
  z
    .object({
      status: z.literal("unavailable"),
      reason: z.enum([
        "contract_not_configured",
        "engine_not_configured",
        "timeout",
        "invalid_engine_response",
        "service_error",
      ]),
      retryable: z.boolean(),
      message: z.string().min(1),
    })
    .strict(),
  z
    .object({
      status: z.literal("ok"),
      bpm: z.number().finite().positive(),
      quality: z.literal("acceptable"),
      measuredAt: z.string().datetime(),
      collection: z.object({
        durationMs: z.number().finite().positive(),
        sampleCount: z.number().int().positive(),
        observedMeanIntervalMs: z.number().finite().positive(),
      }),
      source: z.object({
        algorithm: z.string().min(1),
        algorithmVersion: z.string().min(1),
        captureContractVersion: z.string().min(1),
      }),
      limitations: z.array(z.string().min(1)).min(1),
    })
    .strict(),
]);

export const ppgAnalyzeResponseSchema = z
  .object({
    data: ppgResultSchema,
    meta: responseMetaSchema,
  })
  .strict();

export type PpgAnalyzeRequest = z.infer<typeof ppgAnalyzeRequestSchema>;
export type PpgAnalyzeResponse = z.infer<typeof ppgAnalyzeResponseSchema>;
export type PpgResult = z.infer<typeof ppgResultSchema>;
