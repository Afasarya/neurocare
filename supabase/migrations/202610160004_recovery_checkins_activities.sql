-- F05/F07: self-report check-ins and future validated activity summaries.

create table if not exists public.recovery_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  recorded_at timestamptz not null,
  is_baseline boolean not null default false,
  status text not null default 'completed' check (status = 'completed'),
  instrument_version text not null check (char_length(instrument_version) between 1 and 80),
  source text not null check (source in ('self_report', 'assisted')),
  assistance_note text check (assistance_note is null or char_length(assistance_note) <= 280),
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) = 4),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, operation_id),
  check ((source = 'assisted') or assistance_note is null)
);

create trigger recovery_checkins_set_updated_at
before update on public.recovery_checkins
for each row execute procedure public.set_updated_at();

create index if not exists recovery_checkins_user_recorded_at_idx
  on public.recovery_checkins (user_id, recorded_at desc);

create table if not exists public.recovery_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null check (char_length(exercise_id) between 1 and 80),
  exercise_version text not null check (char_length(exercise_version) between 1 and 80),
  algorithm_version text not null check (char_length(algorithm_version) between 1 and 80),
  started_at timestamptz,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 0 and 7200),
  detected_reps integer not null check (detected_reps between 0 and 10000),
  processing_quality text not null check (processing_quality in ('acceptable', 'low', 'unavailable')),
  status text not null check (status in ('completed', 'interrupted', 'canceled')),
  created_at timestamptz not null default timezone('utc', now()),
  check (started_at is null or started_at <= ended_at)
);

create index if not exists recovery_activities_user_ended_at_idx
  on public.recovery_activities (user_id, ended_at desc);

alter table public.recovery_checkins enable row level security;
alter table public.recovery_activities enable row level security;

grant select, insert, update, delete on public.recovery_checkins to authenticated;
grant select on public.recovery_activities to authenticated;

create policy recovery_checkins_select_own on public.recovery_checkins
  for select to authenticated using (user_id = auth.uid());
create policy recovery_checkins_insert_own on public.recovery_checkins
  for insert to authenticated with check (user_id = auth.uid());
create policy recovery_checkins_update_own on public.recovery_checkins
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recovery_checkins_delete_own on public.recovery_checkins
  for delete to authenticated using (user_id = auth.uid());
create policy recovery_activities_select_own on public.recovery_activities
  for select to authenticated using (user_id = auth.uid());
