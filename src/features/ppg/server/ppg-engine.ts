import type { PpgAnalyzeRequest, PpgAnalyzeResponse } from "@/features/ppg/ppg.contract";
import {
  mapPpgGatewayResponse,
  preparePpgGatewayRequest,
  ppgGatewayResponseSchema,
} from "@/features/ppg/server/ppg-gateway";
import { requestAiGateway } from "@/lib/ai-gateway/client";
import { AiGatewayError } from "@/lib/ai-gateway/client-core";

export async function analyzePpgWithEngine(
  input: PpgAnalyzeRequest,
): Promise<PpgAnalyzeResponse> {
  const prepared = preparePpgGatewayRequest(input);
  if (prepared.kind === "local") return prepared.response;

  try {
    const response = await requestAiGateway({
      path: "/api/v1/biomarkers/ppg/process",
      body: prepared.body,
      requestId: input.requestId,
      responseSchema: ppgGatewayResponseSchema,
      timeoutMs: 25_000,
    });
    return mapPpgGatewayResponse(input, response);
  } catch (error) {
    console.error("[ppg-engine] gateway error", error instanceof AiGatewayError ? { kind: error.kind, status: error.status, problem: error.problem } : error);
    if (!(error instanceof AiGatewayError)) {
      return unavailable(input.requestId, "service_error", true);
    }
    if (error.kind === "not_configured") {
      return unavailable(input.requestId, "engine_not_configured", false);
    }
    if (error.kind === "timeout") {
      return unavailable(input.requestId, "timeout", true);
    }
    if (error.kind === "invalid_response") {
      return unavailable(input.requestId, "invalid_engine_response", false);
    }
    return unavailable(input.requestId, "service_error", error.retryable, `${error.kind}${error.status ? `-${error.status}` : ""}`);
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
  detail?: string,
): PpgAnalyzeResponse {
  return {
    data: {
      status: "unavailable",
      reason,
      retryable,
      message: (
        reason === "timeout"
          ? "Layanan analisis belum merespons. Tidak ada BPM yang dibuat."
          : "Layanan analisis belum tersedia. Tidak ada BPM yang dibuat."
      ) + (detail ? ` [kode: ${detail}]` : ""),
    },
    meta: {
      requestId,
      generatedAt: new Date().toISOString(),
      demo: false,
    },
  };
}
