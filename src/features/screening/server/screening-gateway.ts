import { z } from "zod";
import {
  gatewayRiskCategorySchema,
  gatewayRiskLevelSchema,
  type ScreeningAnalyzeResponse,
} from "@/features/screening/screening.contract";
import type { ScreeningServerInput } from "@/features/screening/screening.server-schema";

export const screeningGatewayRequestSchema = z
  .object({
    patientAgeYears: z.number().int().min(40).max(59),
    gender: z.enum(["MALE", "FEMALE"]),
    systolicBloodPressureMmHg: z.number().int().positive(),
    isCurrentSmoker: z.boolean(),
    weightKg: z.number().positive().nullable(),
    heightCm: z.number().positive().nullable(),
    bodyMassIndex: z.number().positive().nullable(),
    hasDiabetes: z.boolean().nullable(),
    totalCholesterolMmolL: z.number().positive().nullable(),
  })
  .strict();

const binBreakdownSchema = z
  .object({
    ageBin: z.enum(["BIN_AGE_40_44", "BIN_AGE_45_49", "BIN_AGE_50_54", "BIN_AGE_55_59"]),
    sbpBin: z.enum(["BIN_SBP_UNDER_120", "BIN_SBP_120_139", "BIN_SBP_140_159", "BIN_SBP_160_179", "BIN_SBP_180_ABOVE"]),
    bmiBin: z.enum(["BIN_BMI_UNDER_20", "BIN_BMI_20_TO_24", "BIN_BMI_25_TO_29", "BIN_BMI_30_TO_34", "BIN_BMI_35_ABOVE"]).nullable(),
    cholesterolBin: z.enum(["BIN_CHOL_UNDER_4", "BIN_CHOL_4_TO_4_9", "BIN_CHOL_5_TO_5_9", "BIN_CHOL_6_TO_6_9", "BIN_CHOL_7_ABOVE"]).nullable(),
  })
  .strict();

export const screeningGatewayResponseSchema = z
  .object({
    evaluationId: z.string().uuid(),
    patientAgeYears: z.number().int().min(40).max(59),
    gender: z.enum(["MALE", "FEMALE"]),
    isCurrentSmoker: z.boolean(),
    systolicBloodPressureMmHg: z.number().int().positive(),
    resolvedBmi: z.number().positive(),
    riskScoreCategory: gatewayRiskCategorySchema,
    riskLevel: gatewayRiskLevelSchema,
    chartTypeUsed: z.enum(["SEAR_NON_LAB", "SEAR_LAB"]),
    binBreakdown: binBreakdownSchema,
    isHypertensiveCrisis: z.boolean(),
    calculatedAt: z.string().datetime(),
    clinicalDisclaimer: z.string().min(10),
  })
  .strict();

export type ScreeningGatewayRequest = z.infer<typeof screeningGatewayRequestSchema>;
export type ScreeningGatewayResponse = z.infer<typeof screeningGatewayResponseSchema>;
export type ScreeningGatewayPreparation =
  | { kind: "gateway"; body: ScreeningGatewayRequest }
  | { kind: "local"; response: ScreeningAnalyzeResponse };

export function prepareScreeningGatewayRequest(
  input: ScreeningServerInput,
  now = new Date(),
): ScreeningGatewayPreparation {
  const meta = { requestId: input.requestId, generatedAt: now.toISOString(), demo: false };
  const local = (data: ScreeningAnalyzeResponse["data"]): ScreeningGatewayPreparation => ({
    kind: "local",
    response: { data, meta },
  });

  if (input.emergencySymptoms === "yes") {
    return local({ status: "emergency", message: "Hentikan skrining dan segera cari bantuan darurat setempat atau fasilitas kesehatan terdekat." });
  }
  if (input.priorCvd === "yes") {
    return local({ status: "not_eligible", reason: "previous_cvd", message: "Skrining primary-prevention WHO tidak digunakan untuk pengguna dengan riwayat stroke, TIA, atau penyakit kardiovaskular." });
  }
  if (input.priorCvd === "unknown") {
    return local({ status: "eligibility_unknown", missingFields: ["riwayat stroke/TIA/CVD"], message: "Kelayakan belum dapat ditentukan sampai riwayat stroke, TIA, atau penyakit kardiovaskular dikonfirmasi." });
  }

  const age = ageOnDate(input.dateOfBirth, now);
  if (age < 40 || age > 59) {
    return local({ status: "not_eligible", reason: "age_outside_mvp", message: "Pada MVP, estimasi WHO hanya tersedia untuk pengguna NeuroPrevent berusia 40-59 tahun. Tidak ada skor yang dibuat dari data ini." });
  }

  const missingFields: string[] = [];
  if (input.sexForChart === "unknown") missingFields.push("kategori jenis kelamin pada chart");
  if (input.smokingStatus === "unknown") missingFields.push("status merokok");
  if (input.systolicBpStatus === "unknown") missingFields.push("tekanan darah sistolik");
  if (input.heightStatus === "unknown") missingFields.push("tinggi badan");
  if (input.weightStatus === "unknown") missingFields.push("berat badan");
  if (missingFields.length > 0) {
    return local({ status: "insufficient_data", missingFields, message: "Data belum cukup untuk dikirim ke engine klinis. NeuroCare tidak menebak nilai yang belum tersedia." });
  }

  return {
    kind: "gateway",
    body: screeningGatewayRequestSchema.parse({
      patientAgeYears: age,
      gender: input.sexForChart === "male" ? "MALE" : "FEMALE",
      systolicBloodPressureMmHg: Number(input.systolicBpMmHg),
      isCurrentSmoker: input.smokingStatus === "yes",
      weightKg: Number(input.weightKg),
      heightCm: Number(input.heightCm),
      bodyMassIndex: null,
      hasDiabetes: null,
      totalCholesterolMmolL: null,
    }),
  };
}

export function mapScreeningGatewayResponse(
  input: ScreeningServerInput,
  response: ScreeningGatewayResponse,
): ScreeningAnalyzeResponse {
  return {
    data: {
      status: "ok",
      riskScope: "cvd_10y",
      category: response.riskScoreCategory,
      categoryLabel: riskCategoryLabel(response.riskScoreCategory),
      completedAt: response.calculatedAt,
      source: { name: "AI-Neurocare WHO CVD Engine", region: "SEAR", version: response.chartTypeUsed, engineVersion: "ai-neurocare-gateway-v1" },
      engineFacts: {
        evaluationId: response.evaluationId,
        resolvedBmi: response.resolvedBmi,
        riskCategory: response.riskScoreCategory,
        riskLevel: response.riskLevel,
        chartTypeUsed: response.chartTypeUsed,
        isHypertensiveCrisis: response.isHypertensiveCrisis,
        clinicalDisclaimer: response.clinicalDisclaimer,
      },
      limitations: [response.clinicalDisclaimer],
    },
    meta: { requestId: input.requestId, generatedAt: new Date().toISOString(), demo: false },
  };
}

function ageOnDate(dateOfBirth: string, referenceDate: Date) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = referenceDate.getUTCFullYear() - year;
  const beforeBirthday = referenceDate.getUTCMonth() + 1 < month || (referenceDate.getUTCMonth() + 1 === month && referenceDate.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

function riskCategoryLabel(category: z.infer<typeof gatewayRiskCategorySchema>) {
  const labels: Record<typeof category, string> = {
    UNDER_5_PERCENT: "Kurang dari 5%",
    "5_TO_UNDER_10_PERCENT": "5% hingga kurang dari 10%",
    "10_TO_UNDER_20_PERCENT": "10% hingga kurang dari 20%",
    "20_TO_UNDER_30_PERCENT": "20% hingga kurang dari 30%",
    "30_PERCENT_AND_ABOVE": "30% atau lebih",
  };
  return labels[category];
}
