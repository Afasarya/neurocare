import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const numericString = z
  .string()
  .trim()
  .max(8)
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0);

export const screeningServerSchema = z
  .object({
    emergencySymptoms: z.enum(["yes", "no"]),
    pathway: z.literal("neuroprevent"),
    dateOfBirth: dateString,
    sexForChart: z.enum(["female", "male", "unknown"]),
    priorCvd: z.enum(["yes", "no", "unknown"]),
    smokingStatus: z.enum(["yes", "no", "unknown"]),
    systolicBpStatus: z.enum(["known", "unknown"]),
    systolicBpMmHg: numericString.nullable(),
    systolicBpMeasuredAt: dateString.nullable(),
    heightStatus: z.enum(["known", "unknown"]),
    heightCm: numericString.nullable(),
    weightStatus: z.enum(["known", "unknown"]),
    weightKg: numericString.nullable(),
    consentToAnalyze: z.literal(true),
    requestId: z.string().uuid(),
  })
  .strict()
  .superRefine((data, context) => {
    const today = new Date();
    const dateOfBirth = new Date(`${data.dateOfBirth}T00:00:00Z`);
    if (!Number.isFinite(dateOfBirth.getTime()) || dateOfBirth > today) {
      context.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Invalid date" });
    }
    if (data.systolicBpStatus === "known" && (!data.systolicBpMmHg || !data.systolicBpMeasuredAt)) {
      context.addIssue({ code: "custom", path: ["systolicBpMmHg"], message: "Measured BP value and date are required" });
    }
    if (data.systolicBpStatus === "unknown" && (data.systolicBpMmHg !== null || data.systolicBpMeasuredAt !== null)) {
      context.addIssue({ code: "custom", path: ["systolicBpStatus"], message: "Unknown BP must not include a value" });
    }
    if (data.heightStatus === "known" && !data.heightCm) {
      context.addIssue({ code: "custom", path: ["heightCm"], message: "Height is required when known" });
    }
    if (data.heightStatus === "unknown" && data.heightCm !== null) {
      context.addIssue({ code: "custom", path: ["heightCm"], message: "Unknown height must not include a value" });
    }
    if (data.weightStatus === "known" && !data.weightKg) {
      context.addIssue({ code: "custom", path: ["weightKg"], message: "Weight is required when known" });
    }
    if (data.weightStatus === "unknown" && data.weightKg !== null) {
      context.addIssue({ code: "custom", path: ["weightKg"], message: "Unknown weight must not include a value" });
    }
  });

export type ScreeningServerInput = z.infer<typeof screeningServerSchema>;
