import "server-only";

import type { z } from "zod";
import {
  requestAiGatewayWithConfig,
  type AiGatewayPath,
} from "@/lib/ai-gateway/client-core";

export function requestAiGateway<TSchema extends z.ZodType>(input: {
  path: AiGatewayPath;
  body: unknown;
  requestId: string;
  responseSchema: TSchema;
  timeoutMs?: number;
}) {
  return requestAiGatewayWithConfig(
    {
      baseUrl: (process.env.AI_GATEWAY_BASE_URL ?? "").trim(),
      apiKey: (process.env.AI_GATEWAY_API_KEY ?? "").trim(),
      timeoutMs: input.timeoutMs,
    },
    input,
  );
}
