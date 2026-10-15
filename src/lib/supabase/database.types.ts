/*
 * Generated-shape database types for the committed P0 migrations.
 * Regenerate from Supabase CLI after the migrations are applied:
 *   npx supabase gen types typescript --project-id <project-ref> --schema public
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      action_items: {
        Row: { id: string; user_id: string; dedupe_key: string; title: string; description: string; status: "pending" | "completed"; pathway: "neuroprevent" | "neurorecovery" | "shared"; due_at: string | null; completed_at: string | null; source_kind: "screening_gap" | "recovery_checkin" | "recovery_progress" | "user_created"; source_label: string; source_reference_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; dedupe_key: string; title: string; description: string; status?: "pending" | "completed"; pathway: "neuroprevent" | "neurorecovery" | "shared"; due_at?: string | null; completed_at?: string | null; source_kind: "screening_gap" | "recovery_checkin" | "recovery_progress" | "user_created"; source_label: string; source_reference_id?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["action_items"]["Insert"]>;
        Relationships: [];
      };
      consents: {
        Row: { id: string; user_id: string; purpose: "core_health_processing" | "external_ai" | "camera"; action: "granted" | "withdrawn"; policy_version: string; recorded_at: string; created_at: string };
        Insert: { id?: string; user_id: string; purpose: "core_health_processing" | "external_ai" | "camera"; action: "granted" | "withdrawn"; policy_version: string; recorded_at?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      health_measurements: {
        Row: { id: string; user_id: string; operation_id: string; measurement_type: "blood_pressure" | "weight" | "height"; value: number; secondary_value: number | null; unit: "mmHg" | "kg" | "cm"; source: "user_reported"; measured_at: string; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; operation_id: string; measurement_type: "blood_pressure" | "weight" | "height"; value: number; secondary_value?: number | null; unit: "mmHg" | "kg" | "cm"; source: "user_reported"; measured_at: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["health_measurements"]["Insert"]>;
        Relationships: [];
      };
      insight_records: {
        Row: { id: string; user_id: string; screening_session_id: string; source_mode: "live" | "template"; generated_by: "ai" | "template"; model_version: string | null; schema_version: string; sections: Json; generated_at: string; created_at: string };
        Insert: { id?: string; user_id: string; screening_session_id: string; source_mode: "live" | "template"; generated_by: "ai" | "template"; model_version?: string | null; schema_version: string; sections: Json; generated_at?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: { user_id: string; preferred_pathway: "neuroprevent" | "neurorecovery" | null; locale: "id-ID"; created_at: string; updated_at: string };
        Insert: { user_id: string; preferred_pathway?: "neuroprevent" | "neurorecovery" | null; locale?: "id-ID"; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      recovery_activities: {
        Row: { id: string; user_id: string; exercise_id: string; exercise_version: string; algorithm_version: string; started_at: string | null; ended_at: string; duration_seconds: number; detected_reps: number; processing_quality: "acceptable" | "low" | "unavailable"; status: "completed" | "interrupted" | "canceled"; created_at: string };
        Insert: { id?: string; user_id: string; exercise_id: string; exercise_version: string; algorithm_version: string; started_at?: string | null; ended_at: string; duration_seconds: number; detected_reps: number; processing_quality: "acceptable" | "low" | "unavailable"; status: "completed" | "interrupted" | "canceled"; created_at?: string };
        Update: never;
        Relationships: [];
      };
      recovery_checkins: {
        Row: { id: string; user_id: string; operation_id: string; recorded_at: string; is_baseline: boolean; status: "completed"; instrument_version: string; source: "self_report" | "assisted"; assistance_note: string | null; answers: Json; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; operation_id: string; recorded_at: string; is_baseline?: boolean; status?: "completed"; instrument_version: string; source: "self_report" | "assisted"; assistance_note?: string | null; answers: Json; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["recovery_checkins"]["Insert"]>;
        Relationships: [];
      };
      screening_gaps: {
        Row: { id: string; user_id: string; screening_session_id: string; gap_type: string; status: string; title: string; reason: string; related_measurement: string; supporting_fact_label: string; supporting_fact_recorded_at: string | null; applicability: string; is_stale: boolean; rule_source_label: string; rule_version: string; evaluated_at: string; action_key: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; screening_session_id: string; gap_type: string; status: string; title: string; reason: string; related_measurement: string; supporting_fact_label: string; supporting_fact_recorded_at?: string | null; applicability: string; is_stale?: boolean; rule_source_label: string; rule_version: string; evaluated_at?: string; action_key?: string | null; created_at?: string; updated_at?: string };
        Update: never;
        Relationships: [];
      };
      screening_sessions: {
        Row: { id: string; user_id: string; operation_id: string; pathway: "neuroprevent"; input_snapshot: Json; safety_status: "clear" | "emergency"; result_status: string; risk_scope: "cvd_10y" | null; result_snapshot: Json | null; source_name: string | null; source_region: string | null; source_version: string | null; engine_version: string | null; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; operation_id: string; pathway?: "neuroprevent"; input_snapshot: Json; safety_status: "clear" | "emergency"; result_status: string; risk_scope?: "cvd_10y" | null; result_snapshot?: Json | null; source_name?: string | null; source_region?: string | null; source_version?: string | null; engine_version?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
