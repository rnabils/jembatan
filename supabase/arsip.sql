-- Sub bagian arsip: aktif / inaktif / musnah.
-- Jalankan di SQL Editor Supabase, setelah schema.sql. Aman diulang.
--
-- Kolom ini sumbu terpisah dari public.documents.status yang mengatur alur
-- persetujuan. Sebuah arsip bisa berstatus 'approved' sekaligus 'musnah'.
-- Dibiarkan nullable karena hanya bermakna untuk kategori 'arsip'; dokumen
-- kategori lain tetap null.

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

-- Arsip yang sudah ada tapi belum berstatus dianggap aktif, sama seperti
-- perlakuan di sisi aplikasi.
update public.documents
set archive_status = 'aktif'
where category_id = 'arsip' and archive_status is null;

create index if not exists documents_archive_status_idx
  on public.documents (category_id, archive_status);

-- PostgREST menyimpan cache skema; tanpa ini kolom baru bisa dilaporkan hilang.
notify pgrst, 'reload schema';
