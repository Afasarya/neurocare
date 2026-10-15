import { z } from "zod";

export const measurementFormSchema = z.object({
  type: z.enum(["blood_pressure", "weight", "height"]),
  primaryValue: z.string().trim().min(1, "Nilai wajib diisi.").regex(/^\d+(?:[.,]\d+)?$/, "Gunakan angka positif."),
  secondaryValue: z.string().trim(),
  measuredAt: z.string().min(1, "Waktu pengukuran wajib diisi."),
  confirmation: z.boolean().refine((value) => value, "Konfirmasikan bahwa nilai ini adalah laporan pengguna."),
}).superRefine((value, context) => {
  if (value.type === "blood_pressure" && !/^\d+$/.test(value.primaryValue)) context.addIssue({ code: "custom", path: ["primaryValue"], message: "Sistolik harus berupa bilangan bulat positif." });
  if (value.type === "blood_pressure" && !/^\d+$/.test(value.secondaryValue)) context.addIssue({ code: "custom", path: ["secondaryValue"], message: "Diastolik harus berupa bilangan bulat positif." });
  const primary = Number(value.primaryValue.replace(",", "."));
  const secondary = Number(value.secondaryValue.replace(",", "."));
  if (!Number.isFinite(primary) || primary <= 0 || primary > 9_999) context.addIssue({ code: "custom", path: ["primaryValue"], message: "Nilai berada di luar batas penyimpanan teknis." });
  if (value.type === "blood_pressure" && (!Number.isFinite(secondary) || secondary <= 0 || secondary > 999)) context.addIssue({ code: "custom", path: ["secondaryValue"], message: "Nilai berada di luar batas penyimpanan teknis." });
  const measured = Date.parse(value.measuredAt);
  if (!Number.isFinite(measured)) context.addIssue({ code: "custom", path: ["measuredAt"], message: "Waktu pengukuran tidak valid." });
  if (Number.isFinite(measured) && measured > Date.now()) context.addIssue({ code: "custom", path: ["measuredAt"], message: "Waktu pengukuran tidak boleh di masa depan." });
});

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;
