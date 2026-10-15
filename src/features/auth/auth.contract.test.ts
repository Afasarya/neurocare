import { describe, expect, it } from "vitest";
import {
  getPublicAuthError,
  getSafeNextPath,
  getEmailCallbackVerification,
  hasTrustedRequestOrigin,
  loginSchema,
  registrationSchema,
} from "./auth.contract";

describe("auth contract", () => {
  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.test", password: "rahasia-aman" }).success,
    ).toBe(true);
  });

  it("rejects an invalid email and short password", () => {
    expect(loginSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(false);
  });

  it("requires matching password confirmation", () => {
    const result = registrationSchema.safeParse({
      email: "user@example.test",
      password: "rahasia-aman",
      confirmPassword: "berbeda-aman",
    });

    expect(result.success).toBe(false);
  });

  it("allows only internal app redirects", () => {
    expect(getSafeNextPath("/app/screening?step=2")).toBe("/app/screening?step=2");
    expect(getSafeNextPath("https://attacker.test")).toBe("/app/dashboard");
    expect(getSafeNextPath("//attacker.test/app")).toBe("/app/dashboard");
    expect(getSafeNextPath("/profile")).toBe("/app/dashboard");
  });

  it("does not expose unknown provider errors", () => {
    expect(getPublicAuthError("some_provider_detail")).not.toContain("provider");
  });

  it("accepts only same-origin auth mutations", () => {
    const trusted = new Request("https://neurocare.test/api/auth/login", {
      headers: { origin: "https://neurocare.test" },
    });
    const foreign = new Request("https://neurocare.test/api/auth/login", {
      headers: { origin: "https://attacker.test" },
    });

    expect(hasTrustedRequestOrigin(trusted)).toBe(true);
    expect(hasTrustedRequestOrigin(foreign)).toBe(false);
  });

  it("supports both Supabase email confirmation URL formats", () => {
    expect(
      getEmailCallbackVerification(new URLSearchParams("code=one-time-code")),
    ).toEqual({ kind: "code", code: "one-time-code" });
    expect(
      getEmailCallbackVerification(
        new URLSearchParams("token_hash=one-time-token&type=signup"),
      ),
    ).toEqual({
      kind: "token_hash",
      tokenHash: "one-time-token",
      type: "signup",
    });
  });

  it("rejects an unsupported email callback type", () => {
    expect(
      getEmailCallbackVerification(
        new URLSearchParams("token_hash=one-time-token&type=unknown"),
      ),
    ).toBeNull();
  });
});
