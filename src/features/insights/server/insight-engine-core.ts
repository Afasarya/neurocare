import type { HealthInsightRequest, HealthInsightResponse } from "../health-insight.contract";
import { createSafeTemplate } from "./insight-fixture";
import { parseSafeAiInsight } from "./insight-safety";

const PROVIDER_TIMEOUT_MS = 10_000;

export async function requestHealthInsightProvider(
  input: HealthInsightRequest,
): Promise<HealthInsightResponse> {
  const endpoint = process.env.AI_SERVICE_URL;
  if (!endpoint) return unavailable(input, "provider_not_configured", false);

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Request-Id": input.requestId,
  });
  const apiKey = process.env.AI_SERVICE_API_KEY;
  if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (response.status === 429) return unavailable(input, "rate_limited", true);
    if (!response.ok) return unavailable(input, "provider_error", response.status >= 500);

    const payload: unknown = await response.json();
    const parsed = parseSafeAiInsight(payload, input);
    if (!parsed) return createSafeTemplate(input, "invalid_ai_response");
    return parsed;
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return unavailable(input, "timeout", true);
    }
    return unavailable(input, "provider_error", true);
  }
}

function unavailable(
  input: HealthInsightRequest,
  reason: "provider_not_configured" | "rate_limited" | "timeout" | "provider_error",
  retryable: boolean,
): HealthInsightResponse {
  return {
    data: {
      status: "unavailable",
      reason,
      retryable,
      message: "Penjelasan AI belum tersedia. Fakta skrining tidak diubah dan tetap dapat ditinjau.",
    },
    meta: { requestId: input.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}

