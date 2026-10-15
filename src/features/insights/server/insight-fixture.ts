import {
  HEALTH_INSIGHT_SCHEMA_VERSION,
  type HealthInsightRequest,
  type HealthInsightResponse,
  type InsightSections,
} from "../health-insight.contract";

export type InsightDemoScenario = "approved" | "unavailable";

export function createSafeTemplate(
  input: HealthInsightRequest,
  reason: "consent_absent" | "ai_unavailable" | "invalid_ai_response",
  now = new Date(),
): HealthInsightResponse {
  return {
    data: {
      status: "template",
      reason,
      sections: genericTemplateSections,
      provenance: {
        generatedBy: "template",
        schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
        sourceScreeningSessionId: input.source.screeningSessionId,
      },
    },
    meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: false },
  };
}

export function createHealthInsightFixture(
  scenario: InsightDemoScenario,
  input: HealthInsightRequest,
  now = new Date(),
): HealthInsightResponse {
  const meta = { requestId: input.requestId, generatedAt: now.toISOString(), demo: true };
  if (scenario === "unavailable") {
    return {
      data: {
        status: "unavailable",
        reason: "provider_error",
        retryable: true,
        message: "Layanan AI simulasi tidak tersedia. Fakta skrining tetap ditampilkan tanpa perubahan.",
      },
      meta,
    };
  }

  return {
    data: {
      status: "ok",
      sections: {
        summary: "Data demonstrasi ini diringkas tanpa membuat diagnosis atau kesimpulan medis baru.",
        recordedFactors: ["Status berasal dari fixture skrining yang ditandai sebagai simulasi."],
        incompleteData: ["Tekanan darah sistolik belum tercatat pada sumber demonstrasi."],
        generalFollowUp: ["Pertimbangkan melengkapi data melalui pemeriksaan yang sesuai."],
        limitations: ["Ringkasan simulasi ini tidak menggantikan penilaian tenaga kesehatan."],
      },
      provenance: {
        generatedBy: "ai",
        model: "fixture-non-clinical",
        schemaVersion: HEALTH_INSIGHT_SCHEMA_VERSION,
        sourceScreeningSessionId: input.source.screeningSessionId,
      },
    },
    meta,
  };
}

const genericTemplateSections: InsightSections = {
  summary: "Penjelasan AI tidak dibuat. Fakta terverifikasi dari skrining tetap tersedia di halaman ini.",
  recordedFactors: ["Tinjau faktor yang tercatat langsung dari sumber skrining."],
  incompleteData: ["Tinjau daftar data yang belum lengkap sebelum mengambil langkah selanjutnya."],
  generalFollowUp: ["Lengkapi data yang tersedia dan diskusikan pertanyaan kesehatan dengan tenaga kesehatan."],
  limitations: ["Template umum ini bukan penjelasan personal, diagnosis, atau rekomendasi pengobatan."],
};

