-- F01/F02: records and deterministic rule snapshots. Client roles can read
-- only their own rows; inserts are intentionally reserved for a trusted backend.

create table if not exists public.screening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  pathway text not null check (pathway = 'neuroprevent'),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  safety_status text not null check (safety_status in ('clear', 'emergency')),
  result_status text not null check (result_status in ('emergency', 'eligibility_unknown', 'not_eligible', 'insufficient_data', 'unavailable', 'ok')),
  risk_scope text check (risk_scope is null or risk_scope = 'cvd_10y'),
  result_snapshot jsonb check (result_snapshot is null or jsonb_typeof(result_snapshot) = 'object'),
  source_name text check (source_name is null or char_length(source_name) between 1 and 120),
  source_region text check (source_region is null or char_length(source_region) between 1 and 120),
  source_version text check (source_version is null or char_length(source_version) between 1 and 80),
  engine_version text check (engine_version is null or char_length(engine_version) between 1 and 80),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, operation_id),
  unique (id, user_id),
  check ((result_status = 'ok' and risk_scope = 'cvd_10y' and completed_at is not null) or result_status <> 'ok')
);

create trigger screening_sessions_set_updated_at
before update on public.screening_sessions
for each row execute procedure public.set_updated_at();

create index if not exists screening_sessions_user_completed_at_idx
  on public.screening_sessions (user_id, completed_at desc nulls last);

create table if not exists public.screening_gaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  screening_session_id uuid not null,
  gap_type text not null check (gap_type in ('unknown_measurement', 'checkup_due', 'possible_follow_up', 'completed')),
  status text not null check (status in ('open', 'pending', 'completed')),
  title text not null check (char_length(title) between 1 and 120),
  reason text not null check (char_length(reason) between 1 and 500),
  related_measurement text not null check (related_measurement in ('systolic_blood_pressure', 'height', 'weight', 'smoking_status', 'other')),
  supporting_fact_label text not null check (char_length(supporting_fact_label) between 1 and 120),
  supporting_fact_recorded_at timestamptz,
  applicability text not null check (applicability in ('applicable', 'not_applicable', 'unknown')),
  is_stale boolean not null default false,
  rule_source_label text not null check (char_length(rule_source_label) between 1 and 120),
  rule_version text not null check (char_length(rule_version) between 1 and 80),
  evaluated_at timestamptz not null default timezone('utc', now()),
  action_key text check (action_key is null or char_length(action_key) between 1 and 160),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (screening_session_id, user_id)
    references public.screening_sessions (id, user_id) on delete cascade,
  unique (screening_session_id, action_key)
);

create trigger screening_gaps_set_updated_at
before update on public.screening_gaps
for each row execute procedure public.set_updated_at();

create index if not exists screening_gaps_user_evaluated_at_idx
  on public.screening_gaps (user_id, evaluated_at desc);

alter table public.screening_sessions enable row level security;
alter table public.screening_gaps enable row level security;

grant select on public.screening_sessions to authenticated;
grant select on public.screening_gaps to authenticated;

create policy screening_sessions_select_own on public.screening_sessions
  for select to authenticated using (user_id = auth.uid());
create policy screening_gaps_select_own on public.screening_gaps
  for select to authenticated using (user_id = auth.uid());
