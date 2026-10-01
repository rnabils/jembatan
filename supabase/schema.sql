-- Initial Supabase schema for the BPK office dashboard.
-- Authentication is handled by Supabase Auth; app-specific user data lives in profiles.

create table public.divisions (
  id text primary key,
  name text not null,
  short_name text not null,
  description text,
  color text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text unique,
  email text,
  role text not null default 'viewer' check (role in ('admin', 'employee', 'viewer')),
  division_id text references public.divisions(id) on delete set null,
  position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_categories (
  id text not null,
  division_id text not null references public.divisions(id) on delete cascade,
  name text not null,
  description text,
  primary key (division_id, id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  division_id text not null references public.divisions(id),
  category_id text not null,
  title text not null,
  description text,
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  document_number text,
  document_date date,
  year integer,
  archive_status text check (archive_status is null or archive_status in ('aktif', 'inaktif', 'musnah')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (division_id, category_id)
    references public.document_categories(division_id, id)
);

create table public.content (
  id uuid primary key default gen_random_uuid(),
  division_id text references public.divisions(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_division_date_idx on public.documents (division_id, document_date desc);
create index documents_status_idx on public.documents (status);
create index content_division_created_idx on public.content (division_id, created_at desc);

alter table public.divisions enable row level security;
alter table public.profiles enable row level security;
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.content enable row level security;

create policy "Authenticated users can read divisions"
  on public.divisions for select to authenticated using (true);

create policy "Authenticated users can read categories"
  on public.document_categories for select to authenticated using (true);

create policy "Users can read their profile"
  on public.profiles for select to authenticated using (id = auth.uid());

create policy "Users can update their profile"
  on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Authenticated users can read documents"
  on public.documents for select to authenticated using (true);

create policy "Authenticated users can read content"
  on public.content for select to authenticated using (true);

-- Write policies should be replaced with role-aware database functions before production.
-- Keep authorization in the database rather than trusting a client-side role value.
