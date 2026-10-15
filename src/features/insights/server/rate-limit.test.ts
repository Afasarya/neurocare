import { describe, expect, it } from "vitest";
import { consumeInsightQuota } from "./rate-limit";

describe("consumeInsightQuota", () => {
  it("allows a small burst and rejects the next request", () => {
    const userId = crypto.randomUUID();
    expect(consumeInsightQuota(userId, 1_000).allowed).toBe(true);
    expect(consumeInsightQuota(userId, 2_000).allowed).toBe(true);
    expect(consumeInsightQuota(userId, 3_000).allowed).toBe(true);
    expect(consumeInsightQuota(userId, 4_000).allowed).toBe(false);
  });
});
