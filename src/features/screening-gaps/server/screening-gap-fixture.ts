import type {
  GapDemoScenario,
  ScreeningGap,
  ScreeningGapsResponse,
} from "@/features/screening-gaps/screening-gap.contract";

const fixtureVersion = "screening-gap-fixture-v1";

export function createScreeningGapFixture(
  scenario: GapDemoScenario,
  requestId: string,
  now = new Date(),
): ScreeningGapsResponse {
  const generatedAt = now.toISOString();
  const meta = { requestId, generatedAt, demo: true };

  if (scenario === "empty") {
    return {
      data: {
        status: "empty",
        message:
          "Belum ada assessment tersimpan. Selesaikan skrining untuk melihat kelengkapan data.",
      },
      meta,
    };
  }

  if (scenario === "unavailable") {
    return {
      data: {
        status: "unavailable",
        reason: "rules_not_configured",
        retryable: false,
        message:
          "Layanan aturan gap belum terhubung. NeuroCare tidak membuat saran personal tanpa sumber aturan yang disetujui.",
      },
      meta,
    };
  }

  const baseGap: ScreeningGap = {
    id: "demo-gap-bp-unknown",
    type: "unknown_measurement",
    status: "open",
    title: "Belum ada data tekanan darah",
    reason:
      "Data tekanan darah sistolik ditandai belum diketahui pada fixture skrining. Ini bukan berarti nilainya tinggi atau normal.",
    relatedMeasurement: "systolic_blood_pressure",
    supportingFact: {
      label: "Tekanan darah sistolik: belum ada data",
      recordedAt: null,
    },
    source: {
      kind: "demo_fixture",
      label: "Fixture F02 — data tidak diketahui",
      version: fixtureVersion,
      referenceId: "demo-screening-session",
    },
    applicability: "applicable",
    stale: false,
    nextActions: [
      {
        id: "record-blood-pressure",
        kind: "record_measurement",
        label: "Catat hasil pemeriksaan",
        href: "/app/screening",
        enabled: true,
      },
      {
        id: "view-screening-history",
        kind: "view_history",
        label: "Lihat riwayat",
        href: "/app/screening/history",
        enabled: true,
      },
      {
        id: "add-bp-check-to-action-plan",
        kind: "add_action_plan",
        label: "Tambah ke Rencana",
        href: "/app/action-plan",
        enabled: true,
      },
    ],
  };

  if (scenario === "completed") {
    baseGap.id = "demo-gap-completed";
    baseGap.type = "completed";
    baseGap.status = "completed";
    baseGap.title = "Data contoh sudah dilengkapi";
    baseGap.reason =
      "Fixture menunjukkan gap sebelumnya telah diselesaikan; tidak ada kesimpulan mengenai normal atau abnormalnya hasil.";
    baseGap.supportingFact = {
      label: "Status pencatatan: lengkap pada fixture demo",
      recordedAt: generatedAt,
    };
    baseGap.nextActions = [baseGap.nextActions[1]];
  }

  if (scenario === "pending") {
    baseGap.id = "demo-gap-pending";
    baseGap.type = "possible_follow_up";
    baseGap.status = "pending";
    baseGap.title = "Tindak lanjut menunggu konfirmasi";
    baseGap.reason =
      "Fixture menunjukkan sebuah tindakan belum dikonfirmasi selesai. Tidak ada interval klinis yang dihitung di UI.";
    baseGap.supportingFact = {
      label: "Status tindakan: menunggu konfirmasi",
      recordedAt: generatedAt,
    };
  }

  return {
    data: {
      status: "ok",
      gaps: [baseGap],
      evaluatedAt: generatedAt,
      ruleSource: {
        label: "Fixture demonstrasi non-klinis F02",
        version: fixtureVersion,
      },
    },
    meta,
  };
}
