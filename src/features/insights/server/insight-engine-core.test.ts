import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
  type HealthInsightRequest,
} from "../health-insight.contract";
import type { HealthInsightGatewayRequest } from "./health-insight-gateway";
import { requestHealthInsightProvider } from "./insight-engine-core";

const input: HealthInsightRequest = {
  requestId: "35e39771-da2f-407e-83c8-679b4a011505",
  schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
  consentToExternalAi: true,
  source: {
    screeningSessionId: "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27",
    recordedAt: "2026-10-15T08:30:00.000Z",
    safetyStatus: "clear",
    screeningStatus: "ok",
    riskScope: "cvd_10y",
    categoryLabel: "Kurang dari 5%",
    factorLabels: ["Hasil skrining tercatat"],
    incompleteDataLabels: [],
    provenance: { label: "AI-Neurocare", version: "gateway-v1" },
  },
};

const gatewayRequest: HealthInsightGatewayRequest = {
  evaluationId: "913459aa-838c-4d4a-b9fd-83cce49b705b",
  patientAgeYears: 46,
  gender: "FEMALE",
  systolicBloodPressureMmHg: 120,
  resolvedBmi: 22.04,
  isCurrentSmoker: false,
  riskCategory: "UNDER_5_PERCENT",
  riskLevel: "LOW_RISK",
  isHypertensiveCrisis: false,
  identifiedGapsSummary: [],
  preferredLanguage: "id_ID",
};

const gatewayResponse = {
  insightId: "insight-1",
  evaluationId: gatewayRequest.evaluationId,
  generatedAt: "2026-10-16T08:00:00.000Z",
  modelMeta: {
    provider: "fallback-template",
    schemaVersion: "1.0.0",
    isFallbackTemplate: true,
    latencyMs: 12,
  },
  structuredContent: {
    headline: "Ringkasan pemantauan kesehatan",
    summaryNarration: "Ringkasan ini disusun dari fakta skrining tervalidasi yang tersimpan pada NeuroCare.",
    primaryRiskDrivers: ["Faktor tercatat berasal dari hasil skrining."],
    actionPlan: [
      { category: "MONITORING_ROUTINE", actionText: "Lanjutkan pencatatan pengukuran secara berkala.", urgency: "ROUTINE_MONTHLY" },
      { category: "MEDICAL_FOLLOWUP", actionText: "Diskusikan hasil dengan tenaga kesehatan.", urgency: "RECOMMENDED_WITHIN_14_DAYS" },
    ],
    rehabilitationPreparationNote: "Ikuti arahan tenaga kesehatan sebelum aktivitas baru.",
    mandatoryDisclaimer: "Informasi ini bukan diagnosis dan bukan pengganti konsultasi tenaga kesehatan.",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AI_GATEWAY_BASE_URL;
  delete process.env.AI_GATEWAY_API_KEY;
});

function configureGateway() {
  process.env.AI_GATEWAY_BASE_URL = "https://gateway.example.test";
  process.env.AI_GATEWAY_API_KEY = "server-secret";
}

describe("requestHealthInsightProvider", () => {
  it("returns unavailable when the Gateway is not configured", async () => {
    const result = await requestHealthInsightProvider(input, gatewayRequest);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "provider_not_configured" });
  });

  it("maps a valid Gateway fallback transparently as a template", async () => {
    configureGateway();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(gatewayResponse)));
    const result = await requestHealthInsightProvider(input, gatewayRequest);
    expect(result.data).toMatchObject({ status: "template", reason: "gateway_fallback" });
  });

  it("maps Gateway 401 to a safe unavailable response", async () => {
    configureGateway();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(problemResponse(401)));
    const result = await requestHealthInsightProvider(input, gatewayRequest);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "provider_error", retryable: false });
  });

  it("maps timeout to a safe unavailable response", async () => {
    configureGateway();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    const result = await requestHealthInsightProvider(input, gatewayRequest);
    expect(result.data).toMatchObject({ status: "unavailable", reason: "timeout" });
  });

  it("suppresses malformed Gateway output with a safe template", async () => {
    configureGateway();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ unexpected: true })));
    const result = await requestHealthInsightProvider(input, gatewayRequest);
    expect(result.data).toMatchObject({ status: "template", reason: "invalid_ai_response" });
  });
});

function problemResponse(status: number) {
  return new Response(JSON.stringify({
    type: "https://errors.ai-neurocare.org/v1/test-error",
    title: "Test error",
    status,
    detail: "Safe detail",
    instance: "/api/v1/insights/health",
    errorCode: "ERR_TEST_ERROR",
    timestamp: "2026-10-16T08:00:00.000Z",
  }), { status, headers: { "Content-Type": "application/problem+json" } });
}
