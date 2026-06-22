-- Event Operations System shared-link prototype schema
create extension if not exists pgcrypto;

create table if not exists public.event_plans (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null default 'default-workspace',
  name text not null default 'Untitled event',
  event_date date null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.artist_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_name text not null default '',
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  genre text not null default '',
  description text not null default '',
  image_url text not null default '',
  availability text not null default '',
  availability_start_time text not null default '',
  availability_end_time text not null default '',
  preferred_fee numeric not null default 0,
  technical_needs text not null default '',
  hospitality_needs text not null default '',
  notes text not null default '',
  links jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'interested', 'contacted', 'booked', 'rejected', 'archived')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.project_management_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text not null default 'idea' check (status in ('idea', 'planning', 'in-progress', 'waiting', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  owner text not null default '',
  due_date date null,
  linked_event_id uuid null,
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_management_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid null references public.project_management_projects(id) on delete set null,
  title text not null default '',
  status text not null default 'pending' check (status in ('pending', 'doing', 'done', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  owner text not null default '',
  due_date date null,
  linked_event_id uuid null,
  notes text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ui_studio_presets (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null default 'default-workspace',
  name text not null default 'Saved preset',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_plans_owner_date on public.event_plans(owner_key, event_date);
create index if not exists idx_artist_submissions_status on public.artist_submissions(status);
create index if not exists idx_projects_event on public.project_management_projects(linked_event_id);
create index if not exists idx_tasks_event_status on public.project_management_tasks(linked_event_id, status);
create index if not exists idx_ui_studio_presets_owner_updated on public.ui_studio_presets(owner_key, updated_at desc);

alter table public.event_plans enable row level security;
alter table public.artist_submissions enable row level security;
alter table public.project_management_projects enable row level security;
alter table public.project_management_tasks enable row level security;
alter table public.ui_studio_presets enable row level security;

-- Prototype policies: anonymous shared-link access. Harden before production.
drop policy if exists "prototype select event plans" on public.event_plans;
create policy "prototype select event plans" on public.event_plans for select to anon using (true);
drop policy if exists "prototype insert event plans" on public.event_plans;
create policy "prototype insert event plans" on public.event_plans for insert to anon with check (true);
drop policy if exists "prototype update event plans" on public.event_plans;
create policy "prototype update event plans" on public.event_plans for update to anon using (true) with check (true);
drop policy if exists "prototype delete event plans" on public.event_plans;
create policy "prototype delete event plans" on public.event_plans for delete to anon using (true);

drop policy if exists "prototype select artists" on public.artist_submissions;
create policy "prototype select artists" on public.artist_submissions for select to anon using (true);
drop policy if exists "prototype insert artists" on public.artist_submissions;
create policy "prototype insert artists" on public.artist_submissions for insert to anon with check (true);
drop policy if exists "prototype update artists" on public.artist_submissions;
create policy "prototype update artists" on public.artist_submissions for update to anon using (true) with check (true);
drop policy if exists "prototype delete artists" on public.artist_submissions;
create policy "prototype delete artists" on public.artist_submissions for delete to anon using (true);

drop policy if exists "prototype select projects" on public.project_management_projects;
create policy "prototype select projects" on public.project_management_projects for select to anon using (true);
drop policy if exists "prototype insert projects" on public.project_management_projects;
create policy "prototype insert projects" on public.project_management_projects for insert to anon with check (true);
drop policy if exists "prototype update projects" on public.project_management_projects;
create policy "prototype update projects" on public.project_management_projects for update to anon using (true) with check (true);
drop policy if exists "prototype delete projects" on public.project_management_projects;
create policy "prototype delete projects" on public.project_management_projects for delete to anon using (true);

drop policy if exists "prototype select tasks" on public.project_management_tasks;
create policy "prototype select tasks" on public.project_management_tasks for select to anon using (true);
drop policy if exists "prototype insert tasks" on public.project_management_tasks;
create policy "prototype insert tasks" on public.project_management_tasks for insert to anon with check (true);
drop policy if exists "prototype update tasks" on public.project_management_tasks;
create policy "prototype update tasks" on public.project_management_tasks for update to anon using (true) with check (true);
drop policy if exists "prototype delete tasks" on public.project_management_tasks;
create policy "prototype delete tasks" on public.project_management_tasks for delete to anon using (true);

drop policy if exists "prototype select ui presets" on public.ui_studio_presets;
create policy "prototype select ui presets" on public.ui_studio_presets for select to anon using (true);
drop policy if exists "prototype insert ui presets" on public.ui_studio_presets;
create policy "prototype insert ui presets" on public.ui_studio_presets for insert to anon with check (true);
drop policy if exists "prototype update ui presets" on public.ui_studio_presets;
create policy "prototype update ui presets" on public.ui_studio_presets for update to anon using (true) with check (true);
drop policy if exists "prototype delete ui presets" on public.ui_studio_presets;
create policy "prototype delete ui presets" on public.ui_studio_presets for delete to anon using (true);

insert into storage.buckets (id, name, public)
values ('artist-images', 'artist-images', true)
on conflict (id) do update set public = true;

drop policy if exists "prototype artist image read" on storage.objects;
create policy "prototype artist image read" on storage.objects for select to anon using (bucket_id = 'artist-images');
drop policy if exists "prototype artist image upload" on storage.objects;
create policy "prototype artist image upload" on storage.objects for insert to anon with check (bucket_id = 'artist-images');
drop policy if exists "prototype artist image update" on storage.objects;
create policy "prototype artist image update" on storage.objects for update to anon using (bucket_id = 'artist-images') with check (bucket_id = 'artist-images');
drop policy if exists "prototype artist image delete" on storage.objects;
create policy "prototype artist image delete" on storage.objects for delete to anon using (bucket_id = 'artist-images');
