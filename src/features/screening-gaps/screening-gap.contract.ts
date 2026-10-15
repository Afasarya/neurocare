import { z } from "zod";

export const gapTypeSchema = z.enum([
  "unknown_measurement",
  "checkup_due",
  "possible_follow_up",
  "completed",
]);

export const gapStatusSchema = z.enum(["open", "pending", "completed"]);

export const screeningGapSchema = z.object({
  id: z.string().min(1),
  type: gapTypeSchema,
  status: gapStatusSchema,
  title: z.string().min(1),
  reason: z.string().min(1),
  relatedMeasurement: z.enum([
    "systolic_blood_pressure",
    "height",
    "weight",
    "smoking_status",
    "other",
  ]),
  supportingFact: z.object({
    label: z.string().min(1),
    recordedAt: z.string().datetime().nullable(),
  }),
  source: z.object({
    kind: z.enum([
      "screening_session",
      "health_measurement",
      "rules_engine",
      "demo_fixture",
    ]),
    label: z.string().min(1),
    version: z.string().min(1),
    referenceId: z.string().min(1).nullable(),
  }),
  applicability: z.enum(["applicable", "not_applicable", "unknown"]),
  stale: z.boolean(),
  nextActions: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum(["record_measurement", "view_history", "add_action_plan"]),
      label: z.string().min(1),
      href: z.string().startsWith("/").nullable(),
      enabled: z.boolean(),
    }),
  ),
});

const responseMetaSchema = z.object({
  requestId: z.string().min(1),
  generatedAt: z.string().datetime(),
  demo: z.boolean(),
});

export const screeningGapsResponseSchema = z.object({
  data: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("ok"),
      gaps: z.array(screeningGapSchema),
      evaluatedAt: z.string().datetime(),
      ruleSource: z.object({
        label: z.string().min(1),
        version: z.string().min(1),
      }),
    }),
    z.object({
      status: z.literal("empty"),
      message: z.string().min(1),
    }),
    z.object({
      status: z.literal("unavailable"),
      reason: z.enum([
        "rules_not_configured",
        "source_data_unavailable",
        "timeout",
        "invalid_response",
        "service_error",
      ]),
      retryable: z.boolean(),
      message: z.string().min(1),
    }),
  ]),
  meta: responseMetaSchema,
});

export type ScreeningGap = z.infer<typeof screeningGapSchema>;
export type ScreeningGapsResponse = z.infer<typeof screeningGapsResponseSchema>;
export type GapDemoScenario =
  | "unknown-bp"
  | "empty"
  | "completed"
  | "pending"
  | "unavailable";
