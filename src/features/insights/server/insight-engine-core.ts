import type { HealthInsightRequest, HealthInsightResponse } from "../health-insight.contract";
import { createSafeTemplate } from "./insight-fixture";
import {
  healthInsightGatewayResponseSchema,
  mapHealthInsightGatewayResponse,
  type HealthInsightGatewayRequest,
} from "./health-insight-gateway";
import { AiGatewayError, requestAiGatewayWithConfig } from "@/lib/ai-gateway/client-core";

export async function requestHealthInsightProvider(
  input: HealthInsightRequest,
  gatewayRequest?: HealthInsightGatewayRequest,
): Promise<HealthInsightResponse> {
  if (!gatewayRequest) return unavailable(input, "provider_not_configured", false);

  try {
    const response = await requestAiGatewayWithConfig(
      {
        baseUrl: process.env.AI_GATEWAY_BASE_URL ?? "",
        apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
        timeoutMs: 10_000,
      },
      {
        path: "/api/v1/insights/health",
        body: gatewayRequest,
        requestId: input.requestId,
        responseSchema: healthInsightGatewayResponseSchema,
      },
    );
    return mapHealthInsightGatewayResponse(input, gatewayRequest, response)
      ?? createSafeTemplate(input, "invalid_ai_response");
  } catch (error) {
    if (!(error instanceof AiGatewayError)) {
      return unavailable(input, "provider_error", true);
    }
    if (error.kind === "not_configured") {
      return unavailable(input, "provider_not_configured", false);
    }
    if (error.kind === "timeout") {
      return unavailable(input, "timeout", true);
    }
    if (error.kind === "invalid_response") {
      return createSafeTemplate(input, "invalid_ai_response");
    }
    return unavailable(input, "provider_error", error.retryable);
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

