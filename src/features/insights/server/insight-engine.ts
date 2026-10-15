import "server-only";

import type { HealthInsightRequest, HealthInsightResponse } from "../health-insight.contract";
import { requestHealthInsightProvider } from "./insight-engine-core";

export async function generateHealthInsight(
  input: HealthInsightRequest,
): Promise<HealthInsightResponse> {
  return requestHealthInsightProvider(input);
}

