import type { PpgAnalyzeResponse } from "../ppg.contract";

export type PpgDemoScenario = "poor-signal" | "unavailable";

export function createPpgFixture(
  scenario: PpgDemoScenario,
  requestId: string,
  now = new Date(),
): PpgAnalyzeResponse {
  const meta = {
    requestId,
    generatedAt: now.toISOString(),
    demo: true,
  };

  if (scenario === "poor-signal") {
    return {
      data: {
        status: "poor_signal",
        quality: "unusable",
        reasonCode: "unsupported_capture_profile",
        message:
          "Sinyal demo tidak dapat dianalisis karena kontrak capture belum disetujui. Tidak ada BPM yang dibuat.",
      },
      meta,
    };
  }

  return {
    data: {
      status: "unavailable",
      reason: "engine_not_configured",
      retryable: false,
      message:
        "PPG engine terverifikasi belum terhubung. Tidak ada BPM yang dibuat.",
    },
    meta,
  };
}
