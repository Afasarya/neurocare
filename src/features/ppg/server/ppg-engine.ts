import {
  ppgAnalyzeResponseSchema,
  type PpgAnalyzeRequest,
  type PpgAnalyzeResponse,
} from "@/features/ppg/ppg.contract";

const ENGINE_TIMEOUT_MS = 10_000;

export async function analyzePpgWithEngine(
  input: PpgAnalyzeRequest,
): Promise<PpgAnalyzeResponse> {
  const endpoint = process.env.PPG_ENGINE_URL;
  if (!endpoint) return unavailable(input.requestId, "engine_not_configured", false);

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Request-Id": input.requestId,
  });
  const apiKey = process.env.PPG_ENGINE_API_KEY;
  if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(ENGINE_TIMEOUT_MS),
    });
    if (!response.ok) return unavailable(input.requestId, "service_error", response.status >= 500);

    const payload: unknown = await response.json();
    const parsed = ppgAnalyzeResponseSchema.safeParse(payload);
    if (!parsed.success || parsed.data.meta.demo) {
      return unavailable(input.requestId, "invalid_engine_response", false);
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return unavailable(input.requestId, "timeout", true);
    }
    return unavailable(input.requestId, "service_error", true);
  }
}

function unavailable(
  requestId: string,
  reason:
    | "engine_not_configured"
    | "timeout"
    | "invalid_engine_response"
    | "service_error",
  retryable: boolean,
): PpgAnalyzeResponse {
  return {
    data: {
      status: "unavailable",
      reason,
      retryable,
      message:
        reason === "timeout"
          ? "Layanan analisis belum merespons. Tidak ada BPM yang dibuat."
          : "Layanan analisis belum tersedia. Tidak ada BPM yang dibuat.",
    },
    meta: {
      requestId,
      generatedAt: new Date().toISOString(),
      demo: false,
    },
  };
}
