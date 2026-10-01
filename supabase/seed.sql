-- Safe demo/staging data for the BPK office dashboard.
-- Run this after schema.sql in Supabase SQL Editor.
-- No passwords or service-role credentials are stored here.

insert into public.divisions (id, name, short_name, description, color)
values
  ('hr', 'Sumber Daya Manusia', 'SDM', 'Employee records, recruitment, and personnel development.', '#00A99D'),
  ('finance', 'Keuangan', 'Finance', 'Budget planning, disbursement, and financial reporting.', '#003366'),
  ('legal', 'Hukum', 'Legal', 'Regulations, legal opinions, and compliance matters.', '#00A99D'),
  ('it', 'Umum dan TI', 'IT', 'Systems, infrastructure, and digital services support.', '#003366'),
  ('pr', 'Humas dan TU Kalan', 'PR', 'Public communication, media relations, and publications.', '#00A99D'),
  ('planning', 'Planning & Development', 'Planning', 'Strategic planning, audit programs, and performance monitoring.', '#003366'),
  ('archives', 'Archives & Records', 'Archives', 'Document custody, records retention, and retrieval services.', '#00A99D'),
  ('general', 'General Affairs', 'General', 'Facilities, procurement, and internal logistics.', '#003366')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  color = excluded.color;

insert into public.document_categories (division_id, id, name, description)
values
  ('finance', 'realisasi-anggaran', 'Realisasi Anggaran', 'Dokumen realisasi anggaran dan laporan pelaksanaan.'),
  ('finance', 'belanja-pegawai', 'Belanja Pegawai', 'Dokumen belanja pegawai dan administrasi pembayaran.'),
  ('finance', 'belanja-barang', 'Belanja Barang', 'Dokumen pengeluaran operasional dan belanja barang.'),
  ('finance', 'belanja-modal', 'Belanja Modal', 'Dokumen pengadaan aset dan belanja modal.'),
  ('finance', 'sisa-anggaran', 'Sisa Anggaran', 'Dokumen pemantauan sisa anggaran dan proyeksi.'),
  ('hr', 'bezetting', 'Bezetting', 'Dokumen data formasi, kebutuhan, dan distribusi pegawai.'),
  ('hr', 'diklat', 'Diklat', 'Dokumen pelatihan, sertifikasi, dan pengembangan pegawai.'),
  ('hr', 'manajemen-pengetahuan', 'Manajemen Pengetahuan', 'Dokumen knowledge sharing dan basis pengetahuan.'),
  ('hr', 'klinik', 'Klinik', 'Dokumen layanan klinik pegawai dan kesehatan kerja.'),
  ('hr', 'mcu', 'MCU', 'Dokumen medical check up dan pemantauan kesehatan.'),
  ('pr', 'agenda-kalan', 'Agenda Kalan', 'Jadwal kegiatan dan agenda pimpinan Kalan.'),
  ('pr', 'tata-usaha-kalan', 'Tata Usaha Kalan', 'Dokumen tata usaha, disposisi, dan administrasi pimpinan.'),
  ('pr', 'publikasi-pemberitaan', 'Publikasi dan Pemberitaan', 'Dokumen publikasi resmi dan pemberitaan internal.'),
  ('pr', 'dokumentasi-kegiatan', 'Dokumentasi Kegiatan', 'Dokumen foto, video, dan laporan kegiatan.'),
  ('pr', 'arsip-pemeriksaan', 'Arsip Pemeriksaan', 'Dokumen arsip pemeriksaan dan referensi kerja.'),
  ('pr', 'perpustakaan', 'Perpustakaan', 'Dokumen referensi, literatur, dan katalog perpustakaan.'),
  ('legal', 'jdih', 'JDIH', 'Dokumen Jaringan Dokumentasi dan Informasi Hukum.'),
  ('legal', 'legislasi-review-mou', 'Legislasi / Review MOU', 'Dokumen telaah regulasi dan review kerja sama.'),
  ('legal', 'perjanjian', 'Perjanjian', 'Dokumen perjanjian, kontrak, dan kesepakatan kerja sama.'),
  ('legal', 'manajemen-risiko', 'Manajemen Risiko Perwakilan', 'Dokumen identifikasi dan mitigasi risiko.'),
  ('it', 'aset', 'Aset', 'Dokumen aset, inventaris, dan pemeliharaan.'),
  ('it', 'arsip', 'Arsip', 'Dokumen arsip internal dan penyimpanan digital.'),
  ('it', 'pengadaan-barang-jasa', 'Pengadaan Barang/Jasa', 'Dokumen pengadaan dan evaluasi vendor.'),
  ('it', 'peminjaman-aset', 'Peminjaman Aset', 'Dokumen peminjaman aset dan persetujuan penggunaan.')
on conflict (division_id, id) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.documents (
  id, division_id, category_id, title, description, file_name, file_type,
  file_size, document_number, document_date, year, status
)
values
  ('10000000-0000-4000-8000-000000000001', 'finance', 'realisasi-anggaran', 'Realisasi Anggaran Triwulan II 2026', 'Laporan realisasi anggaran dan capaian triwulan II.', 'realisasi-anggaran-tw2-2026.pdf', 'application/pdf', 1645020, 'BA-RA/II/2026/01', '2026-08-23', 2026, 'approved'),
  ('10000000-0000-4000-8000-000000000002', 'finance', 'belanja-barang', 'Rekap Belanja Barang Bulanan', 'Rekapitulasi belanja barang untuk kebutuhan operasional.', 'rekap-belanja-barang-2026.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 882340, 'BB/VI/2026/07', '2026-08-28', 2026, 'pending'),
  ('10000000-0000-4000-8000-000000000003', 'hr', 'diklat', 'Rencana Diklat Pegawai 2026', 'Agenda pelatihan dan pengembangan kompetensi pegawai.', 'rencana-diklat-2026.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 420512, 'HR-DIK/2026/03', '2026-08-16', 2026, 'approved'),
  ('10000000-0000-4000-8000-000000000004', 'hr', 'mcu', 'Jadwal MCU Pegawai Semester I', 'Jadwal medical check up dan daftar peserta.', 'jadwal-mcu-sem1-2026.pdf', 'application/pdf', 1024421, 'HR-MCU/2026/02', '2026-08-27', 2026, 'rejected'),
  ('10000000-0000-4000-8000-000000000005', 'pr', 'tata-usaha-kalan', 'Agenda Kalan Mingguan', 'Susunan agenda pimpinan untuk minggu berjalan.', 'agenda-kalan-mingguan-2026.pdf', 'application/pdf', 550221, 'PR-AK/2026/08', '2026-09-02', 2026, 'pending')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  rejection_reason = excluded.rejection_reason,
  updated_at = now();

update public.documents
set rejection_reason = 'Format daftar peserta belum lengkap.'
where id = '10000000-0000-4000-8000-000000000004';

insert into public.content (id, division_id, type, title, description, payload, status)
values
  ('20000000-0000-4000-8000-000000000001', 'finance', 'announcement', 'Realisasi Anggaran Triwulan II', 'Ringkasan capaian realisasi anggaran periode berjalan.', '{"priority":"high","audience":"all"}'::jsonb, 'approved'),
  ('20000000-0000-4000-8000-000000000002', 'hr', 'event', 'Workshop Pengembangan Kompetensi Pegawai', 'Kegiatan pengembangan kompetensi pegawai internal.', '{"date":"2026-09-18","location":"Ruang Rapat Utama"}'::jsonb, 'approved'),
  ('20000000-0000-4000-8000-000000000003', 'pr', 'announcement', 'Agenda Pimpinan Minggu Ini', 'Informasi agenda kegiatan pimpinan dan koordinasi internal.', '{"priority":"normal","audience":"internal"}'::jsonb, 'pending')
on conflict (id) do update set
  division_id = excluded.division_id,
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now()
;

-- Budget snapshot from public/data/anggaran.xlsx.
-- The current frontend still reads the Excel file; this view is ready for the next migration.
create table if not exists public.budget_snapshots (
  id bigint generated by default as identity primary key,
  fiscal_year integer not null,
  total_pagu numeric(20,2) not null,
  total_realisasi numeric(20,2) not null,
  total_sisa numeric(20,2) not null,
  realisasi_percent numeric(6,2) not null,
  sisa_percent numeric(6,2) not null,
  source_file text,
  created_at timestamptz not null default now(),
  unique (fiscal_year, source_file)
);

insert into public.budget_snapshots (
  fiscal_year, total_pagu, total_realisasi, total_sisa,
  realisasi_percent, sisa_percent, source_file
)
values (2026, 19556561000, 11133941335, 8422619665, 57, 43, 'anggaran.xlsx')
on conflict (fiscal_year, source_file) do update set
  total_pagu = excluded.total_pagu,
  total_realisasi = excluded.total_realisasi,
  total_sisa = excluded.total_sisa,
  realisasi_percent = excluded.realisasi_percent,
  sisa_percent = excluded.sisa_percent;

alter table public.budget_snapshots enable row level security;

drop policy if exists "Authenticated users can read budget snapshots" on public.budget_snapshots;
create policy "Authenticated users can read budget snapshots"
  on public.budget_snapshots for select to authenticated using (true);
