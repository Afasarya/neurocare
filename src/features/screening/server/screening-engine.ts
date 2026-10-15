import {
  screeningAnalyzeResponseSchema,
  type ScreeningAnalyzeResponse,
} from "@/features/screening/screening.contract";
import type { ScreeningServerInput } from "@/features/screening/screening.server-schema";

const ENGINE_TIMEOUT_MS = 8_000;

export async function analyzeWithScreeningEngine(
  input: ScreeningServerInput,
): Promise<ScreeningAnalyzeResponse> {
  const endpoint = process.env.SCREENING_ENGINE_URL;
  if (!endpoint) {
    return unavailable(input.requestId, "engine_not_configured", false);
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Request-Id": input.requestId,
  });
  const apiKey = process.env.SCREENING_ENGINE_API_KEY;
  if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(ENGINE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return unavailable(input.requestId, "service_error", response.status >= 500);
    }

    const payload: unknown = await response.json();
    const parsed = screeningAnalyzeResponseSchema.safeParse(payload);
    if (!parsed.success || parsed.data.meta.demo) {
      return unavailable(input.requestId, "invalid_engine_response", false);
    }
    if (parsed.data.data.status === "ok" && !isEligibleMvpInput(input)) {
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

function isEligibleMvpInput(input: ScreeningServerInput) {
  if (input.priorCvd !== "no" || input.emergencySymptoms !== "no") return false;
  const [year, month, day] = input.dateOfBirth.split("-").map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  if (
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)
  ) {
    age -= 1;
  }
  return age >= 40 && age <= 59;
}

function unavailable(
  requestId: string,
  reason: "engine_not_configured" | "timeout" | "invalid_engine_response" | "service_error",
  retryable: boolean,
): ScreeningAnalyzeResponse {
  return {
    data: {
      status: "unavailable",
      reason,
      retryable,
      message:
        reason === "timeout"
          ? "Layanan analisis belum merespons. Tidak ada hasil yang dibuat."
          : "Layanan analisis belum tersedia. Tidak ada hasil atau angka risiko yang dibuat.",
    },
    meta: {
      requestId,
      generatedAt: new Date().toISOString(),
      demo: false,
    },
  };
}
