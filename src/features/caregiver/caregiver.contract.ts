import { z } from "zod";

export const CAREGIVER_CONTRACT_VERSION = "f11-draft-v1" as const;
export const CAREGIVER_DEMO_HEADER = "caregiver-fixture-v1" as const;

export const caregiverScopeSchema = z.enum(["action_status_summary", "checkin_schedule_summary"]);

export const caregiverInvitationCreateSchema = z
  .object({
    action: z.literal("invite"),
    requestId: z.string().uuid(),
    recipientEmail: z.string().trim().email().max(254),
    scopes: z.array(caregiverScopeSchema).min(1).max(2),
    consentConfirmed: z.literal(true),
    contractVersion: z.literal(CAREGIVER_CONTRACT_VERSION),
  })
  .strict();

export const caregiverInvitationRevokeSchema = z
  .object({
    action: z.literal("revoke"),
    requestId: z.string().uuid(),
    invitationId: z.string().uuid(),
    confirmation: z.literal(true),
    contractVersion: z.literal(CAREGIVER_CONTRACT_VERSION),
  })
  .strict();

export const caregiverInvitationRequestSchema = z.discriminatedUnion("action", [
  caregiverInvitationCreateSchema,
  caregiverInvitationRevokeSchema,
]);

const caregiverMetaSchema = z
  .object({ requestId: z.string().uuid(), generatedAt: z.string().datetime(), demo: z.boolean() })
  .strict();

const caregiverInvitationSummarySchema = z
  .object({
    id: z.string().uuid(),
    recipientHint: z.string().min(3).max(254),
    scopes: z.array(caregiverScopeSchema).max(2),
    state: z.enum(["pending_verification", "revoked"]),
    hasDataAccess: z.literal(false),
  })
  .strict();

export const caregiverInvitationResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z
        .object({
          status: z.literal("simulated"),
          operation: z.enum(["invite", "revoke"]),
          message: z.string().min(1).max(300),
          invitation: caregiverInvitationSummarySchema,
        })
        .strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum(["policy_pending", "schema_not_configured"]),
          retryable: z.boolean(),
          message: z.string().min(1).max(300),
        })
        .strict(),
    ]),
    meta: caregiverMetaSchema,
  })
  .strict();

const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Gunakan format waktu HH:mm.");

export const reminderPreferenceCreateSchema = z
  .object({
    requestId: z.string().uuid(),
    reminderType: z.enum(["checkin", "follow_up", "action_review"]),
    localTime: localTimeSchema,
    timezone: z.literal("Asia/Jakarta"),
    channel: z.literal("in_app"),
    quietHours: z
      .object({ enabled: z.boolean(), start: localTimeSchema, end: localTimeSchema })
      .strict(),
    enabled: z.boolean(),
    confirmation: z.literal(true),
    contractVersion: z.literal(CAREGIVER_CONTRACT_VERSION),
  })
  .strict();

export const reminderPreferenceResponseSchema = z
  .object({
    data: z.discriminatedUnion("status", [
      z
        .object({
          status: z.literal("simulated"),
          scheduled: z.literal(false),
          notificationPreview: z.literal("Anda memiliki pengingat NeuroCare."),
          message: z.string().min(1).max(300),
        })
        .strict(),
      z
        .object({
          status: z.literal("unavailable"),
          reason: z.enum(["provider_not_approved", "schema_not_configured"]),
          retryable: z.boolean(),
          message: z.string().min(1).max(300),
        })
        .strict(),
    ]),
    meta: caregiverMetaSchema,
  })
  .strict();

export type CaregiverScope = z.infer<typeof caregiverScopeSchema>;
export type CaregiverInvitationRequest = z.infer<typeof caregiverInvitationRequestSchema>;
export type CaregiverInvitationResponse = z.infer<typeof caregiverInvitationResponseSchema>;
export type ReminderPreferenceCreate = z.infer<typeof reminderPreferenceCreateSchema>;
export type ReminderPreferenceResponse = z.infer<typeof reminderPreferenceResponseSchema>;
