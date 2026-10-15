import { describe, expect, it } from "vitest";
import {
  COMMUNICATION_REHAB_CONTRACT_VERSION,
  communicationSessionCreateSchema,
  communicationSessionResponseSchema,
} from "./communication-rehab.contract";
import {
  getCommunicationRehabNavigationItem,
  isCommunicationRehabEnabled,
} from "./communication-rehab.flags";
import { communicationSessionFormSchema } from "./communication-form.schema";
import { createCommunicationSessionFixture } from "./server/communication-fixture";

const validSession = {
  requestId: "893ad3b9-f7bd-4d70-975c-0c232c1a19fe",
  sessionDate: "2026-10-16T03:30:00.000Z",
  activityType: "phrase_cards" as const,
  completed: true as const,
  notes: "Digunakan dengan bantuan pendamping.",
  source: "self_report" as const,
  contractVersion: COMMUNICATION_REHAB_CONTRACT_VERSION,
  confirmation: true as const,
};

describe("F09 feature flag", () => {
  it("removes the unfinished route from navigation by default", () => {
    expect(isCommunicationRehabEnabled(undefined)).toBe(false);
    expect(getCommunicationRehabNavigationItem(undefined)).toBeNull();
    expect(isCommunicationRehabEnabled("false")).toBe(false);
  });

  it("exposes the navigation item only after explicit activation", () => {
    expect(getCommunicationRehabNavigationItem(" TRUE ")).toEqual({
      href: "/app/recovery/communication",
      label: "Kartu komunikasi",
    });
  });
});

describe("F09 session boundary", () => {
  it("accepts the proposed minimal nonmedical session metadata", () => {
    expect(communicationSessionCreateSchema.parse(validSession)).toEqual(validSession);
  });

  it.each(["userId", "transcript", "audioRecording", "score", "diagnosis"])(
    "rejects the forbidden or unapproved field %s",
    (field) => {
      expect(communicationSessionCreateSchema.safeParse({ ...validSession, [field]: "not-allowed" }).success).toBe(false);
    },
  );

  it("requires explicit confirmation and bounds notes", () => {
    expect(communicationSessionFormSchema.safeParse({ notes: "", confirmation: false }).success).toBe(false);
    expect(communicationSessionFormSchema.safeParse({ notes: "x".repeat(501), confirmation: true }).success).toBe(false);
  });

  it("labels development completion as simulated instead of saved", () => {
    const response = createCommunicationSessionFixture(validSession, new Date("2026-10-16T04:00:00.000Z"));
    expect(communicationSessionResponseSchema.parse(response)).toEqual(response);
    expect(response.data.status).toBe("simulated");
    expect(response.meta.demo).toBe(true);
    expect(JSON.stringify(response)).not.toContain("transcript");
    expect(JSON.stringify(response)).not.toContain("audio");
  });
});
