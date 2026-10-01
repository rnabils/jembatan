import {
  Building2,
  BookOpen,
  CalendarDays,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  Users
} from 'lucide-react'

export const SERVICE_META = {
  'realisasi-anggaran': { title: 'Realisasi Anggaran', subtitle: 'Persentase Realisasi', color: '#2563eb', icon: Users },
  'sisa-anggaran': { title: 'Sisa Anggaran', subtitle: 'Persentase Sisa', color: '#16a34a', icon: GraduationCap },
  'belanja-pegawai': { title: 'Belanja Pegawai', subtitle: 'Pengeluaran Bulan Ini', color: '#7c3aed', icon: Users },
  'belanja-barang': { title: 'Belanja Barang', subtitle: 'Pengeluaran Bulan Ini', color: '#f97316', icon: BookOpen },
  'belanja-modal': { title: 'Belanja Modal', subtitle: 'Pengadaan Aset', color: '#0ea5e9', icon: Building2 },
  bezetting: { title: 'Bezetting', subtitle: 'Pegawai Riil', color: '#2563eb', icon: Users },
  diklat: { title: 'Diklat', subtitle: 'Pelatihan Bulan Ini', color: '#16a34a', icon: GraduationCap },
  'manajemen-pengetahuan': { title: 'Manajemen Pengetahuan', subtitle: 'Materi / Knowledge Item', color: '#7c3aed', icon: BookOpen },
  klinik: { title: 'Klinik', subtitle: 'Layanan Bulan Ini', color: '#f97316', icon: HeartPulse },
  mcu: { title: 'MCU', subtitle: 'Medical Check Up', color: '#f59e0b', icon: HeartPulse },
  'agenda-kalan': { title: 'Agenda Kalan', subtitle: 'Jadwal Kegiatan', color: '#2563eb', icon: CalendarDays },
  'tata-usaha-kalan': { title: 'Tata Usaha Kalan', subtitle: 'Administrasi Pimpinan', color: '#0ea5e9', icon: FileText },
  'publikasi-pemberitaan': { title: 'Publikasi dan Pemberitaan', subtitle: 'Berita & Publikasi', color: '#7c3aed', icon: BookOpen },
  'dokumentasi-kegiatan': { title: 'Dokumentasi Kegiatan', subtitle: 'Dokumentasi Kegiatan', color: '#16a34a', icon: FileText },
  'arsip-pemeriksaan': { title: 'Arsip Pemeriksaan', subtitle: 'Berkas Pemeriksaan', color: '#f97316', icon: FolderOpen },
  perpustakaan: { title: 'Perpustakaan', subtitle: 'Referensi & Arsip', color: '#8b5cf6', icon: BookOpen },
  jdih: { title: 'JDIH', subtitle: 'Dokumen Hukum', color: '#2563eb', icon: FileText },
  'legislasi-review-mou': { title: 'Legislasi / Review MOU', subtitle: 'Telaah Regulasi', color: '#16a34a', icon: ShieldCheck },
  perjanjian: { title: 'Perjanjian', subtitle: 'Kerja Sama & Kontrak', color: '#7c3aed', icon: Building2 },
  'manajemen-risiko': { title: 'Manajemen Risiko', subtitle: 'Mitigasi Risiko', color: '#f97316', icon: ShieldCheck },
  aset: { title: 'Aset', subtitle: 'Inventaris & Aset', color: '#2563eb', icon: Building2 },
  arsip: { title: 'Arsip', subtitle: 'Penyimpanan Digital', color: '#0ea5e9', icon: FolderOpen },
  'pengadaan-barang-jasa': { title: 'Pengadaan Barang/Jasa', subtitle: 'Pengadaan & Evaluasi', color: '#16a34a', icon: Building2 },
  'peminjaman-aset': { title: 'Peminjaman Aset', subtitle: 'Pinjam Pakai Aset', color: '#f59e0b', icon: Users }
}