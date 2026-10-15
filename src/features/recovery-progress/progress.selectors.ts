import type { ProgressActivity, ProgressAggregates, ProgressCheckin } from "./progress.contract";

export function sortProgressCheckins(checkins: readonly ProgressCheckin[]) {
  return [...checkins].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function sortProgressActivities(activities: readonly ProgressActivity[]) {
  return [...activities].sort((a, b) => a.endedAt.localeCompare(b.endedAt));
}

export function computeProgressAggregates(
  checkins: readonly ProgressCheckin[],
  activities: readonly ProgressActivity[] | null,
): ProgressAggregates {
  const sortedCheckins = sortProgressCheckins(checkins);
  const validActivities = activities?.filter(
    (activity) => activity.status === "completed" && activity.processingQuality === "acceptable",
  );

  return {
    checkinCount: sortedCheckins.length,
    firstCheckinAt: sortedCheckins.at(0)?.recordedAt ?? null,
    latestCheckinAt: sortedCheckins.at(-1)?.recordedAt ?? null,
    activityCount: validActivities?.length ?? null,
    totalActivityDurationSeconds: validActivities
      ? validActivities.reduce((sum, activity) => sum + activity.durationSeconds, 0)
      : null,
    totalDetectedReps: validActivities
      ? validActivities.reduce((sum, activity) => sum + activity.detectedReps, 0)
      : null,
  };
}

export function buildCheckinCountSeries(checkins: readonly ProgressCheckin[]) {
  return sortProgressCheckins(checkins).map((checkin, index) => ({
    id: checkin.id,
    recordedAt: checkin.recordedAt,
    cumulativeCheckins: index + 1,
  }));
}

export function describeCheckinData(checkins: readonly ProgressCheckin[]) {
  const sorted = sortProgressCheckins(checkins);
  if (sorted.length === 0) return "Belum ada check-in dalam rentang ini.";
  if (sorted.length === 1) return "Satu check-in tersedia. Belum ada cukup titik untuk membandingkan perubahan catatan.";
  return `${sorted.length} check-in tersedia. Grafik menunjukkan jumlah catatan secara kumulatif, bukan tingkat pemulihan.`;
}
