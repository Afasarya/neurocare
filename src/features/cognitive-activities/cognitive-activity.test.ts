import { describe, expect, it } from "vitest";
import {
  COGNITIVE_ACTIVITY_CONTRACT_VERSION,
  cognitiveActivitySessionCreateSchema,
  cognitiveActivitySessionResponseSchema,
} from "./cognitive-activity.contract";
import {
  getCognitiveActivityNavigationItem,
  isCognitiveActivityEnabled,
} from "./cognitive-activity.flags";
import {
  createCognitiveActivityState,
  createCognitiveDeck,
  dismissCognitiveMismatch,
  isCognitiveActivityComplete,
  selectCognitiveCard,
} from "./cognitive-activity.logic";
import { createCognitiveActivityFixture } from "./server/cognitive-activity-fixture";

const validSession = {
  requestId: "88aab4c7-610c-4ef2-aed6-7b27d15dc834",
  startedAt: "2026-10-16T05:00:00.000Z",
  endedAt: "2026-10-16T05:05:00.000Z",
  activityType: "symbol_matching" as const,
  completed: true,
  endedReason: "completed" as const,
  source: "self_report" as const,
  contractVersion: COGNITIVE_ACTIVITY_CONTRACT_VERSION,
  confirmation: true as const,
};

describe("F10 feature flag", () => {
  it("hides the route from MVP navigation by default", () => {
    expect(isCognitiveActivityEnabled(undefined)).toBe(false);
    expect(getCognitiveActivityNavigationItem(undefined)).toBeNull();
  });

  it("exposes navigation only after explicit activation", () => {
    expect(getCognitiveActivityNavigationItem(" TRUE ")).toEqual({
      href: "/app/recovery/cognitive-activity",
      label: "Aktivitas kognitif",
    });
  });
});

describe("F10 low-stress matching interaction", () => {
  it("creates only the selected number of symbol pairs", () => {
    expect(createCognitiveDeck(2)).toHaveLength(4);
    expect(createCognitiveDeck(3)).toHaveLength(6);
  });

  it("marks equal symbols as a pair without recording attempts or scores", () => {
    const deck = createCognitiveDeck(2);
    const first = selectCognitiveCard(createCognitiveActivityState(), deck[0], deck);
    const matched = selectCognitiveCard(first, deck[2], deck);
    expect(matched).toEqual({ openCardIds: [], matchedPairIds: ["leaf"], mismatchPending: false });
    expect(matched).not.toHaveProperty("score");
    expect(matched).not.toHaveProperty("attempts");
  });

  it("keeps a mismatch visible until the user chooses to continue", () => {
    const deck = createCognitiveDeck(2);
    const first = selectCognitiveCard(createCognitiveActivityState(), deck[0], deck);
    const mismatch = selectCognitiveCard(first, deck[1], deck);
    expect(mismatch.mismatchPending).toBe(true);
    expect(mismatch.openCardIds).toEqual([deck[0].id, deck[1].id]);
    expect(dismissCognitiveMismatch(mismatch).openCardIds).toEqual([]);
  });

  it("recognizes completion without producing a performance grade", () => {
    const state = { openCardIds: [], matchedPairIds: ["leaf", "cup"] as const, mismatchPending: false };
    expect(isCognitiveActivityComplete({ ...state, matchedPairIds: [...state.matchedPairIds] }, 2)).toBe(true);
  });
});

describe("F10 session boundary", () => {
  it("accepts only minimal usage metadata", () => {
    expect(cognitiveActivitySessionCreateSchema.parse(validSession)).toEqual(validSession);
  });

  it.each(["userId", "score", "accuracy", "attempts", "reactionTime", "diagnosis"])(
    "rejects the forbidden or unapproved field %s",
    (field) => {
      expect(cognitiveActivitySessionCreateSchema.safeParse({ ...validSession, [field]: 1 }).success).toBe(false);
    },
  );

  it("accepts a stopped session without treating it as failure", () => {
    expect(cognitiveActivitySessionCreateSchema.safeParse({ ...validSession, completed: false, endedReason: "stopped" }).success).toBe(true);
  });

  it("rejects inconsistent completion and invalid timestamps", () => {
    expect(cognitiveActivitySessionCreateSchema.safeParse({ ...validSession, completed: false }).success).toBe(false);
    expect(cognitiveActivitySessionCreateSchema.safeParse({ ...validSession, endedAt: "2026-10-16T04:00:00.000Z" }).success).toBe(false);
  });

  it("labels development completion as simulated, never saved", () => {
    const response = createCognitiveActivityFixture(validSession, new Date("2026-10-16T06:00:00.000Z"));
    expect(cognitiveActivitySessionResponseSchema.parse(response)).toEqual(response);
    expect(response.data.status).toBe("simulated");
    expect(response.meta.demo).toBe(true);
    expect(JSON.stringify(response)).not.toContain("score");
  });
});
