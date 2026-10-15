import {
  healthInsightResponseSchema,
  type HealthInsightResponse,
} from "../health-insight.contract";

const unsolicitedNumberPattern = /(?:\d|%|persen|percent)/iu;
const unsupportedClaimPattern = /(?:\brisiko\b|\brisk\b|\bkategori\b|\bcategory\b|didiagnosis|diagnosis anda|\bresep\b|\bdosis\b|minum(?:lah)? obat|hentikan obat|mulai obat|you have|prescribed?)/iu;

export function parseSafeAiInsight(
  payload: unknown,
  expectedSource: { requestId: string; source: { screeningSessionId: string } },
): HealthInsightResponse | null {
  const parsed = healthInsightResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.data.status !== "ok" || parsed.data.meta.demo) return null;
  if (
    parsed.data.meta.requestId !== expectedSource.requestId ||
    parsed.data.data.provenance.sourceScreeningSessionId !== expectedSource.source.screeningSessionId
  ) return null;

  const sections = parsed.data.data.sections;
  const generatedText = [
    sections.summary,
    ...sections.recordedFactors,
    ...sections.incompleteData,
    ...sections.generalFollowUp,
    ...sections.limitations,
  ];

  if (generatedText.some((item) => unsolicitedNumberPattern.test(item) || unsupportedClaimPattern.test(item))) return null;
  return parsed.data;
}

