import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
  type HealthInsightRequest,
} from "../health-insight.contract";
import { requestHealthInsightProvider } from "./insight-engine-core";

const input: HealthInsightRequest = {
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
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AI_SERVICE_URL;
  delete process.env.AI_SERVICE_API_KEY;
});

describe("requestHealthInsightProvider", () => {
  it("returns unavailable when the provider is not configured", async () => {
    const result = await requestHealthInsightProvider(input);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "provider_not_configured" });
  });

  it("maps provider rate limiting to a safe unavailable response", async () => {
    process.env.AI_SERVICE_URL = "https://provider.invalid/insight";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
    const result = await requestHealthInsightProvider(input);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "rate_limited" });
  });

  it("maps timeout to a safe unavailable response", async () => {
    process.env.AI_SERVICE_URL = "https://provider.invalid/insight";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    const result = await requestHealthInsightProvider(input);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "timeout" });
  });

  it("suppresses malformed provider output with a template", async () => {
    process.env.AI_SERVICE_URL = "https://provider.invalid/insight";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ unexpected: true })));
    const result = await requestHealthInsightProvider(input);
    expect(result.data).toMatchObject({ status: "template", reason: "invalid_ai_response" });
  });

  it("handles invalid provider JSON without exposing it", async () => {
    process.env.AI_SERVICE_URL = "https://provider.invalid/insight";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
    const result = await requestHealthInsightProvider(input);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "provider_error" });
  });
});

