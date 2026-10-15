import { describe, expect, it, vi } from "vitest";
import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
  type HealthInsightRequest,
} from "../health-insight.contract";
import { createHealthInsightFixture } from "./insight-fixture";
import { resolveHealthInsight } from "./insight-service";

function request(overrides: Partial<HealthInsightRequest> = {}): HealthInsightRequest {
  return {
    requestId: "35e39771-da2f-407e-83c8-679b4a011505",
    schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
    consentToExternalAi: true,
    source: {
      screeningSessionId: "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27",
      recordedAt: "2026-10-15T08:30:00.000Z",
      safetyStatus: "clear",
      screeningStatus: "insufficient_data",
      riskScope: null,
      categoryLabel: null,
      factorLabels: ["Jalur NeuroPrevent tercatat"],
      incompleteDataLabels: ["Tekanan darah sistolik belum tersedia"],
      provenance: { label: "Fixture F01 dan F02", version: "demo-safe-v1" },
    },
    ...overrides,
  };
}

describe("resolveHealthInsight", () => {
  it("does not call the generator on emergency status", async () => {
    const generate = vi.fn();
    const input = request({ source: { ...request().source, safetyStatus: "emergency" } });
    const result = await resolveHealthInsight(input, generate);

    expect(generate).not.toHaveBeenCalled();
    expect(result.data.status).toBe("emergency_blocked");
  });

  it("does not call the generator without consent", async () => {
    const generate = vi.fn();
    const result = await resolveHealthInsight(request({ consentToExternalAi: false }), generate);

    expect(generate).not.toHaveBeenCalled();
    expect(result.data.status).toBe("template");
  });

  it("uses the generator only after consent with a clear safety status", async () => {
    const input = request();
    const generated = createHealthInsightFixture("approved", input);
    const generate = vi.fn().mockResolvedValue(generated);
    const result = await resolveHealthInsight(input, generate);

    expect(generate).toHaveBeenCalledOnce();
    expect(result.data.status).toBe("ok");
  });
});

