import type { ActionItem, HealthMeasurement, TimelineEvent } from "./health-records.contract";

export function sortTimelineEvents(events: readonly TimelineEvent[]) {
  return [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}

export function sortActionItems(items: readonly ActionItem[]) {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function measurementToTimelineEvent(measurement: HealthMeasurement): TimelineEvent {
  const details = measurement.type === "blood_pressure"
    ? [{ label: "Sistolik", value: String(measurement.systolic), unit: measurement.unit }, { label: "Diastolik", value: String(measurement.diastolic), unit: measurement.unit }]
    : [{ label: measurement.type === "weight" ? "Berat" : "Tinggi", value: String(measurement.value), unit: measurement.unit }];
  return {
    id: `measurement:${measurement.id}`,
    occurredAt: measurement.measuredAt,
    kind: "measurement",
    pathway: "shared",
    title: measurement.type === "blood_pressure" ? "Pengukuran tekanan darah" : measurement.type === "weight" ? "Pengukuran berat badan" : "Pengukuran tinggi badan",
    description: "Nilai yang dilaporkan pengguna; NeuroCare tidak menafsirkan normal atau abnormal.",
    details,
    source: { label: "Laporan pengguna", provenance: measurement.provenance === "database" ? "database" : "demo_fixture", referenceId: measurement.id },
  };
}

export function isMeasuredAtAllowed(measuredAt: string, now: Date) {
  const value = Date.parse(measuredAt);
  return Number.isFinite(value) && value <= now.getTime();
}

export function hasDuplicateAction(items: readonly ActionItem[]) {
  const keys = new Set<string>();
  for (const item of items) {
    if (keys.has(item.dedupeKey)) return true;
    keys.add(item.dedupeKey);
  }
  return false;
}
