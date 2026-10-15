-- F08: user-entered measurements and follow-up actions.

create table if not exists public.health_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  measurement_type text not null check (measurement_type in ('blood_pressure', 'weight', 'height')),
  value numeric(10, 2) not null,
  secondary_value numeric(10, 2),
  unit text not null check (unit in ('mmHg', 'kg', 'cm')),
  source text not null check (source = 'user_reported'),
  measured_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, operation_id),
  -- Avoid a volatile time function in a constraint. The API rejects future
  -- timestamps; this permits only a small clock-skew window at insert time.
  check (measured_at <= created_at + interval '5 minutes'),
  check (
    (measurement_type = 'blood_pressure'
      and unit = 'mmHg'
      and value > 0 and value <= 999 and value = trunc(value)
      and secondary_value > 0 and secondary_value <= 999 and secondary_value = trunc(secondary_value))
    or (measurement_type = 'weight'
      and unit = 'kg'
      and value > 0 and value <= 9999
      and secondary_value is null)
    or (measurement_type = 'height'
      and unit = 'cm'
      and value > 0 and value <= 9999
      and secondary_value is null)
  )
);

create trigger health_measurements_set_updated_at
before update on public.health_measurements
for each row execute procedure public.set_updated_at();

create index if not exists health_measurements_user_measured_at_idx
  on public.health_measurements (user_id, measured_at desc);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 160),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 300),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  pathway text not null check (pathway in ('neuroprevent', 'neurorecovery', 'shared')),
  due_at timestamptz,
  completed_at timestamptz,
  source_kind text not null check (source_kind in ('screening_gap', 'recovery_checkin', 'recovery_progress', 'user_created')),
  source_label text not null check (char_length(source_label) between 1 and 120),
  source_reference_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, dedupe_key),
  check ((status = 'pending' and completed_at is null) or (status = 'completed' and completed_at is not null))
);

create trigger action_items_set_updated_at
before update on public.action_items
for each row execute procedure public.set_updated_at();

-- Rule/AI sourced fields are immutable to the browser role. A user may change
-- only completion state; the timestamp is assigned by the database, not the
-- request body. Trusted backend writers have a separate integration path.
create or replace function public.protect_action_item_fields()
returns trigger
language plpgsql
as $$
begin
  if old.user_id is distinct from new.user_id
    or old.dedupe_key is distinct from new.dedupe_key
    or old.source_kind is distinct from new.source_kind
    or old.source_label is distinct from new.source_label
    or old.source_reference_id is distinct from new.source_reference_id
    or old.pathway is distinct from new.pathway then
    raise exception 'Action item ownership and provenance are immutable';
  end if;

  if old.source_kind <> 'user_created' and (
    old.title is distinct from new.title
    or old.description is distinct from new.description
    or old.due_at is distinct from new.due_at
  ) then
    raise exception 'Derived action item content may only be changed by a trusted backend';
  end if;

  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := timezone('utc', now());
  elsif new.status = 'pending' then
    new.completed_at := null;
  elsif new.status = 'completed' and new.completed_at is null then
    new.completed_at := old.completed_at;
  end if;

  return new;
end;
$$;

create trigger action_items_protect_derived_fields
before update on public.action_items
for each row execute procedure public.protect_action_item_fields();

create index if not exists action_items_user_status_updated_at_idx
  on public.action_items (user_id, status, updated_at desc);

alter table public.health_measurements enable row level security;
alter table public.action_items enable row level security;

grant select, insert, update, delete on public.health_measurements to authenticated;
grant select, insert, update, delete on public.action_items to authenticated;

create policy health_measurements_select_own on public.health_measurements
  for select to authenticated using (user_id = auth.uid());
create policy health_measurements_insert_own on public.health_measurements
  for insert to authenticated with check (user_id = auth.uid());
create policy health_measurements_update_own on public.health_measurements
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy health_measurements_delete_own on public.health_measurements
  for delete to authenticated using (user_id = auth.uid());

create policy action_items_select_own on public.action_items
  for select to authenticated using (user_id = auth.uid());
-- A browser user may only create their own explicitly user-created follow-up.
-- Rules-engine sourced actions are written by a future trusted server integration.
create policy action_items_insert_user_created on public.action_items
  for insert to authenticated
  with check (user_id = auth.uid() and source_kind = 'user_created');
create policy action_items_update_own on public.action_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy action_items_delete_own on public.action_items
  for delete to authenticated using (user_id = auth.uid());
