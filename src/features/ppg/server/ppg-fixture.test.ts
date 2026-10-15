import { describe, expect, it } from "vitest";
import {
  ppgAnalyzeRequestSchema,
  ppgAnalyzeResponseSchema,
  ppgResultSchema,
} from "../ppg.contract";
import { createPpgFixture } from "./ppg-fixture";

const requestId = "da8f5a54-5c28-4e4d-bb10-310fa2d73483";

describe("PPG contract", () => {
  it.each(["poor-signal", "unavailable"] as const)("validates the %s fixture without BPM", (scenario) => {
    const fixture = createPpgFixture(scenario, requestId, new Date("2026-10-15T00:00:00.000Z"));

    expect(ppgAnalyzeResponseSchema.safeParse(fixture).success).toBe(true);
    expect("bpm" in fixture.data).toBe(false);
    expect(fixture.meta.demo).toBe(true);
  });

  it("rejects BPM on a poor-signal response", () => {
    const result = ppgResultSchema.safeParse({
      status: "poor_signal",
      quality: "poor",
      reasonCode: "motion",
      message: "Sinyal kurang baik.",
      bpm: 72,
    });

    expect(result.success).toBe(false);
  });

  it("accepts success only with acceptable quality and a positive BPM", () => {
    const base = {
      status: "ok",
      bpm: 72,
      quality: "acceptable",
      measuredAt: "2026-10-15T00:00:00.000Z",
      collection: { durationMs: 30_000, sampleCount: 900, observedMeanIntervalMs: 33.3 },
      source: { algorithm: "approved-engine", algorithmVersion: "1", captureContractVersion: "1" },
      limitations: ["Prototype measurement"],
    };

    expect(ppgResultSchema.safeParse(base).success).toBe(true);
    expect(ppgResultSchema.safeParse({ ...base, quality: "poor" }).success).toBe(false);
    expect(ppgResultSchema.safeParse({ ...base, bpm: -1 }).success).toBe(false);
  });

  it("bounds capture samples and rejects unconsented input", () => {
    const base = {
      requestId,
      capturedAt: "2026-10-15T00:00:00.000Z",
      consentToAnalyze: true,
      capture: {
        contractVersion: "pending-review",
        durationMs: 1_000,
        observedMeanIntervalMs: 33.3,
        samples: [{ elapsedMs: 0, redMean: 128 }],
      },
    };

    expect(ppgAnalyzeRequestSchema.safeParse(base).success).toBe(true);
    expect(ppgAnalyzeRequestSchema.safeParse({ ...base, consentToAnalyze: false }).success).toBe(false);
    expect(ppgAnalyzeRequestSchema.safeParse({ ...base, capture: { ...base.capture, samples: [] } }).success).toBe(false);
  });
});
