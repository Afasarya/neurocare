import { z } from "zod";

export const timelineEventKindSchema = z.enum([
  "screening",
  "measurement",
  "pulse_measurement",
  "recovery_checkin",
  "recovery_activity",
  "action_item",
]);

export const timelinePathwaySchema = z.enum(["neuroprevent", "neurorecovery", "shared"]);

const eventDetailSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(120),
  unit: z.enum(["mmHg", "kg", "cm", "bpm", "seconds", "repetitions"]).nullable(),
}).strict();

export const timelineEventSchema = z.object({
  id: z.string().min(1).max(140),
  occurredAt: z.string().datetime(),
  kind: timelineEventKindSchema,
  pathway: timelinePathwaySchema,
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  details: z.array(eventDetailSchema).max(8),
  source: z.object({
    label: z.string().min(1).max(120),
    provenance: z.enum(["user_reported", "verified_engine", "demo_fixture", "database"]),
    referenceId: z.string().min(1).max(120).nullable(),
  }).strict(),
}).strict();

const measurementBaseSchema = z.object({
  requestId: z.string().uuid(),
  measuredAt: z.string().datetime(),
  source: z.literal("user_reported"),
  confirmation: z.literal(true),
});

export const healthMeasurementCreateSchema = z.discriminatedUnion("type", [
  measurementBaseSchema.extend({
    type: z.literal("blood_pressure"),
    systolic: z.number().int().positive().max(999),
    diastolic: z.number().int().positive().max(999),
    unit: z.literal("mmHg"),
  }).strict(),
  measurementBaseSchema.extend({
    type: z.literal("weight"),
    value: z.number().positive().max(9_999),
    unit: z.literal("kg"),
  }).strict(),
  measurementBaseSchema.extend({
    type: z.literal("height"),
    value: z.number().positive().max(9_999),
    unit: z.literal("cm"),
  }).strict(),
]);

export const healthMeasurementSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().uuid(), type: z.literal("blood_pressure"), measuredAt: z.string().datetime(), systolic: z.number().int().positive(), diastolic: z.number().int().positive(), unit: z.literal("mmHg"), source: z.literal("user_reported"), provenance: z.enum(["demo_fixture", "database"]),
  }).strict(),
  z.object({
    id: z.string().uuid(), type: z.literal("weight"), measuredAt: z.string().datetime(), value: z.number().positive(), unit: z.literal("kg"), source: z.literal("user_reported"), provenance: z.enum(["demo_fixture", "database"]),
  }).strict(),
  z.object({
    id: z.string().uuid(), type: z.literal("height"), measuredAt: z.string().datetime(), value: z.number().positive(), unit: z.literal("cm"), source: z.literal("user_reported"), provenance: z.enum(["demo_fixture", "database"]),
  }).strict(),
]);

export const actionItemSchema = z.object({
  id: z.string().uuid(),
  dedupeKey: z.string().min(1).max(160),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  status: z.enum(["pending", "completed"]),
  pathway: timelinePathwaySchema,
  dueAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  source: z.object({
    kind: z.enum(["screening_gap", "recovery_checkin", "recovery_progress", "user_created"]),
    label: z.string().min(1).max(120),
    referenceId: z.string().min(1).max(120).nullable(),
  }).strict(),
  provenance: z.enum(["demo_fixture", "database"]),
  updatedAt: z.string().datetime(),
}).strict().superRefine((value, context) => {
  if (value.status === "completed" && !value.completedAt) context.addIssue({ code: "custom", path: ["completedAt"], message: "Waktu selesai diperlukan." });
  if (value.status === "pending" && value.completedAt) context.addIssue({ code: "custom", path: ["completedAt"], message: "Aksi belum selesai tidak memiliki waktu selesai." });
});

export const actionItemUpdateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["pending", "completed"]),
}).strict();

const recordMetaSchema = z.object({
  requestId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  timezone: z.literal("Asia/Jakarta"),
  demo: z.boolean(),
}).strict();

export const timelineResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("ok"), events: z.array(timelineEventSchema).max(200), lastUpdatedAt: z.string().datetime() }).strict(),
    z.object({ status: z.literal("empty"), message: z.string().min(1).max(300) }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["schema_not_approved", "storage_not_configured", "service_error"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: recordMetaSchema,
}).strict();

export const actionItemsResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("ok"), items: z.array(actionItemSchema).max(100), lastUpdatedAt: z.string().datetime() }).strict(),
    z.object({ status: z.literal("empty"), message: z.string().min(1).max(300) }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["schema_not_approved", "storage_not_configured", "service_error"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: recordMetaSchema,
}).strict();

export const measurementCreateResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("saved"), measurement: healthMeasurementSchema }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["schema_not_approved", "storage_not_configured", "service_error"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: recordMetaSchema,
}).strict();

export const actionItemUpdateResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({ status: z.literal("saved"), item: actionItemSchema }).strict(),
    z.object({ status: z.literal("unavailable"), reason: z.enum(["schema_not_approved", "storage_not_configured", "service_error", "not_found"]), retryable: z.boolean(), message: z.string().min(1).max(300) }).strict(),
  ]),
  meta: recordMetaSchema,
}).strict();

export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type TimelineEventKind = z.infer<typeof timelineEventKindSchema>;
export type HealthMeasurementCreate = z.infer<typeof healthMeasurementCreateSchema>;
export type HealthMeasurement = z.infer<typeof healthMeasurementSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type ActionItemUpdate = z.infer<typeof actionItemUpdateSchema>;
export type TimelineResponse = z.infer<typeof timelineResponseSchema>;
export type ActionItemsResponse = z.infer<typeof actionItemsResponseSchema>;
export type MeasurementCreateResponse = z.infer<typeof measurementCreateResponseSchema>;
export type ActionItemUpdateResponse = z.infer<typeof actionItemUpdateResponseSchema>;
