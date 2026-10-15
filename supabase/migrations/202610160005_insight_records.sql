-- F04: validated AI/template output. Only a trusted server integration may write.

create table if not exists public.insight_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  screening_session_id uuid not null,
  source_mode text not null check (source_mode in ('live', 'template')),
  generated_by text not null check (generated_by in ('ai', 'template')),
  model_version text,
  schema_version text not null check (char_length(schema_version) between 1 and 80),
  sections jsonb not null check (jsonb_typeof(sections) = 'object'),
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (screening_session_id, user_id)
    references public.screening_sessions (id, user_id) on delete cascade,
  check (
    (generated_by = 'ai' and source_mode = 'live' and model_version is not null)
    or (generated_by = 'template' and source_mode = 'template')
  )
);

create index if not exists insight_records_user_generated_at_idx
  on public.insight_records (user_id, generated_at desc);

alter table public.insight_records enable row level security;
grant select on public.insight_records to authenticated;

create policy insight_records_select_own on public.insight_records
  for select to authenticated using (user_id = auth.uid());
