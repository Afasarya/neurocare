import type {
  CaregiverInvitationRequest,
  CaregiverInvitationResponse,
  ReminderPreferenceCreate,
  ReminderPreferenceResponse,
} from "../caregiver.contract";

export const SYNTHETIC_CAREGIVER_INVITATION_ID = "f3d8f902-1de6-4f8c-82d0-ffcf17afb965";

export function maskInvitationEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

/** Development-only. A simulated invitation never creates data access. */
export function createCaregiverInvitationFixture(
  input: CaregiverInvitationRequest,
  now = new Date(),
): CaregiverInvitationResponse {
  const invitation = input.action === "invite"
    ? {
        id: SYNTHETIC_CAREGIVER_INVITATION_ID,
        recipientHint: maskInvitationEmail(input.recipientEmail),
        scopes: input.scopes,
        state: "pending_verification" as const,
        hasDataAccess: false as const,
      }
    : {
        id: input.invitationId,
        recipientHint: "p***@example.invalid",
        scopes: [] as [],
        state: "revoked" as const,
        hasDataAccess: false as const,
      };

  return {
    data: {
      status: "simulated",
      operation: input.action,
      message: input.action === "invite"
        ? "Undangan simulasi dibuat. Penerima belum memiliki akses data apa pun."
        : "Undangan simulasi dicabut. Tidak ada akses data yang aktif.",
      invitation,
    },
    meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: true },
  };
}

/** Development-only. No reminder is scheduled or delivered. */
export function createReminderPreferenceFixture(
  input: ReminderPreferenceCreate,
  now = new Date(),
): ReminderPreferenceResponse {
  return {
    data: {
      status: "simulated",
      scheduled: false,
      notificationPreview: "Anda memiliki pengingat NeuroCare.",
      message: input.enabled
        ? "Preferensi simulasi diperbarui. Belum ada pengingat yang dijadwalkan atau dikirim."
        : "Preferensi simulasi dinonaktifkan. Belum ada pengingat yang dijadwalkan atau dikirim.",
    },
    meta: { requestId: input.requestId, generatedAt: now.toISOString(), demo: true },
  };
}
