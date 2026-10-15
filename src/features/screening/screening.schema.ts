import { z } from "zod";

const dateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Gunakan format tanggal yang valid.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date <= new Date();
  }, "Tanggal tidak boleh berada di masa depan.");

const optionalPositiveDecimal = z
  .string()
  .trim()
  .max(8, "Nilai terlalu panjang.")
  .refine(
    (value) => value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0),
    "Masukkan angka lebih besar dari nol.",
  );

export const screeningClientSchema = z
  .object({
    emergencySymptoms: z.enum(["yes", "no"], {
      message: "Pilih jawaban sebelum melanjutkan.",
    }),
    pathway: z.literal("neuroprevent"),
    dateOfBirth: dateInput,
    sexForChart: z.enum(["female", "male", "unknown"], {
      message: "Pilih nilai yang tersedia pada dokumen kesehatan Anda.",
    }),
    priorCvd: z.enum(["yes", "no", "unknown"]),
    smokingStatus: z.enum(["yes", "no", "unknown"]),
    systolicBpStatus: z.enum(["known", "unknown"]),
    systolicBpMmHg: optionalPositiveDecimal,
    systolicBpMeasuredAt: z.string(),
    heightStatus: z.enum(["known", "unknown"]),
    heightCm: optionalPositiveDecimal,
    weightStatus: z.enum(["known", "unknown"]),
    weightKg: optionalPositiveDecimal,
    consentToAnalyze: z.boolean().refine((value) => value, {
      message: "Persetujuan diperlukan untuk mengirim data ke layanan analisis.",
    }),
  })
  .superRefine((data, context) => {
    if (data.systolicBpStatus === "known") {
      if (!data.systolicBpMmHg) {
        context.addIssue({
          code: "custom",
          path: ["systolicBpMmHg"],
          message: "Masukkan hasil tekanan darah sistolik dalam mmHg.",
        });
      }
      if (!data.systolicBpMeasuredAt) {
        context.addIssue({
          code: "custom",
          path: ["systolicBpMeasuredAt"],
          message: "Masukkan tanggal pengukuran tekanan darah.",
        });
      }
    }
    if (data.heightStatus === "known" && !data.heightCm) {
      context.addIssue({
        code: "custom",
        path: ["heightCm"],
        message: "Masukkan tinggi badan dalam sentimeter.",
      });
    }
    if (data.weightStatus === "known" && !data.weightKg) {
      context.addIssue({
        code: "custom",
        path: ["weightKg"],
        message: "Masukkan berat badan dalam kilogram.",
      });
    }
  });

export type ScreeningFormValues = z.input<typeof screeningClientSchema>;
