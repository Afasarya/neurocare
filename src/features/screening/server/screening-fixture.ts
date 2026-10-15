import type { ScreeningAnalyzeResponse } from "@/features/screening/screening.contract";
import type { ScreeningServerInput } from "@/features/screening/screening.server-schema";

function ageOnDate(dateOfBirth: string, referenceDate: Date) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = referenceDate.getUTCFullYear() - year;
  const beforeBirthday =
    referenceDate.getUTCMonth() + 1 < month ||
    (referenceDate.getUTCMonth() + 1 === month && referenceDate.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function createSafeScreeningFixture(
  input: ScreeningServerInput,
  now = new Date(),
): ScreeningAnalyzeResponse {
  const meta = {
    requestId: input.requestId,
    generatedAt: now.toISOString(),
    demo: true,
  };

  if (input.emergencySymptoms === "yes") {
    return {
      data: {
        status: "emergency",
        message:
          "Hentikan skrining dan segera cari bantuan darurat setempat atau fasilitas kesehatan terdekat.",
      },
      meta,
    };
  }

  if (input.priorCvd === "yes") {
    return {
      data: {
        status: "not_eligible",
        reason: "previous_cvd",
        message:
          "Skrining primary-prevention WHO tidak digunakan untuk pengguna dengan riwayat stroke, TIA, atau penyakit kardiovaskular.",
      },
      meta,
    };
  }

  if (input.priorCvd === "unknown") {
    return {
      data: {
        status: "eligibility_unknown",
        missingFields: ["riwayat stroke/TIA/CVD"],
        message:
          "Kelayakan belum dapat ditentukan sampai riwayat stroke, TIA, atau penyakit kardiovaskular dikonfirmasi.",
      },
      meta,
    };
  }

  const age = ageOnDate(input.dateOfBirth, now);
  if (age < 40 || age > 59) {
    return {
      data: {
        status: "not_eligible",
        reason: "age_outside_mvp",
        message:
          "Pada MVP, estimasi WHO hanya tersedia untuk pengguna NeuroPrevent berusia 40–59 tahun. Tidak ada skor yang dibuat dari data ini.",
      },
      meta,
    };
  }

  const missingFields: string[] = [];
  if (input.sexForChart === "unknown") missingFields.push("kategori jenis kelamin pada chart");
  if (input.smokingStatus === "unknown") missingFields.push("status merokok");
  if (input.systolicBpStatus === "unknown") missingFields.push("tekanan darah sistolik");
  if (input.heightStatus === "unknown") missingFields.push("tinggi badan");
  if (input.weightStatus === "unknown") missingFields.push("berat badan");

  if (missingFields.length > 0) {
    return {
      data: {
        status: "insufficient_data",
        missingFields,
        message:
          "Data belum cukup untuk dikirim ke engine klinis. NeuroCare tidak menebak nilai yang belum tersedia.",
      },
      meta,
    };
  }

  return {
    data: {
      status: "unavailable",
      reason: "engine_not_configured",
      retryable: false,
      message:
        "Data formulir lengkap, tetapi engine WHO terverifikasi belum terhubung. Tidak ada kategori atau angka risiko yang dibuat.",
    },
    meta,
  };
}
