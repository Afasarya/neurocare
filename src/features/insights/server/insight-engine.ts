import "server-only";

import type { HealthInsightRequest, HealthInsightResponse } from "../health-insight.contract";
import type { HealthInsightGatewayRequest } from "./health-insight-gateway";
import { requestHealthInsightProvider } from "./insight-engine-core";

export async function generateHealthInsight(
  input: HealthInsightRequest,
  gatewayRequest: HealthInsightGatewayRequest,
): Promise<HealthInsightResponse> {
  return requestHealthInsightProvider(input, gatewayRequest);
}

