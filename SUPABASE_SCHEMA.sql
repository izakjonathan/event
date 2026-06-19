-- Event Planner Calculator schema
-- Run this in Supabase SQL editor before adding env vars to Vercel.
-- v2 stores every event plan as one JSON payload row and groups shared events by owner_key/workspace.

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

-- Simple anonymous shared-workspace policy.
-- Anyone with the same workspace link can read/edit that workspace.
-- For stronger access control later, replace this with Supabase Auth user_id policies.
drop policy if exists "event_plans_select_anon" on public.event_plans;
drop policy if exists "event_plans_insert_anon" on public.event_plans;
drop policy if exists "event_plans_update_anon" on public.event_plans;
drop policy if exists "event_plans_delete_anon" on public.event_plans;

create policy "event_plans_select_anon" on public.event_plans for select to anon using (true);
create policy "event_plans_insert_anon" on public.event_plans for insert to anon with check (true);
create policy "event_plans_update_anon" on public.event_plans for update to anon using (true) with check (true);
create policy "event_plans_delete_anon" on public.event_plans for delete to anon using (true);


-- v28 Artist Booking module
create table if not exists public.artist_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_name text not null,
  contact_name text null,
  email text not null,
  phone text null,
  genre text null,
  description text null,
  image_url text null,
  availability text null,
  preferred_fee text null,
  technical_needs text null,
  hospitality_needs text null,
  notes text null,
  links jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists artist_submissions_created_at_idx on public.artist_submissions(created_at desc);
create index if not exists artist_submissions_status_idx on public.artist_submissions(status);

alter table public.artist_submissions enable row level security;

drop policy if exists "artist_submissions_select_anon" on public.artist_submissions;
drop policy if exists "artist_submissions_insert_anon" on public.artist_submissions;
drop policy if exists "artist_submissions_update_anon" on public.artist_submissions;

create policy "artist_submissions_select_anon"
on public.artist_submissions
for select
to anon
using (true);

create policy "artist_submissions_insert_anon"
on public.artist_submissions
for insert
to anon
with check (true);

create policy "artist_submissions_update_anon"
on public.artist_submissions
for update
to anon
using (true)
with check (true);


-- v29 artist image storage
insert into storage.buckets (id, name, public)
values ('artist-images', 'artist-images', true)
on conflict (id) do update set public = true;

drop policy if exists "artist_images_public_read" on storage.objects;
drop policy if exists "artist_images_anon_upload" on storage.objects;
drop policy if exists "artist_images_anon_update" on storage.objects;

create policy "artist_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'artist-images');

create policy "artist_images_anon_upload"
on storage.objects
for insert
to anon
with check (bucket_id = 'artist-images');

create policy "artist_images_anon_update"
on storage.objects
for update
to anon
using (bucket_id = 'artist-images')
with check (bucket_id = 'artist-images');


-- v35 Artist submission availability times
alter table public.artist_submissions
add column if not exists availability_start_time text null,
add column if not exists availability_end_time text null;


-- v45 Project Management
create table if not exists public.project_management_projects (
  id uuid primary key,
  title text not null default 'Untitled project',
  status text not null default 'planning',
  priority text not null default 'medium',
  owner text not null default '',
  due_date date null,
  linked_event_id uuid null,
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_management_tasks (
  id uuid primary key,
  project_id uuid null,
  title text not null default 'Untitled task',
  status text not null default 'to-do',
  priority text not null default 'medium',
  owner text not null default '',
  due_date date null,
  linked_event_id uuid null,
  notes text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_management_projects_updated_idx on public.project_management_projects(updated_at desc);
create index if not exists project_management_projects_status_idx on public.project_management_projects(status);
create index if not exists project_management_tasks_updated_idx on public.project_management_tasks(updated_at desc);
create index if not exists project_management_tasks_status_idx on public.project_management_tasks(status);
create index if not exists project_management_tasks_project_idx on public.project_management_tasks(project_id);

alter table public.project_management_projects enable row level security;
alter table public.project_management_tasks enable row level security;

drop policy if exists "project_management_projects_select_anon" on public.project_management_projects;
drop policy if exists "project_management_projects_insert_anon" on public.project_management_projects;
drop policy if exists "project_management_projects_update_anon" on public.project_management_projects;
drop policy if exists "project_management_projects_delete_anon" on public.project_management_projects;

create policy "project_management_projects_select_anon" on public.project_management_projects for select to anon using (true);
create policy "project_management_projects_insert_anon" on public.project_management_projects for insert to anon with check (true);
create policy "project_management_projects_update_anon" on public.project_management_projects for update to anon using (true) with check (true);
create policy "project_management_projects_delete_anon" on public.project_management_projects for delete to anon using (true);

drop policy if exists "project_management_tasks_select_anon" on public.project_management_tasks;
drop policy if exists "project_management_tasks_insert_anon" on public.project_management_tasks;
drop policy if exists "project_management_tasks_update_anon" on public.project_management_tasks;
drop policy if exists "project_management_tasks_delete_anon" on public.project_management_tasks;

create policy "project_management_tasks_select_anon" on public.project_management_tasks for select to anon using (true);
create policy "project_management_tasks_insert_anon" on public.project_management_tasks for insert to anon with check (true);
create policy "project_management_tasks_update_anon" on public.project_management_tasks for update to anon using (true) with check (true);
create policy "project_management_tasks_delete_anon" on public.project_management_tasks for delete to anon using (true);


-- v52 Project Management task settings additions
alter table public.project_management_tasks
  add column if not exists image_urls jsonb not null default '[]'::jsonb;
