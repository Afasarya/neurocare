import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type ActionItem,
  type ActionItemUpdate,
  type HealthMeasurement,
  type HealthMeasurementCreate,
  type TimelineEvent,
} from "@/features/health-records/health-records.contract";
import { sortActionItems, sortTimelineEvents } from "@/features/health-records/health-records.selectors";
import type { Database } from "@/lib/supabase/database.types";

type DbClient = SupabaseClient<Database>;
type MeasurementRow = Database["public"]["Tables"]["health_measurements"]["Row"];
type MeasurementInsert = Database["public"]["Tables"]["health_measurements"]["Insert"];
type ActionItemRow = Database["public"]["Tables"]["action_items"]["Row"];

export class HealthRecordsStorageError extends Error {
  constructor(
    public readonly kind: "storage_not_configured" | "service_error" | "not_found",
  ) {
    super(kind);
  }
}

export async function saveHealthMeasurement(
  supabase: DbClient,
  userId: string,
  input: HealthMeasurementCreate,
) {
  const row: MeasurementInsert = input.type === "blood_pressure"
    ? {
        user_id: userId,
        operation_id: input.requestId,
        measurement_type: input.type,
        value: input.systolic,
        secondary_value: input.diastolic,
        unit: input.unit,
        source: input.source,
        measured_at: input.measuredAt,
      }
    : {
        user_id: userId,
        operation_id: input.requestId,
        measurement_type: input.type,
        value: input.value,
        secondary_value: null,
        unit: input.unit,
        source: input.source,
        measured_at: input.measuredAt,
      };

  const { data, error } = await supabase
    .from("health_measurements")
    .upsert(row, { onConflict: "user_id,operation_id" })
    .select("id, measurement_type, value, secondary_value, unit, source, measured_at")
    .single();

  if (error || !data) throw storageError(error?.code);
  return mapMeasurement(data as MeasurementRow);
}

export async function listActionItems(supabase: DbClient, userId: string) {
  const { data, error } = await supabase
    .from("action_items")
    .select("id, dedupe_key, title, description, status, pathway, due_at, completed_at, source_kind, source_label, source_reference_id, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw storageError(error.code);
  return sortActionItems((data ?? []).map((row) => mapActionItem(row as ActionItemRow)));
}

export async function updateActionItem(
  supabase: DbClient,
  userId: string,
  id: string,
  input: ActionItemUpdate,
) {
  const completedAt = input.status === "completed" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("action_items")
    .update({ status: input.status, completed_at: completedAt })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, dedupe_key, title, description, status, pathway, due_at, completed_at, source_kind, source_label, source_reference_id, updated_at")
    .maybeSingle();

  if (error) throw storageError(error.code);
  if (!data) throw new HealthRecordsStorageError("not_found");
  return mapActionItem(data as ActionItemRow);
}

export async function listTimelineEvents(supabase: DbClient, userId: string) {
  const [measurementsResult, actionsResult] = await Promise.all([
    supabase
      .from("health_measurements")
      .select("id, measurement_type, value, secondary_value, unit, source, measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(100),
    supabase
      .from("action_items")
      .select("id, title, description, status, pathway, completed_at, updated_at, source_label")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  if (measurementsResult.error) throw storageError(measurementsResult.error.code);
  if (actionsResult.error) throw storageError(actionsResult.error.code);

  const measurementEvents = (measurementsResult.data ?? []).map((row) =>
    measurementToTimelineEvent(mapMeasurement(row as MeasurementRow)),
  );
  const actionEvents = (actionsResult.data ?? []).map((row) => actionToTimelineEvent(row));
  return sortTimelineEvents([...measurementEvents, ...actionEvents]);
}

export function mapMeasurement(row: Pick<MeasurementRow, "id" | "measurement_type" | "value" | "secondary_value" | "unit" | "source" | "measured_at">): HealthMeasurement {
  const base = {
    id: row.id,
    measuredAt: row.measured_at,
    source: row.source,
    provenance: "database" as const,
  };
  if (row.measurement_type === "blood_pressure") {
    if (row.unit !== "mmHg" || row.secondary_value === null) throw new HealthRecordsStorageError("service_error");
    return { ...base, type: "blood_pressure", systolic: Number(row.value), diastolic: Number(row.secondary_value), unit: "mmHg" };
  }
  if (row.measurement_type === "weight" && row.unit === "kg") {
    return { ...base, type: "weight", value: Number(row.value), unit: "kg" };
  }
  if (row.measurement_type === "height" && row.unit === "cm") {
    return { ...base, type: "height", value: Number(row.value), unit: "cm" };
  }
  throw new HealthRecordsStorageError("service_error");
}

export function mapActionItem(row: Pick<ActionItemRow, "id" | "dedupe_key" | "title" | "description" | "status" | "pathway" | "due_at" | "completed_at" | "source_kind" | "source_label" | "source_reference_id" | "updated_at">): ActionItem {
  return {
    id: row.id,
    dedupeKey: row.dedupe_key,
    title: row.title,
    description: row.description,
    status: row.status,
    pathway: row.pathway,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    source: { kind: row.source_kind, label: row.source_label, referenceId: row.source_reference_id },
    provenance: "database",
    updatedAt: row.updated_at,
  };
}

function measurementToTimelineEvent(measurement: HealthMeasurement): TimelineEvent {
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
    source: { label: "Laporan pengguna", provenance: "database", referenceId: measurement.id },
  };
}

function actionToTimelineEvent(row: { id: string; title: string; description: string; status: "pending" | "completed"; pathway: "neuroprevent" | "neurorecovery" | "shared"; completed_at: string | null; updated_at: string; source_label: string }): TimelineEvent {
  return {
    id: `action-item:${row.id}`,
    occurredAt: row.completed_at ?? row.updated_at,
    kind: "action_item",
    pathway: row.pathway,
    title: row.title,
    description: row.status === "completed" ? "Rencana ditandai selesai." : row.description,
    details: [{ label: "Status", value: row.status === "completed" ? "Selesai" : "Belum dikerjakan", unit: null }],
    source: { label: row.source_label, provenance: "database", referenceId: row.id },
  };
}

function storageError(code: string | undefined) {
  return new HealthRecordsStorageError(code === "PGRST205" || code === "42P01" ? "storage_not_configured" : "service_error");
}
