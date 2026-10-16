import { describe, expect, it, vi } from "vitest";
import {
  HealthRecordsStorageError,
  listActionItems,
  listTimelineEvents,
  mapMeasurement,
  saveHealthMeasurement,
  updateActionItem,
} from "./health-records-repository";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient<Database>;

describe("health-records-repository", () => {
  const userId = "user-123";

  it("saves blood pressure measurement with systolic, diastolic and operation idempotency", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "m-1",
        measurement_type: "blood_pressure",
        value: 120,
        secondary_value: 80,
        unit: "mmHg",
        source: "user_reported",
        measured_at: "2026-10-16T03:00:00Z",
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const result = await saveHealthMeasurement(mockSupabase, userId, {
      type: "blood_pressure",
      systolic: 120,
      diastolic: 80,
      unit: "mmHg",
      source: "user_reported",
      measuredAt: "2026-10-16T03:00:00Z",
      requestId: "op-123",
      confirmation: true,
    });

    expect(mockFrom).toHaveBeenCalledWith("health_measurements");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        operation_id: "op-123",
        measurement_type: "blood_pressure",
        value: 120,
        secondary_value: 80,
        unit: "mmHg",
      }),
      { onConflict: "user_id,operation_id" },
    );
    expect(result).toMatchObject({
      id: "m-1",
      type: "blood_pressure",
      systolic: 120,
      diastolic: 80,
      unit: "mmHg",
      provenance: "database",
    });
  });

  it("saves weight measurement correctly", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "m-2",
        measurement_type: "weight",
        value: 68.5,
        secondary_value: null,
        unit: "kg",
        source: "user_reported",
        measured_at: "2026-10-16T03:00:00Z",
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const result = await saveHealthMeasurement(mockSupabase, userId, {
      type: "weight",
      value: 68.5,
      unit: "kg",
      source: "user_reported",
      measuredAt: "2026-10-16T03:00:00Z",
      requestId: "op-124",
      confirmation: true,
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        operation_id: "op-124",
        measurement_type: "weight",
        value: 68.5,
        secondary_value: null,
        unit: "kg",
      }),
      { onConflict: "user_id,operation_id" },
    );
    expect(result).toMatchObject({
      id: "m-2",
      type: "weight",
      value: 68.5,
      unit: "kg",
    });
  });

  it("throws storage_not_configured when PGRST205 table missing error is returned", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST205", message: "Table missing" },
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    await expect(
      saveHealthMeasurement(mockSupabase, userId, {
        type: "weight",
        value: 70,
        unit: "kg",
        source: "user_reported",
        measuredAt: "2026-10-16T03:00:00Z",
        requestId: "op-125",
        confirmation: true,
      }),
    ).rejects.toThrowError(new HealthRecordsStorageError("storage_not_configured"));
  });

  it("updates action item status and handles not_found", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "act-1",
        dedupe_key: "key-1",
        title: "Periksa tensi",
        description: "Lakukan di faskes",
        status: "completed",
        pathway: "neuroprevent",
        due_at: null,
        completed_at: "2026-10-16T03:30:00Z",
        source_kind: "user_created",
        source_label: "Tindakan mandiri",
        source_reference_id: null,
        updated_at: "2026-10-16T03:30:00Z",
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEqUser = vi.fn().mockReturnValue({ select: mockSelect });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const result = await updateActionItem(mockSupabase, userId, "act-1", { requestId: "req-1", status: "completed" });
    expect(result.status).toBe("completed");
    expect(result.completedAt).toBe("2026-10-16T03:30:00Z");

    // test not_found
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(
      updateActionItem(mockSupabase, userId, "act-missing", { requestId: "req-2", status: "completed" }),
    ).rejects.toThrowError(new HealthRecordsStorageError("not_found"));
  });

  it("lists and sorts timeline events from measurements and actions", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "health_measurements") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "m-1",
                        measurement_type: "blood_pressure",
                        value: 120,
                        secondary_value: 80,
                        unit: "mmHg",
                        source: "user_reported",
                        measured_at: "2026-10-15T10:00:00Z",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "action_items") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "act-1",
                        title: "Rencana A",
                        description: "Detail A",
                        status: "completed",
                        pathway: "neuroprevent",
                        completed_at: "2026-10-16T12:00:00Z",
                        updated_at: "2026-10-16T12:00:00Z",
                        source_label: "Rencana mandiri",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "insight_records") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({
                  data: [{
                    id: "insight-1",
                    screening_session_id: "screening-1",
                    generated_by: "ai",
                    model_version: "provider/1.0.0",
                    generated_at: "2026-10-16T11:00:00Z",
                  }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;
    const events = await listTimelineEvents(mockSupabase, userId);

    expect(events).toHaveLength(3);
    // Chronologically sorted descending (latest first)
    expect(events[0].id).toBe("action-item:act-1");
    expect(events[1].id).toBe("insight:insight-1");
    expect(events[2].id).toBe("measurement:m-1");
  });

  it("lists action items for current user", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "act-1",
          dedupe_key: "key-1",
          title: "Periksa tensi",
          description: "Lakukan di faskes",
          status: "pending",
          pathway: "neuroprevent",
          due_at: null,
          completed_at: null,
          source_kind: "user_created",
          source_label: "Tindakan mandiri",
          source_reference_id: null,
          updated_at: "2026-10-16T03:30:00Z",
        },
      ],
      error: null,
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom } as unknown as DbClient;

    const items = await listActionItems(mockSupabase, userId);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("act-1");
  });

  it("mapMeasurement validates supported units and rejects invalid units", () => {
    expect(() =>
      mapMeasurement({
        id: "bad-1",
        measurement_type: "weight",
        value: 150,
        secondary_value: null,
        unit: "lbs" as unknown as "kg",
        source: "user_reported",
        measured_at: "2026-10-16T00:00:00Z",
      }),
    ).toThrowError(HealthRecordsStorageError);
  });
});
