-- Agenda Kalan module.
-- Run once in the Supabase SQL Editor, AFTER schema.sql and policies.sql
-- (this script uses current_profile_role() / current_profile_division() from policies.sql).

create table if not exists public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  division_id text not null default 'pr' references public.divisions(id) on delete cascade,
  category_id text not null default 'agenda-kalan',
  title text not null,
  description text,
  location text,
  organizer text,
  attendees text,
  event_date date not null,
  end_date date,
  start_time time,
  end_time time,
  all_day boolean not null default false,
  event_type text not null default 'rapat'
    check (event_type in ('rapat', 'kunjungan', 'pemeriksaan', 'sosialisasi', 'upacara', 'lainnya')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'done', 'cancelled')),
  visibility text not null default 'public'
    check (visibility in ('public', 'division', 'restricted')),
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agenda_events
  add column if not exists visibility text not null default 'public';

-- Kegiatan berhari-hari: event_date adalah tanggal mulai, end_date tanggal
-- selesai. Kosong berarti kegiatannya hanya sehari.
alter table public.agenda_events
  add column if not exists end_date date;

do $do$
begin
  alter table public.agenda_events
    add constraint agenda_events_end_date_check
    check (end_date is null or end_date >= event_date);
exception
  when duplicate_object then null;
end
$do$;

do $do$
begin
  alter table public.agenda_events
    add constraint agenda_events_visibility_check
    check (visibility in ('public', 'division', 'restricted'));
exception
  when duplicate_object then null;
end
$do$;

create index if not exists agenda_events_division_date_idx
  on public.agenda_events (division_id, event_date);

alter table public.agenda_events enable row level security;

drop policy if exists "Authenticated users can read agenda" on public.agenda_events;
drop policy if exists "Users can create agenda" on public.agenda_events;
drop policy if exists "Owners and admins can update agenda" on public.agenda_events;
drop policy if exists "Owners and admins can delete agenda" on public.agenda_events;

-- Visibility ditegakkan di database, bukan hanya di UI.
create policy "Authenticated users can read agenda"
  on public.agenda_events for select to authenticated
  using (
    visibility = 'public'
    or created_by = auth.uid()
    or public.current_profile_role() = 'admin'
    or (visibility = 'division' and division_id = public.current_profile_division())
  );

create policy "Users can create agenda"
  on public.agenda_events for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.current_profile_role() = 'admin'
      or division_id = public.current_profile_division()
    )
  );

create policy "Owners and admins can update agenda"
  on public.agenda_events for update to authenticated
  using (created_by = auth.uid() or public.current_profile_role() = 'admin')
  with check (created_by = auth.uid() or public.current_profile_role() = 'admin');

create policy "Owners and admins can delete agenda"
  on public.agenda_events for delete to authenticated
  using (created_by = auth.uid() or public.current_profile_role() = 'admin');

-- Enable realtime so the calendar updates for everyone without a refresh.
do $do$
begin
  alter publication supabase_realtime add table public.agenda_events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$do$;

-- Kategori "Agenda Kalan" kini berisi jadwal kegiatan, bukan dokumen.
-- Dokumen yang terlanjur tersimpan di sana dipindahkan ke Tata Usaha Kalan.
update public.documents
set category_id = 'tata-usaha-kalan', updated_at = now()
where division_id = 'pr' and category_id = 'agenda-kalan';

update public.document_categories
set description = 'Jadwal kegiatan dan agenda pimpinan Kalan.'
where division_id = 'pr' and id = 'agenda-kalan';

-- PostgREST menyimpan cache skema. Tanpa baris ini kolom yang baru ditambahkan
-- masih bisa dilaporkan "could not find the column ... in the schema cache".
notify pgrst, 'reload schema';
