import type { RecoveryCheckin } from "./recovery.contract";

export function selectRecoveryTrendPoints(checkins: RecoveryCheckin[]) {
  return [...checkins]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((checkin) => ({
      id: checkin.id,
      recordedAt: checkin.recordedAt,
      isBaseline: checkin.isBaseline,
      source: checkin.source,
      answers: checkin.answers.map((answer) => ({ ...answer })),
    }));
}

export function toRecoveryTimelineEvent(checkin: RecoveryCheckin) {
  return {
    id: `recovery-checkin:${checkin.id}`,
    occurredAt: checkin.recordedAt,
    kind: "recovery_checkin" as const,
    label: checkin.isBaseline ? "Baseline penilaian mandiri" : "Check-in penilaian mandiri",
    source: checkin.source,
    referenceId: checkin.id,
  };
}
