import { z } from "zod";

export const recoveryFormSchema = z
  .object({
    emergencySymptoms: z.enum(["yes", "no"], { error: "Pilih jawaban sebelum melanjutkan." }),
    source: z.enum(["self_report", "assisted"], { error: "Pilih siapa yang mengisi check-in." }),
    assistanceNote: z.string().trim().max(280, "Catatan maksimal 280 karakter."),
    dailyActivity: z.enum(["completed", "completed_with_assistance", "not_completed", "unknown"], { error: "Pilih jawaban atau Tidak tahu." }),
    perceivedLimitation: z.enum(["not_reported", "some_limitation", "major_limitation", "unknown"], { error: "Pilih jawaban atau Tidak tahu." }),
    newConcerns: z.enum(["yes", "no", "unknown"], { error: "Pilih jawaban atau Tidak tahu." }),
    practiceFrequency: z.enum(["not_practiced", "once", "more_than_once", "unknown"], { error: "Pilih jawaban atau Tidak tahu." }),
    responseNote: z.string().trim().max(280, "Catatan maksimal 280 karakter."),
    confirmation: z.boolean().refine((value) => value, "Konfirmasi diperlukan sebelum mengirim."),
  })
  .superRefine((value, context) => {
    if (value.source === "assisted" && !value.assistanceNote) {
      context.addIssue({ code: "custom", path: ["assistanceNote"], message: "Jelaskan bantuan secara singkat." });
    }
  });

export type RecoveryFormValues = z.infer<typeof recoveryFormSchema>;

