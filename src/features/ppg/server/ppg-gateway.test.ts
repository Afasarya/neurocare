import { describe, expect, it } from "vitest";
import type { PpgAnalyzeRequest } from "@/features/ppg/ppg.contract";
import { mapPpgGatewayResponse, preparePpgGatewayRequest, ppgGatewayResponseSchema } from "@/features/ppg/server/ppg-gateway";

function input(sampleCount = 32): PpgAnalyzeRequest {
  return {
    requestId: "d3ac1cf5-792f-426e-b16d-dc05853dab15",
    capturedAt: "2026-10-16T08:00:00.000Z",
    consentToAnalyze: true,
    capture: {
      contractVersion: "ppg-camera-v1",
      durationMs: 1_100,
      observedMeanIntervalMs: 1000 / 30,
      samples: Array.from({ length: sampleCount }, (_, index) => ({ elapsedMs: index * (1000 / 30), redMean: 100 + index / 10 })),
    },
  };
}

describe("PPG Gateway mapping", () => {
  it("maps red-channel samples to the strict DSP contract", () => {
    const prepared = preparePpgGatewayRequest(input());
    expect(prepared.kind).toBe("gateway");
    if (prepared.kind === "gateway") {
      expect(prepared.body.signal).toHaveLength(32);
      expect(prepared.body.samplingRateHz).toBeCloseTo(30);
      expect(prepared.body).not.toHaveProperty("requestId");
    }
  });
  it("does not call the Gateway for too few samples", () => {
    expect(preparePpgGatewayRequest(input(10))).toMatchObject({ kind: "local", response: { data: { status: "poor_signal", reasonCode: "insufficient_samples" } } });
  });
  it("maps a processed response without exposing SQI or IBI", () => {
    const gatewayResponse = ppgGatewayResponseSchema.parse({
      status: "PROCESSED", heartRateBpm: 66.67, sqi: 0.85, ibiMsList: [833.3, 850], rejectionReason: null,
      processingMeta: { filteredSamples: 32, detectedBeats: 3, dspVersion: "1.0.0" },
    });
    const response = mapPpgGatewayResponse(input(), gatewayResponse);
    expect(response.data).toMatchObject({ status: "ok", bpm: 66.67, quality: "acceptable" });
    expect(response.data).not.toHaveProperty("sqi");
    expect(response.data).not.toHaveProperty("ibiMsList");
  });
  it("maps a rejected response to a resilient estimated BPM so user always gets an output", () => {
    const gatewayResponse = ppgGatewayResponseSchema.parse({
      status: "REJECTED", heartRateBpm: null, sqi: 0.2, ibiMsList: null, rejectionReason: "EXCESSIVE_MOTION",
      processingMeta: { filteredSamples: 32, detectedBeats: 0, dspVersion: "1.0.0" },
    });
    const response = mapPpgGatewayResponse(input(), gatewayResponse);
    expect(response.data.status).toBe("ok");
    if (response.data.status === "ok") {
      expect(response.data.bpm).toBeGreaterThan(0);
    }
  });
});
