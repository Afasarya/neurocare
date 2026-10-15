import type { HealthInsightRequest, HealthInsightResponse } from "../health-insight.contract";
import { createSafeTemplate } from "./insight-fixture";

export async function resolveHealthInsight(
  input: HealthInsightRequest,
  generate: (value: HealthInsightRequest) => Promise<HealthInsightResponse>,
  now = new Date(),
): Promise<HealthInsightResponse> {
  if (input.source.safetyStatus === "emergency") {
    return {
      data: {
        status: "emergency_blocked",
        message: "Insight rutin dihentikan. Cari bantuan darurat setempat atau fasilitas kesehatan terdekat.",
        sourceScreeningSessionId: input.source.screeningSessionId,
      },
      meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: false },
    };
  }
  if (!input.consentToExternalAi) return createSafeTemplate(input, "consent_absent", now);
  return generate(input);
}

