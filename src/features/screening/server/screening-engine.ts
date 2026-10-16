import { type ScreeningAnalyzeResponse } from "@/features/screening/screening.contract";
import type { ScreeningServerInput } from "@/features/screening/screening.server-schema";
import {
  mapScreeningGatewayResponse,
  prepareScreeningGatewayRequest,
  screeningGatewayResponseSchema,
} from "@/features/screening/server/screening-gateway";
import { requestAiGateway } from "@/lib/ai-gateway/client";
import { AiGatewayError } from "@/lib/ai-gateway/client-core";

export async function analyzeWithScreeningEngine(
  input: ScreeningServerInput,
  hasExternalAiConsent = false,
): Promise<ScreeningAnalyzeResponse> {
  const prepared = prepareScreeningGatewayRequest(input);
  if (prepared.kind === "local") return prepared.response;
  if (!hasExternalAiConsent) {
    return unavailable(input.requestId, "consent_required", false);
  }

  try {
    const response = await requestAiGateway({
      path: "/api/v1/screening/evaluate",
      body: prepared.body,
      requestId: input.requestId,
      responseSchema: screeningGatewayResponseSchema,
      timeoutMs: 25_000,
    });
    return mapScreeningGatewayResponse(input, response);
  } catch (error) {
    console.error("[screening-engine] gateway error", error instanceof AiGatewayError ? { kind: error.kind, status: error.status, problem: error.problem } : error);
    if (!(error instanceof AiGatewayError)) {
      return unavailable(input.requestId, "service_error", true, "unexpected");
    }
    if (error.kind === "not_configured") {
      return unavailable(input.requestId, "engine_not_configured", false, "not_configured");
    }
    if (error.kind === "timeout") {
      return unavailable(input.requestId, "timeout", true);
    }
    if (error.kind === "invalid_response") {
      return unavailable(input.requestId, "invalid_engine_response", false, `invalid_response-${error.status ?? ""}`);
    }
    return unavailable(input.requestId, "service_error", error.retryable, `${error.kind}${error.status ? `-${error.status}` : ""}`);
  }
}

function unavailable(
  requestId: string,
  reason: "engine_not_configured" | "timeout" | "invalid_engine_response" | "service_error" | "consent_required",
  retryable: boolean,
  detail?: string,
): ScreeningAnalyzeResponse {
  return {
    data: {
      status: "unavailable",
      reason,
      retryable,
      message: (
        reason === "consent_required"
          ? "Persetujuan AI eksternal belum aktif. Data tidak dikirim ke layanan analisis."
          : reason === "timeout"
          ? "Layanan analisis belum merespons. Tidak ada hasil yang dibuat."
          : "Layanan analisis belum tersedia. Tidak ada hasil atau angka risiko yang dibuat."
      ) + (detail ? ` [kode: ${detail}]` : ""),
    },
    meta: {
      requestId,
      generatedAt: new Date().toISOString(),
      demo: false,
    },
  };
}
