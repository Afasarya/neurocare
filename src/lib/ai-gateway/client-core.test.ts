import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AiGatewayError,
  requestAiGatewayWithConfig,
} from "@/lib/ai-gateway/client-core";

const responseSchema = z.object({ ok: z.literal(true) }).strict();
const request = {
  path: "/api/v1/screening/evaluate" as const,
  body: { exact: "payload" },
  requestId: "71df8b68-283d-4510-9370-e4805cb0dbf7",
  responseSchema,
};

function problem(status: number) {
  return {
    type: "https://errors.ai-neurocare.org/v1/test-error",
    title: "Test error",
    status,
    detail: "Safe test detail",
    instance: request.path,
    errorCode: "ERR_TEST_ERROR",
    timestamp: "2026-10-16T08:00:00.000Z",
  };
}

async function captureError(promise: Promise<unknown>) {
  try {
    await promise;
    throw new Error("EXPECTED_AI_GATEWAY_ERROR");
  } catch (error) {
    expect(error).toBeInstanceOf(AiGatewayError);
    return error as AiGatewayError;
  }
}

describe("AI Gateway client", () => {
  it("sends the API key only as a server-to-server X-API-Key header", async () => {
    const fetchImpl = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("X-API-Key")).toBe("server-secret");
      expect(headers.get("Authorization")).toBeNull();
      expect(init?.cache).toBe("no-store");
      return Response.json({ ok: true });
    });

    await expect(
      requestAiGatewayWithConfig(
        { baseUrl: "https://gateway.example.test", apiKey: "server-secret", fetchImpl },
        request,
      ),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("supports a deliberately unauthenticated Gateway without emitting an empty key", async () => {
    const fetchImpl = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("X-API-Key")).toBeNull();
      return Response.json({ ok: true });
    });

    await expect(
      requestAiGatewayWithConfig(
        { baseUrl: "https://gateway.example.test", apiKey: "", fetchImpl },
        request,
      ),
    ).resolves.toEqual({ ok: true });
  });

  it.each([
    [401, "unauthorized", false],
    [422, "validation", false],
    [502, "upstream", true],
  ] as const)("maps RFC 7807 status %s", async (status, kind, retryable) => {
    const error = await captureError(
      requestAiGatewayWithConfig(
        {
          baseUrl: "https://gateway.example.test",
          apiKey: "server-secret",
          fetchImpl: vi.fn(async () =>
            new Response(JSON.stringify(problem(status)), {
              status,
              headers: { "Content-Type": "application/problem+json" },
            }),
          ),
        },
        request,
      ),
    );
    expect(error.kind).toBe(kind);
    expect(error.retryable).toBe(retryable);
    expect(error.problem?.status).toBe(status);
  });

  it("rejects a malformed success response", async () => {
    const error = await captureError(
      requestAiGatewayWithConfig(
        {
          baseUrl: "https://gateway.example.test",
          apiKey: "server-secret",
          fetchImpl: vi.fn(async () => Response.json({ ok: false })),
        },
        request,
      ),
    );
    expect(error.kind).toBe("invalid_response");
  });

  it("classifies a timeout without exposing provider details", async () => {
    const error = await captureError(
      requestAiGatewayWithConfig(
        {
          baseUrl: "https://gateway.example.test",
          apiKey: "server-secret",
          fetchImpl: vi.fn(async () => {
            throw new DOMException("timed out", "TimeoutError");
          }),
        },
        request,
      ),
    );
    expect(error.kind).toBe("timeout");
    expect(error.problem).toBeNull();
  });
});
