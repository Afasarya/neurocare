import { describe, expect, it } from "vitest";
import {
  CAREGIVER_CONTRACT_VERSION,
  caregiverInvitationRequestSchema,
  caregiverInvitationResponseSchema,
  reminderPreferenceCreateSchema,
  reminderPreferenceResponseSchema,
} from "./caregiver.contract";
import { caregiverInviteFormSchema, reminderPreferenceFormSchema } from "./caregiver.forms";
import { getCaregiverNavigationItem, isCaregiverFeatureEnabled } from "./caregiver.flags";
import {
  SYNTHETIC_CAREGIVER_INVITATION_ID,
  createCaregiverInvitationFixture,
  createReminderPreferenceFixture,
  maskInvitationEmail,
} from "./server/caregiver-fixture";

const inviteRequest = {
  action: "invite" as const,
  requestId: "d3319f70-9a19-4641-acb1-8f69341cdd1d",
  recipientEmail: "pendamping@example.invalid",
  scopes: ["action_status_summary" as const],
  consentConfirmed: true as const,
  contractVersion: CAREGIVER_CONTRACT_VERSION,
};

const reminderRequest = {
  requestId: "604e90f1-8a19-4303-b735-16b25283d738",
  reminderType: "checkin" as const,
  localTime: "09:00",
  timezone: "Asia/Jakarta" as const,
  channel: "in_app" as const,
  quietHours: { enabled: true, start: "21:00", end: "07:00" },
  enabled: true,
  confirmation: true as const,
  contractVersion: CAREGIVER_CONTRACT_VERSION,
};

describe("F11 feature flag", () => {
  it("keeps caregiver access paths out of navigation by default", () => {
    expect(isCaregiverFeatureEnabled(undefined)).toBe(false);
    expect(getCaregiverNavigationItem(undefined)).toBeNull();
  });

  it("exposes navigation only after explicit activation", () => {
    expect(getCaregiverNavigationItem(" TRUE ")).toEqual({ href: "/app/caregiver", label: "Caregiver & pengingat" });
  });
});

describe("F11 invitation boundary", () => {
  it("accepts a least-privilege invitation request", () => {
    expect(caregiverInvitationRequestSchema.parse(inviteRequest)).toEqual(inviteRequest);
  });

  it.each(["ownerId", "userId", "recipientUserId", "healthData", "diagnosis", "broadAccess"])(
    "rejects browser-supplied or sensitive field %s",
    (field) => {
      expect(caregiverInvitationRequestSchema.safeParse({ ...inviteRequest, [field]: "not-allowed" }).success).toBe(false);
    },
  );

  it("requires a limited scope and explicit acknowledgement", () => {
    expect(caregiverInviteFormSchema.safeParse({ recipientEmail: "care@example.invalid", scopes: [], confirmation: true }).success).toBe(false);
    expect(caregiverInviteFormSchema.safeParse({ recipientEmail: "care@example.invalid", scopes: ["action_status_summary"], confirmation: false }).success).toBe(false);
  });

  it("masks the recipient and never grants access in the development fixture", () => {
    const response = createCaregiverInvitationFixture(inviteRequest, new Date("2026-10-16T07:00:00.000Z"));
    expect(caregiverInvitationResponseSchema.parse(response)).toEqual(response);
    if (response.data.status !== "simulated") throw new Error("Expected simulated response");
    expect(response.data.invitation.recipientHint).toBe("p***@example.invalid");
    expect(response.data.invitation.recipientHint).not.toBe(inviteRequest.recipientEmail);
    expect(response.data.invitation.hasDataAccess).toBe(false);
    expect(response.data.invitation.state).toBe("pending_verification");
  });

  it("keeps access off after explicit revoke", () => {
    const response = createCaregiverInvitationFixture({
      action: "revoke",
      requestId: inviteRequest.requestId,
      invitationId: SYNTHETIC_CAREGIVER_INVITATION_ID,
      confirmation: true,
      contractVersion: CAREGIVER_CONTRACT_VERSION,
    });
    if (response.data.status !== "simulated") throw new Error("Expected simulated response");
    expect(response.data.operation).toBe("revoke");
    expect(response.data.invitation.state).toBe("revoked");
    expect(response.data.invitation.hasDataAccess).toBe(false);
  });

  it("does not reveal short local parts while masking email", () => {
    expect(maskInvitationEmail("a@example.invalid")).toBe("a***@example.invalid");
  });
});

describe("F11 reminder boundary", () => {
  it("accepts generic in-app preferences including overnight quiet hours", () => {
    expect(reminderPreferenceCreateSchema.parse(reminderRequest)).toEqual(reminderRequest);
  });

  it.each(["email", "push", "sms"])("rejects unapproved delivery channel %s", (channel) => {
    expect(reminderPreferenceCreateSchema.safeParse({ ...reminderRequest, channel }).success).toBe(false);
  });

  it.each(["diagnosis", "healthResult", "notificationBody", "recipientEmail"])(
    "rejects sensitive or caller-controlled notification field %s",
    (field) => {
      expect(reminderPreferenceCreateSchema.safeParse({ ...reminderRequest, [field]: "private detail" }).success).toBe(false);
    },
  );

  it("validates time fields and explicit simulation acknowledgement", () => {
    expect(reminderPreferenceFormSchema.safeParse({
      reminderType: "checkin",
      localTime: "25:99",
      quietHoursEnabled: true,
      quietHoursStart: "21:00",
      quietHoursEnd: "07:00",
      enabled: true,
      confirmation: true,
    }).success).toBe(false);
    expect(reminderPreferenceFormSchema.safeParse({
      reminderType: "checkin",
      localTime: "09:00",
      quietHoursEnabled: true,
      quietHoursStart: "21:00",
      quietHoursEnd: "07:00",
      enabled: true,
      confirmation: false,
    }).success).toBe(false);
  });

  it("uses generic copy and never claims a delivery was scheduled", () => {
    const response = createReminderPreferenceFixture(reminderRequest, new Date("2026-10-16T07:00:00.000Z"));
    expect(reminderPreferenceResponseSchema.parse(response)).toEqual(response);
    if (response.data.status !== "simulated") throw new Error("Expected simulated response");
    expect(response.data.notificationPreview).toBe("Anda memiliki pengingat NeuroCare.");
    expect(response.data.scheduled).toBe(false);
    expect(JSON.stringify(response)).not.toContain("diagnosis");
  });

  it("supports opt-out without scheduling a delivery", () => {
    const response = createReminderPreferenceFixture({ ...reminderRequest, enabled: false });
    if (response.data.status !== "simulated") throw new Error("Expected simulated response");
    expect(response.data.scheduled).toBe(false);
    expect(response.data.message).toContain("dinonaktifkan");
  });
});
