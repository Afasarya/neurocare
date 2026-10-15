-- NeuroCare P0 foundation: profile and append-only consent records.
-- This migration is additive and does not alter or delete existing user data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_pathway text check (preferred_pathway in ('neuroprevent', 'neurorecovery')),
  locale text not null default 'id-ID' check (locale in ('id-ID')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Backfill only the minimal profile shell for accounts that already exist.
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('core_health_processing', 'external_ai', 'camera')),
  action text not null check (action in ('granted', 'withdrawn')),
  policy_version text not null check (char_length(policy_version) between 1 and 80),
  recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists consents_user_purpose_recorded_at_idx
  on public.consents (user_id, purpose, recorded_at desc);

alter table public.profiles enable row level security;
alter table public.consents enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert on public.consents to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_delete_own on public.profiles
  for delete to authenticated using (user_id = auth.uid());

-- Consent records are immutable evidence. Withdrawal is an additional row.
create policy consents_select_own on public.consents
  for select to authenticated using (user_id = auth.uid());
create policy consents_insert_own on public.consents
  for insert to authenticated with check (user_id = auth.uid());
