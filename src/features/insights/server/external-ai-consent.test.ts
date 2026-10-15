import { describe, expect, it, vi } from "vitest";
import { hasActiveExternalAiConsent } from "./external-ai-consent";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient<Database>;

describe("external-ai-consent", () => {
  const userId = "user-consent-123";

  it("returns true when latest consent event is granted", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { action: "granted" },
      error: null,
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder2 = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEqPurpose = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqPurpose });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const hasConsent = await hasActiveExternalAiConsent(mockSupabase, userId);
    expect(hasConsent).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("consents");
    expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
    expect(mockEqPurpose).toHaveBeenCalledWith("purpose", "external_ai");
  });

  it("returns false when latest consent event is withdrawn", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { action: "withdrawn" },
      error: null,
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder2 = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEqPurpose = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqPurpose });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const hasConsent = await hasActiveExternalAiConsent(mockSupabase, userId);
    expect(hasConsent).toBe(false);
  });

  it("fails closed (returns false) when consent query returns an error", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST205", message: "Table not found" },
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder2 = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEqPurpose = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqPurpose });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const hasConsent = await hasActiveExternalAiConsent(mockSupabase, userId);
    expect(hasConsent).toBe(false);
  });

  it("fails closed (returns false) when no consent event exists", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder2 = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEqPurpose = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqPurpose });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const hasConsent = await hasActiveExternalAiConsent(mockSupabase, userId);
    expect(hasConsent).toBe(false);
  });
});
