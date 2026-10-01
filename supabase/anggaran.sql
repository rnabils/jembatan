-- Pembaruan anggaran dari berkas Excel yang diunggah.
-- Jalankan di SQL Editor Supabase, setelah seed.sql. Aman diulang.
--
-- Sebelumnya budget_snapshots hanya bisa dibaca dan tidak menyimpan rincian
-- per kode. Agar mengganti berkas Excel benar-benar memperbarui angka untuk
-- semua pengguna, tabelnya perlu kolom rincian dan izin tulis.

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

notify pgrst, 'reload schema';
