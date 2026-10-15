import { describe, expect, it } from "vitest";
import { HEALTH_INSIGHT_SCHEMA_VERSION } from "../health-insight.contract";
import { parseSafeAiInsight } from "./insight-safety";

const expectedSource = {
  requestId: "35e39771-da2f-407e-83c8-679b4a011505",
  source: { screeningSessionId: "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27" },
};

const baseResponse = {
  data: {
    status: "ok",
    sections: {
      summary: "Ringkasan terbatas dari fakta sumber.",
      recordedFactors: ["Faktor berasal dari hasil terverifikasi."],
      incompleteData: ["Ada data yang belum lengkap."],
      generalFollowUp: ["Diskusikan pertanyaan dengan tenaga kesehatan."],
      limitations: ["Penjelasan ini bukan diagnosis."],
    },
    provenance: {
      generatedBy: "ai",
      model: "approved-model",
      schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
      sourceScreeningSessionId: "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27",
    },
  },
  meta: {
    requestId: "35e39771-da2f-407e-83c8-679b4a011505",
    generatedAt: "2026-10-15T08:30:00.000Z",
    demo: false,
  },
};

describe("parseSafeAiInsight", () => {
  it("accepts a complete structured response", () => {
    expect(parseSafeAiInsight(baseResponse, expectedSource)).not.toBeNull();
  });

  it("rejects empty or malformed output", () => {
    expect(parseSafeAiInsight({}, expectedSource)).toBeNull();
    expect(parseSafeAiInsight({ ...baseResponse, data: { status: "ok" } }, expectedSource)).toBeNull();
  });

  it("rejects unsolicited risk numbers without changing source facts", () => {
    const conflicting = structuredClone(baseResponse);
    conflicting.data.sections.summary = "Risiko Anda adalah 42 persen.";
    expect(parseSafeAiInsight(conflicting, expectedSource)).toBeNull();
  });

  it("rejects disallowed extra fields and demo provider responses", () => {
    expect(parseSafeAiInsight({ ...baseResponse, riskPercentage: 42 }, expectedSource)).toBeNull();
    expect(parseSafeAiInsight({ ...baseResponse, meta: { ...baseResponse.meta, demo: true } }, expectedSource)).toBeNull();
  });

  it("rejects a response linked to another request or screening session", () => {
    expect(parseSafeAiInsight(baseResponse, { ...expectedSource, requestId: crypto.randomUUID() })).toBeNull();
    expect(parseSafeAiInsight(baseResponse, { ...expectedSource, source: { screeningSessionId: crypto.randomUUID() } })).toBeNull();
  });
});

