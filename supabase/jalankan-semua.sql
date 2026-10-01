-- ============================================================================
-- JEMBATAN - migrasi susulan, sekali jalan
-- ============================================================================
-- Berkas ini menggabungkan seluruh perubahan basis data yang belum dijalankan
-- sejak schema.sql, seed.sql, dan policies.sql. Salin seluruh isinya ke SQL
-- Editor Supabase, jalankan sekali, lalu lihat tabel hasil di bagian akhir.
--
-- Urutannya sudah disusun sesuai ketergantungan dan setiap bagian aman
-- dijalankan berulang, jadi tidak masalah bila sebagian sudah pernah
-- dijalankan lewat berkas terpisah.
--
-- TIDAK termasuk di sini: users.sql dan set-role.sql. Keduanya membuat dan
-- mengatur akun, butuh kata sandi yang Anda ketik sendiri saat menjalankannya,
-- jadi sengaja dibiarkan terpisah.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Fungsi bantu
-- ----------------------------------------------------------------------------
-- Dipakai oleh hampir semua kebijakan di bawah. Aslinya dari policies.sql dan
-- seharusnya sudah ada; ditulis ulang di sini supaya berkas ini berdiri
-- sendiri dan tidak gagal di tengah jalan bila ternyata belum ada.

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select role from public.profiles where id = auth.uid();
$fn$;

create or replace function public.current_profile_division()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select division_id from public.profiles where id = auth.uid();
$fn$;


-- ----------------------------------------------------------------------------
-- 1. Status arsip pada dokumen
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: kartu Aktif / Inaktif / Musnah pada layanan Arsip.
-- Bila dilewat: SELURUH unggahan dokumen gagal, bukan hanya di Arsip, karena
-- aplikasi selalu mengirim kolom ini dan PostgREST menolak kolom yang tak
-- dikenal. Ini bagian paling mendesak dari berkas ini.
--
-- Kolom ini sumbu terpisah dari public.documents.status yang mengatur alur
-- persetujuan: sebuah arsip bisa berstatus 'approved' sekaligus 'musnah'.
-- Dibiarkan nullable karena hanya bermakna untuk kategori 'arsip'.

alter table public.documents
  add column if not exists archive_status text;

do $do$
begin
  alter table public.documents
    add constraint documents_archive_status_check
    check (archive_status is null or archive_status in ('aktif', 'inaktif', 'musnah'));
exception
  when duplicate_object then null;
end
$do$;

-- Arsip lama yang belum berstatus dianggap aktif, sama seperti di aplikasi.
update public.documents
set archive_status = 'aktif'
where category_id = 'arsip' and archive_status is null;

create index if not exists documents_archive_status_idx
  on public.documents (category_id, archive_status);


-- ----------------------------------------------------------------------------
-- 2. Izin unggah berkas untuk admin
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: galat "new row violates row-level security policy" saat
-- admin mengunggah berkas.
-- Bila dilewat: admin tetap tidak bisa mengunggah berkas ke bidang mana pun.
--
-- Penyebabnya, kebijakan lama hanya membandingkan nama folder dengan bidang
-- pengunggah. Profil admin tidak terikat satu bidang, sehingga division-nya
-- null dan perbandingannya menghasilkan null - yang oleh RLS diperlakukan
-- sebagai ditolak. Jalur khusus admin ditambahkan di depan.

drop policy if exists "Users can upload document files" on storage.objects;

create policy "Users can upload document files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (
      public.current_profile_role() = 'admin'
      or (storage.foldername(name))[1] = public.current_profile_division()
    )
  );


-- ----------------------------------------------------------------------------
-- 3. Agenda berhari-hari
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: kegiatan yang berlangsung beberapa hari, misalnya 31
-- Agustus sampai 5 September.
-- Bila dilewat: agenda baru gagal disimpan ke server dan hanya tersimpan di
-- browser yang membuatnya.
--
-- Seluruh bagian agenda ditulis ulang di sini, bukan hanya kolom barunya,
-- supaya berkas ini tetap benar walau supabase/agenda.sql belum pernah
-- dijalankan. Semuanya "if not exists", jadi data yang sudah ada tidak
-- tersentuh.

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

-- event_date adalah tanggal mulai, end_date tanggal selesai. Kosong berarti
-- kegiatannya hanya sehari.
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

-- Visibility ditegakkan di database, bukan hanya di tampilan.
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

-- Realtime supaya kalender ikut berubah tanpa perlu memuat ulang halaman.
do $do$
begin
  alter publication supabase_realtime add table public.agenda_events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$do$;

-- Kategori "Agenda Kalan" kini berisi jadwal kegiatan, bukan dokumen. Dokumen
-- yang terlanjur tersimpan di sana dipindahkan ke Tata Usaha Kalan.
update public.documents
set category_id = 'tata-usaha-kalan', updated_at = now()
where division_id = 'pr' and category_id = 'agenda-kalan';

update public.document_categories
set description = 'Jadwal kegiatan dan agenda pimpinan Kalan.'
where division_id = 'pr' and id = 'agenda-kalan';


-- ----------------------------------------------------------------------------
-- 4. Daftar Barang Milik Negara
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: portal BMN pada layanan Aset di bidang Umum dan TI.
-- Bila dilewat: halaman Aset tetap berfungsi, tetapi datanya hanya tersimpan
-- di browser yang mengunggahnya dan tidak terlihat oleh pengguna lain.
-- Aplikasi memberi tahu bila itu yang terjadi.
--
-- Nama kolom sengaja sama persis dengan bentuk record di
-- src/lib/assetWorkbook.js (toRemoteAsset / mapRemoteAsset), jadi tidak ada
-- pemetaan tambahan.

create table if not exists public.assets (
  id text primary key,
  division_id text not null default 'it' references public.divisions(id) on delete cascade,
  kode_barang text,
  nup text,
  nama_barang text not null,
  jenis_bmn text,
  kode_satker text,
  nama_satker text,
  status_bmn text,
  merk text,
  tipe text,
  kondisi text,
  umur_aset numeric not null default 0,
  intra_extra text,
  tanggal_perolehan date,
  nilai_perolehan numeric not null default 0,
  nilai_penyusutan numeric not null default 0,
  nilai_buku numeric not null default 0,
  status_penggunaan text,
  no_psp text,
  tanggal_psp date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_division_jenis_idx on public.assets (division_id, jenis_bmn);
create index if not exists assets_nama_idx on public.assets (nama_barang);

alter table public.assets enable row level security;

drop policy if exists "Authenticated users can read assets" on public.assets;
drop policy if exists "Umum dan TI can write assets" on public.assets;
drop policy if exists "Umum dan TI can update assets" on public.assets;
drop policy if exists "Umum dan TI can delete assets" on public.assets;

-- Daftar BMN dibaca semua pengguna portal; yang mengubahnya hanya admin dan
-- pegawai bidang pemilik asetnya.
create policy "Authenticated users can read assets"
  on public.assets for select to authenticated using (true);

create policy "Umum dan TI can write assets"
  on public.assets for insert to authenticated
  with check (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = division_id
  );

create policy "Umum dan TI can update assets"
  on public.assets for update to authenticated
  using (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = division_id
  )
  with check (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = division_id
  );

-- Unggah ulang berkas aset mengganti seluruh daftar bidang tersebut, jadi izin
-- hapus diperlukan agar aset yang sudah dicoret dari catatan ikut hilang.
create policy "Umum dan TI can delete assets"
  on public.assets for delete to authenticated
  using (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = division_id
  );


-- ----------------------------------------------------------------------------
-- 5. Anggaran yang bisa diperbarui dari berkas Excel
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: mengganti berkas Excel anggaran dengan yang terbaru
-- memperbarui angka untuk semua pengguna, termasuk rincian per kode 51 / 52 /
-- 53 di Belanja Pegawai, Belanja Barang, dan Belanja Modal.
-- Bila dilewat: angka anggaran hasil unggahan hanya tersimpan di browser yang
-- mengunggahnya.
--
-- Sebelumnya budget_snapshots hanya bisa dibaca dan tidak menyimpan rincian
-- per kode, sehingga perlu kolom rincian dan izin tulis.

alter table public.budget_snapshots
  add column if not exists breakdown jsonb not null default '[]'::jsonb;

alter table public.budget_snapshots
  add column if not exists updated_at timestamptz not null default now();

-- upsert memakai fiscal_year sebagai kunci, jadi kolomnya harus unik.
do $do$
begin
  alter table public.budget_snapshots
    add constraint budget_snapshots_fiscal_year_key unique (fiscal_year);
exception
  when duplicate_table then null;
  when duplicate_object then null;
end
$do$;

drop policy if exists "Finance and admin can write budget snapshots" on public.budget_snapshots;
drop policy if exists "Finance and admin can update budget snapshots" on public.budget_snapshots;

-- Hanya admin dan pegawai bidang Keuangan yang boleh mengubah angka anggaran.
create policy "Finance and admin can write budget snapshots"
  on public.budget_snapshots for insert to authenticated
  with check (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = 'finance'
  );

create policy "Finance and admin can update budget snapshots"
  on public.budget_snapshots for update to authenticated
  using (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = 'finance'
  )
  with check (
    public.current_profile_role() = 'admin'
    or public.current_profile_division() = 'finance'
  );


-- ----------------------------------------------------------------------------
-- 6. Penamaan bidang
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: nama bidang di basis data disamakan dengan yang dipakai
-- aplikasi (src/data/seed.js).
-- Bila dilewat: sidebar dan judul halaman menampilkan nama lama bagi pengguna
-- yang datanya diambil dari server.
--
-- Singkatan bidang 'pr' tetap PR; yang berubah hanya nama panjangnya.

update public.divisions
set name = 'Sumber Daya Manusia', short_name = 'SDM'
where id = 'hr';

update public.divisions
set name = 'Humas dan TU Kalan'
where id = 'pr';


-- ----------------------------------------------------------------------------
-- 7. Metadata kerja sama pada layanan Legislasi / Review MOU
-- ----------------------------------------------------------------------------
-- Yang diperbaiki: jenis dokumen, pihak terkait, dan masa berlaku pada layanan
-- Legislasi / Review MOU, beserta pemantauan dokumen yang akan berakhir.
-- Bila dilewat: unggahan pada layanan itu gagal, karena aplikasi mengirim
-- ketiga kolom ini dan PostgREST menolak kolom yang tidak dikenal.
--
-- Ketiganya nullable dan hanya bermakna untuk kategori legislasi-review-mou;
-- dokumen kategori lain tetap null. Statusnya (Aktif / Review / Berakhir)
-- sengaja tidak disimpan - dihitung dari valid_until, supaya tidak basi begitu
-- tanggalnya lewat tanpa ada yang menyunting dokumennya.

alter table public.documents
  add column if not exists agreement_type text;

alter table public.documents
  add column if not exists counterparty text;

alter table public.documents
  add column if not exists valid_until date;

do $do$
begin
  alter table public.documents
    add constraint documents_agreement_type_check
    check (agreement_type is null or agreement_type in ('mou', 'perjanjian', 'review'));
exception
  when duplicate_object then null;
end
$do$;

-- Pemantauan selalu mengurutkan dari yang paling dekat berakhir.
create index if not exists documents_valid_until_idx
  on public.documents (category_id, valid_until);


-- ----------------------------------------------------------------------------
-- 8. Muat ulang cache skema
-- ----------------------------------------------------------------------------
-- PostgREST menyimpan cache skema. Tanpa baris ini kolom yang baru ditambahkan
-- masih bisa dilaporkan "could not find the column ... in the schema cache".

notify pgrst, 'reload schema';


-- ----------------------------------------------------------------------------
-- 9. Pemeriksaan hasil
-- ----------------------------------------------------------------------------
-- Semua baris harus berbunyi OK. Yang masih BELUM berarti bagian itu gagal dan
-- perlu dilihat pesan galatnya di atas.

select 'Status arsip (documents.archive_status)' as bagian,
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'documents'
           and column_name = 'archive_status'
       ) then 'OK' else 'BELUM' end as hasil
union all
select 'Izin unggah berkas untuk admin',
       case when exists (
         select 1 from pg_policies
         where schemaname = 'storage' and tablename = 'objects'
           and policyname = 'Users can upload document files'
           and with_check like '%current_profile_role%'
       ) then 'OK' else 'BELUM' end
union all
select 'Agenda berhari-hari (agenda_events.end_date)',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'agenda_events'
           and column_name = 'end_date'
       ) then 'OK' else 'BELUM' end
union all
select 'Tabel aset (public.assets)',
       case when to_regclass('public.assets') is not null
       then 'OK' else 'BELUM' end
union all
select 'Rincian anggaran (budget_snapshots.breakdown)',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'budget_snapshots'
           and column_name = 'breakdown'
       ) then 'OK' else 'BELUM' end
union all
select 'Izin tulis anggaran',
       case when exists (
         select 1 from pg_policies
         where schemaname = 'public' and tablename = 'budget_snapshots'
           and policyname = 'Finance and admin can write budget snapshots'
       ) then 'OK' else 'BELUM' end
union all
select 'Nama bidang SDM',
       case when exists (
         select 1 from public.divisions where id = 'hr' and short_name = 'SDM'
       ) then 'OK' else 'BELUM' end
union all
select 'Nama bidang Humas dan TU Kalan',
       case when exists (
         select 1 from public.divisions where id = 'pr' and name = 'Humas dan TU Kalan'
       ) then 'OK' else 'BELUM' end
union all
select 'Metadata kerja sama (documents.valid_until)',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'documents'
           and column_name in ('agreement_type', 'counterparty', 'valid_until')
         group by table_name
         having count(*) = 3
       ) then 'OK' else 'BELUM' end
order by 1;
