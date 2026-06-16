-- Event Planner Calculator schema
-- Run this in Supabase SQL editor before adding env vars to Vercel.

create table if not exists public.event_plans (
  id uuid primary key,
  owner_key text not null,
  name text not null default 'Untitled event',
  event_date date null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists event_plans_owner_key_idx on public.event_plans(owner_key);
create index if not exists event_plans_updated_at_idx on public.event_plans(updated_at desc);

alter table public.event_plans enable row level security;

-- Simple anonymous app policy. The app creates a private random owner_key in localStorage
-- and only queries rows with that key. For stronger multi-user auth, replace these policies
-- with Supabase Auth user_id policies.
drop policy if exists "event_plans_select_anon" on public.event_plans;
drop policy if exists "event_plans_insert_anon" on public.event_plans;
drop policy if exists "event_plans_update_anon" on public.event_plans;
drop policy if exists "event_plans_delete_anon" on public.event_plans;

create policy "event_plans_select_anon" on public.event_plans for select to anon using (true);
create policy "event_plans_insert_anon" on public.event_plans for insert to anon with check (true);
create policy "event_plans_update_anon" on public.event_plans for update to anon using (true) with check (true);
create policy "event_plans_delete_anon" on public.event_plans for delete to anon using (true);
