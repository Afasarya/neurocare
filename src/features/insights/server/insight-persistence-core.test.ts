import { describe, expect, it } from "vitest";
import { HEALTH_INSIGHT_SCHEMA_VERSION, type HealthInsightResponse } from "@/features/insights/health-insight.contract";
import { buildInsightRecordInsert } from "@/features/insights/server/insight-persistence-core";

const response: HealthInsightResponse = {
  data: {
    status: "ok",
    sections: {
      summary: "Ringkasan tervalidasi.",
      recordedFactors: ["Faktor tercatat."],
      incompleteData: ["Tidak ada gap tambahan."],
      generalFollowUp: ["Diskusikan dengan tenaga kesehatan."],
      limitations: ["Informasi ini bukan diagnosis."],
    },
    provenance: {
      generatedBy: "ai",
      model: "provider/1.0.0",
      schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
      sourceScreeningSessionId: "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27",
    },
  },
  meta: {
    requestId: "35e39771-da2f-407e-83c8-679b4a011505",
    generatedAt: "2026-10-16T08:00:00.000Z",
    demo: false,
  },
};

const sections = {
  summary: "Ringkasan tervalidasi.",
  recordedFactors: ["Faktor tercatat."],
  incompleteData: ["Tidak ada gap tambahan."],
  generalFollowUp: ["Diskusikan dengan tenaga kesehatan."],
  limitations: ["Informasi ini bukan diagnosis."],
};

describe("insight persistence mapping", () => {
  it("uses only the verified server user as owner", () => {
    expect(buildInsightRecordInsert("verified-user-id", response)).toMatchObject({
      user_id: "verified-user-id",
      screening_session_id: response.data.status === "ok" ? response.data.provenance.sourceScreeningSessionId : "",
      source_mode: "live",
      generated_by: "ai",
    });
  });

  it("does not persist consent-absent local templates", () => {
    const localTemplate: HealthInsightResponse = {
      ...response,
      data: {
        status: "template",
        sections,
        reason: "consent_absent",
        provenance: {
          generatedBy: "template",
          schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
          sourceScreeningSessionId: "8c432f50-bb5b-4d78-84f3-faa7f6c8bc27",
        },
      },
    };
    expect(buildInsightRecordInsert("verified-user-id", localTemplate)).toBeNull();
  });
});
