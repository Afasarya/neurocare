import type { z } from "zod";
import {
  aiGatewayProblemDetailsSchema,
  type AiGatewayProblemDetails,
} from "@/lib/ai-gateway/problem-details";

export const AI_GATEWAY_PATHS = [
  "/api/v1/screening/evaluate",
  "/api/v1/screening/gaps",
  "/api/v1/insights/health",
  "/api/v1/recovery/insight",
  "/api/v1/rehab/session/evaluate",
  "/api/v1/rehab/pose/evaluate",
  "/api/v1/biomarkers/ppg/process",
] as const;

export type AiGatewayPath = (typeof AI_GATEWAY_PATHS)[number];

type GatewayErrorKind =
  | "not_configured"
  | "timeout"
  | "unauthorized"
  | "validation"
  | "upstream"
  | "invalid_response"
  | "service_error";

export class AiGatewayError extends Error {
  constructor(
    public readonly kind: GatewayErrorKind,
    public readonly status: number | null,
    public readonly retryable: boolean,
    public readonly problem: AiGatewayProblemDetails | null = null,
  ) {
    super(kind);
    this.name = "AiGatewayError";
  }
}

type GatewayClientConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type GatewayRequest<TSchema extends z.ZodType> = {
  path: AiGatewayPath;
  body: unknown;
  requestId: string;
  responseSchema: TSchema;
};

const MAX_RESPONSE_BYTES = 1024 * 1024;

export async function requestAiGatewayWithConfig<TSchema extends z.ZodType>(
  config: GatewayClientConfig,
  request: GatewayRequest<TSchema>,
): Promise<z.output<TSchema>> {
  const baseUrl = parseBaseUrl(config.baseUrl);
  const fetchImpl = config.fetchImpl ?? fetch;
  let response: Response;
  const headers = new Headers({
    Accept: "application/json, application/problem+json",
    "Content-Type": "application/json",
    "X-Request-Id": request.requestId,
  });
  // Gateway authentication is intentionally deployment-configurable. When
  // GATEWAY_API_KEYS is set, this server-only value is required. A local or
  // protected-network gateway may explicitly run without API-key auth.
  if (config.apiKey.trim()) headers.set("X-API-Key", config.apiKey);

  try {
    response = await fetchImpl(new URL(request.path, baseUrl), {
      method: "POST",
      headers,
      body: JSON.stringify(request.body),
      cache: "no-store",
      signal: AbortSignal.timeout(config.timeoutMs ?? 10_000),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new AiGatewayError("timeout", null, true);
    }
    throw new AiGatewayError("service_error", null, true);
  }

  const rawBody = await readBoundedResponse(response);
  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new AiGatewayError("invalid_response", response.status, false);
  }

  if (!response.ok) {
    const parsedProblem = aiGatewayProblemDetailsSchema.safeParse(payload);
    if (!parsedProblem.success || parsedProblem.data.status !== response.status) {
      throw new AiGatewayError("invalid_response", response.status, false);
    }
    throw mapProblem(parsedProblem.data);
  }

  const parsed = request.responseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AiGatewayError("invalid_response", response.status, false);
  }
  return parsed.data;
}

function parseBaseUrl(value: string) {
  if (!value.trim()) {
    throw new AiGatewayError("not_configured", null, false);
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      throw new Error("INSECURE_GATEWAY_URL");
    }
    url.pathname = `${url.pathname.replace(/\/$/, "")}/`;
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    throw new AiGatewayError("not_configured", null, false);
  }
}

async function readBoundedResponse(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) {
    throw new AiGatewayError("invalid_response", response.status, false);
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
    throw new AiGatewayError("invalid_response", response.status, false);
  }
  return text;
}

function mapProblem(problem: AiGatewayProblemDetails) {
  if (problem.status === 401) {
    return new AiGatewayError("unauthorized", 401, false, problem);
  }
  if (problem.status === 400 || problem.status === 422) {
    return new AiGatewayError("validation", problem.status, false, problem);
  }
  if (problem.status === 502 || problem.status === 504) {
    return new AiGatewayError("upstream", problem.status, true, problem);
  }
  return new AiGatewayError(
    "service_error",
    problem.status,
    problem.status >= 500,
    problem,
  );
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
