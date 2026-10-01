-- Daftar Barang Milik Negara.
-- Jalankan di SQL Editor Supabase, setelah schema.sql dan policies.sql.
-- Aman dijalankan berulang.
--
-- Tanpa skrip ini halaman Aset tetap berfungsi, tetapi data BMN hanya tersimpan
-- di browser yang mengunggahnya. Aplikasi memberi tahu bila itu yang terjadi.
--
-- Nama kolom sengaja sama persis dengan bentuk record di src/lib/assetWorkbook.js
-- (toRemoteAsset / mapRemoteAsset), jadi tidak ada pemetaan tambahan.

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

notify pgrst, 'reload schema';
