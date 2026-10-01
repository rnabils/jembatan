// Seed data for the BPK Internal Office Management Dashboard
// This acts as a mock database persisted to localStorage by the context providers.

export const DIVISIONS = [
  {
    id: 'hr',
    name: 'Sumber Daya Manusia',
    shortName: 'SDM',
    icon: 'Users',
    description: 'Employee records, recruitment, and personnel development.',
    color: '#00A99D'
  },
  {
    id: 'finance',
    name: 'Keuangan',
    shortName: 'Finance',
    icon: 'Wallet',
    description: 'Budget planning, disbursement, and financial reporting.',
    color: '#003366'
  },
  {
    id: 'legal',
    name: 'Hukum',
    shortName: 'Legal',
    icon: 'Scale',
    description: 'Regulations, legal opinions, and compliance matters.',
    color: '#00A99D'
  },
  {
    id: 'it',
    name: 'Umum dan TI',
    shortName: 'IT',
    icon: 'Monitor',
    description: 'Systems, infrastructure, and digital services support.',
    color: '#003366'
  },
  {
    id: 'pr',
    name: 'Humas dan TU Kalan',
    shortName: 'PR',
    icon: 'Megaphone',
    description: 'Public communication, media relations, and publications.',
    color: '#00A99D'
  },
  {
    id: 'planning',
    name: 'Planning & Development',
    shortName: 'Planning',
    icon: 'ClipboardList',
    description: 'Strategic planning, audit programs, and performance monitoring.',
    color: '#003366'
  },
  {
    id: 'archives',
    name: 'Archives & Records',
    shortName: 'Archives',
    icon: 'Archive',
    description: 'Document custody, records retention, and retrieval services.',
    color: '#00A99D'
  },
  {
    id: 'general',
    name: 'General Affairs',
    shortName: 'General',
    icon: 'Building2',
    description: 'Facilities, procurement, and internal logistics.',
    color: '#003366'
  }
]

export const DOCUMENT_STRUCTURE = [
  {
    divisionId: 'finance',
    title: 'Keuangan',
    categories: [
      { id: 'realisasi-anggaran', name: 'Realisasi Anggaran', description: 'Dokumen realisasi anggaran dan laporan pelaksanaan.' },
      { id: 'belanja-pegawai', name: 'Belanja Pegawai', description: 'Dokumen belanja pegawai dan administrasi pembayaran.' },
      { id: 'belanja-barang', name: 'Belanja Barang', description: 'Dokumen pengeluaran operasional dan belanja barang.' },
      { id: 'belanja-modal', name: 'Belanja Modal', description: 'Dokumen pengadaan aset dan belanja modal.' },
      { id: 'sisa-anggaran', name: 'Sisa Anggaran', description: 'Dokumen pemantauan sisa anggaran dan proyeksi.' }
    ]
  },
  {
    divisionId: 'hr',
    title: 'Sumber Daya Manusia',
    categories: [
      { id: 'bezetting', name: 'Bezetting', description: 'Dokumen data formasi, kebutuhan, dan distribusi pegawai.' },
      { id: 'diklat', name: 'Diklat', description: 'Dokumen pelatihan, sertifikasi, dan pengembangan pegawai.' },
      { id: 'manajemen-pengetahuan', name: 'Manajemen Pengetahuan', description: 'Dokumen knowledge sharing dan basis pengetahuan.' },
      { id: 'klinik', name: 'Klinik', description: 'Dokumen layanan klinik pegawai dan kesehatan kerja.' },
      { id: 'mcu', name: 'MCU', description: 'Dokumen medical check up dan pemantauan kesehatan.' }
    ]
  },
  {
    divisionId: 'pr',
    title: 'Humas dan TU Kalan',
    categories: [
      { id: 'agenda-kalan', name: 'Agenda Kalan', description: 'Jadwal kegiatan dan agenda pimpinan Kalan.' },
      { id: 'tata-usaha-kalan', name: 'Tata Usaha Kalan', description: 'Dokumen tata usaha, disposisi, dan administrasi pimpinan.' },
      { id: 'publikasi-pemberitaan', name: 'Publikasi dan Pemberitaan', description: 'Dokumen publikasi resmi dan pemberitaan internal.' },
      { id: 'dokumentasi-kegiatan', name: 'Dokumentasi Kegiatan', description: 'Dokumen foto, video, dan laporan kegiatan.' },
      { id: 'arsip-pemeriksaan', name: 'Arsip Pemeriksaan', description: 'Dokumen arsip pemeriksaan dan referensi kerja.' },
      { id: 'perpustakaan', name: 'Perpustakaan', description: 'Dokumen referensi, literatur, dan katalog perpustakaan.' }
    ]
  },
  {
    divisionId: 'legal',
    title: 'Hukum',
    categories: [
      { id: 'jdih', name: 'JDIH', description: 'Dokumen Jaringan Dokumentasi dan Informasi Hukum.' },
      { id: 'legislasi-review-mou', name: 'Legislasi / Review MOU', description: 'Dokumen telaah regulasi dan review kerja sama.' },
      { id: 'perjanjian', name: 'Perjanjian', description: 'Dokumen perjanjian, kontrak, dan kesepakatan kerja sama.' },
      { id: 'manajemen-risiko', name: 'Manajemen Risiko Perwakilan', description: 'Dokumen identifikasi dan mitigasi risiko perwakilan.' }
    ]
  },
  {
    divisionId: 'it',
    title: 'Umum dan TI',
    categories: [
      { id: 'aset', name: 'Aset', description: 'Dokumen aset, inventaris, dan pemeliharaan.' },
      { id: 'arsip', name: 'Arsip', description: 'Dokumen arsip internal dan penyimpanan digital.' },
      { id: 'pengadaan-barang-jasa', name: 'Pengadaan Barang/Jasa', description: 'Dokumen pengadaan dan evaluasi vendor.' },
      { id: 'peminjaman-aset', name: 'Peminjaman Aset', description: 'Dokumen peminjaman aset dan persetujuan penggunaan.' }
    ]
  }
]

// Layanan yang untuk sementara tidak ditampilkan. Definisinya di
// DOCUMENT_STRUCTURE, serviceContent.js, dan serviceMeta.js sengaja
// dibiarkan utuh, begitu pula dokumen yang sudah tersimpan di dalamnya -
// menghapus satu baris di sini cukup untuk memunculkannya kembali.
// Kuncinya berbentuk `divisionId:categoryId`.
export const HIDDEN_CATEGORIES = new Set([
  'it:peminjaman-aset'
])

export const BUDGET_SUMMARY = {
  fiscalYear: 2026,
  totalPagu: 9762828116912,
  totalRealisasi: 3392918204912,
  updatedAt: null
}

// content types: announcement, document, event, gallery, contact, file
let idCounter = 1
function nid(prefix) {
  return `${prefix}-${idCounter++}`
}

const today = new Date()
function daysAgo(n) {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function daysFromNow(n) {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function makeDocument({
  divisionId,
  categoryId,
  title,
  description,
  fileName,
  fileType,
  fileSize,
  documentNumber,
  documentDate,
  year,
  status,
  archiveStatus,
  uploadedBy,
  uploadedAt,
  rejectionReason
}) {
  return {
    id: nid('doc'),
    divisionId,
    categoryId,
    title,
    description,
    fileName,
    fileType,
    fileSize,
    documentNumber,
    documentDate,
    year,
    status,
    archiveStatus,
    uploadedBy,
    uploadedAt,
    rejectionReason,
    fileDataUrl: null
  }
}

BUDGET_SUMMARY.updatedAt = today.toISOString().slice(0, 10)

export const INITIAL_DOCUMENTS = [
  makeDocument({
    divisionId: 'finance',
    categoryId: 'realisasi-anggaran',
    title: 'Realisasi Anggaran Triwulan II 2026',
    description: 'Laporan realisasi anggaran dan capaian triwulan II.',
    fileName: 'realisasi-anggaran-tw2-2026.pdf',
    fileType: 'application/pdf',
    fileSize: 1645020,
    documentNumber: 'BA-RA/II/2026/01',
    documentDate: daysAgo(12),
    year: 2026,
    status: 'approved',
    uploadedBy: 'Andi Wijaya',
    uploadedAt: daysAgo(11)
  }),
  makeDocument({
    divisionId: 'finance',
    categoryId: 'belanja-barang',
    title: 'Rekap Belanja Barang Bulanan',
    description: 'Rekapitulasi belanja barang untuk kebutuhan operasional.',
    fileName: 'rekap-belanja-barang-2026.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 882340,
    documentNumber: 'BB/VI/2026/07',
    documentDate: daysAgo(8),
    year: 2026,
    status: 'pending',
    uploadedBy: 'Budi Santoso',
    uploadedAt: daysAgo(7)
  }),
  makeDocument({
    divisionId: 'hr',
    categoryId: 'diklat',
    title: 'Rencana Diklat Pegawai 2026',
    description: 'Agenda pelatihan dan pengembangan kompetensi pegawai.',
    fileName: 'rencana-diklat-2026.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 420512,
    documentNumber: 'HR-DIK/2026/03',
    documentDate: daysAgo(20),
    year: 2026,
    status: 'approved',
    uploadedBy: 'Siti Rahmawati',
    uploadedAt: daysAgo(19)
  }),
  makeDocument({
    divisionId: 'hr',
    categoryId: 'mcu',
    title: 'Jadwal MCU Pegawai Semester I',
    description: 'Jadwal medical check up dan daftar peserta.',
    fileName: 'jadwal-mcu-sem1-2026.pdf',
    fileType: 'application/pdf',
    fileSize: 1024421,
    documentNumber: 'HR-MCU/2026/02',
    documentDate: daysAgo(9),
    year: 2026,
    status: 'rejected',
    uploadedBy: 'Siti Rahmawati',
    uploadedAt: daysAgo(8),
    rejectionReason: 'Format daftar peserta belum lengkap.'
  }),
  makeDocument({
    divisionId: 'pr',
    categoryId: 'tata-usaha-kalan',
    title: 'Agenda Kalan Mingguan',
    description: 'Susunan agenda pimpinan untuk minggu berjalan.',
    fileName: 'agenda-kalan-mingguan-2026.pdf',
    fileType: 'application/pdf',
    fileSize: 550221,
    documentNumber: 'PR-AGD/2026/01',
    documentDate: daysAgo(4),
    year: 2026,
    status: 'approved',
    uploadedBy: 'Andi Wijaya',
    uploadedAt: daysAgo(4)
  }),
  makeDocument({
    divisionId: 'pr',
    categoryId: 'dokumentasi-kegiatan',
    title: 'Dokumentasi Kegiatan Audit Day',
    description: 'Dokumentasi foto dan materi kegiatan Audit Day.',
    fileName: 'dokumentasi-audit-day-2026.zip',
    fileType: 'application/zip',
    fileSize: 2321455,
    documentNumber: 'PR-DOK/2026/02',
    documentDate: daysAgo(15),
    year: 2026,
    status: 'pending',
    uploadedBy: 'Andi Wijaya',
    uploadedAt: daysAgo(14)
  }),
  makeDocument({
    divisionId: 'legal',
    categoryId: 'jdih',
    title: 'Kompilasi Peraturan JDIH 2026',
    description: 'Koleksi dokumen hukum dan peraturan terbaru.',
    fileName: 'jdih-kompilasi-2026.pdf',
    fileType: 'application/pdf',
    fileSize: 1789000,
    documentNumber: 'HK-JDIH/2026/08',
    documentDate: daysAgo(18),
    year: 2026,
    status: 'approved',
    uploadedBy: 'Andi Wijaya',
    uploadedAt: daysAgo(17)
  }),
  makeDocument({
    divisionId: 'legal',
    categoryId: 'perjanjian',
    title: 'Draft Perjanjian Kerja Sama',
    description: 'Draft perjanjian untuk kerja sama antar lembaga.',
    fileName: 'draft-perjanjian-kerja-sama.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 296331,
    documentNumber: 'HK-PER/2026/04',
    documentDate: daysAgo(6),
    year: 2026,
    status: 'pending',
    uploadedBy: 'Andi Wijaya',
    uploadedAt: daysAgo(5)
  }),
  makeDocument({
    divisionId: 'it',
    categoryId: 'aset',
    title: 'Daftar Inventaris Aset TI',
    description: 'Inventaris aset perangkat TI dan kondisi terakhir.',
    fileName: 'inventaris-aset-ti-2026.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 745200,
    documentNumber: 'TI-AST/2026/05',
    documentDate: daysAgo(14),
    year: 2026,
    status: 'approved',
    uploadedBy: 'Dewi Lestari',
    uploadedAt: daysAgo(13)
  }),
  makeDocument({
    divisionId: 'it',
    categoryId: 'pengadaan-barang-jasa',
    title: 'Evaluasi Pengadaan Perangkat Jaringan',
    description: 'Dokumen evaluasi vendor dan spesifikasi pengadaan.',
    fileName: 'evaluasi-pengadaan-jaringan.pdf',
    fileType: 'application/pdf',
    fileSize: 1500211,
    documentNumber: 'TI-PBJ/2026/09',
    documentDate: daysAgo(2),
    year: 2026,
    status: 'pending',
    uploadedBy: 'Dewi Lestari',
    uploadedAt: daysAgo(2)
  }),
  makeDocument({
    divisionId: 'it',
    categoryId: 'arsip',
    title: 'Berkas Kepegawaian Tahun Berjalan',
    description: 'Berkas administrasi kepegawaian yang masih dipakai rutin.',
    fileName: 'berkas-kepegawaian-2026.pdf',
    fileType: 'application/pdf',
    fileSize: 1240500,
    documentNumber: 'TI-ARS/2026/01',
    documentDate: daysAgo(6),
    year: 2026,
    status: 'approved',
    archiveStatus: 'aktif',
    uploadedBy: 'Dewi Lestari',
    uploadedAt: daysAgo(6)
  }),
  makeDocument({
    divisionId: 'it',
    categoryId: 'arsip',
    title: 'Notulen Rapat Internal 2026',
    description: 'Kumpulan notulen rapat internal sepanjang tahun berjalan.',
    fileName: 'notulen-rapat-internal-2026.pdf',
    fileType: 'application/pdf',
    fileSize: 890300,
    documentNumber: 'TI-ARS/2026/02',
    documentDate: daysAgo(10),
    year: 2026,
    status: 'approved',
    archiveStatus: 'aktif',
    uploadedBy: 'Dewi Lestari',
    uploadedAt: daysAgo(10)
  }),
  makeDocument({
    divisionId: 'it',
    categoryId: 'arsip',
    title: 'Laporan Kegiatan Tahun 2023',
    description: 'Arsip laporan kegiatan yang sudah jarang diakses namun masih dalam masa retensi.',
    fileName: 'laporan-kegiatan-2023.pdf',
    fileType: 'application/pdf',
    fileSize: 2140800,
    documentNumber: 'TI-ARS/2023/14',
    documentDate: '2023-11-20',
    year: 2023,
    status: 'approved',
    archiveStatus: 'inaktif',
    uploadedBy: 'Dewi Lestari',
    uploadedAt: daysAgo(20)
  }),
  makeDocument({
    divisionId: 'it',
    categoryId: 'arsip',
    title: 'Surat Menyurat Umum 2019',
    description: 'Arsip surat menyurat yang telah melewati masa retensi dan dijadwalkan dimusnahkan.',
    fileName: 'surat-menyurat-umum-2019.pdf',
    fileType: 'application/pdf',
    fileSize: 3320100,
    documentNumber: 'TI-ARS/2019/33',
    documentDate: '2019-08-05',
    year: 2019,
    status: 'approved',
    archiveStatus: 'musnah',
    uploadedBy: 'Dewi Lestari',
    uploadedAt: daysAgo(30)
  })
]

export const USERS = [
  {
    id: 'u-admin',
    name: 'Andi Wijaya',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    division: null,
    position: 'System Administrator',
    email: 'andi.wijaya@bpk.go.id'
  },
  {
    id: 'u-employee',
    name: 'Siti Rahmawati',
    username: 'employee',
    password: 'employee123',
    role: 'employee',
    division: 'hr',
    position: 'HR Staff',
    email: 'siti.rahmawati@bpk.go.id'
  },
  {
    id: 'u-viewer',
    name: 'Budi Santoso',
    username: 'viewer',
    password: 'viewer123',
    role: 'viewer',
    division: 'finance',
    position: 'Auditor',
    email: 'budi.santoso@bpk.go.id'
  },
  {
    id: 'u-employee2',
    name: 'Dewi Lestari',
    username: 'dewi',
    password: 'dewi123',
    role: 'employee',
    division: 'it',
    position: 'IT Support Officer',
    email: 'dewi.lestari@bpk.go.id'
  }
]

export const INITIAL_CONTENT = [
  // HR
  {
    id: nid('c'),
    division: 'hr',
    type: 'announcement',
    title: 'Annual Performance Review Schedule',
    description: 'All staff performance reviews will be conducted between 10-20 August. Please prepare your self-assessment forms.',
    author: 'Siti Rahmawati',
    status: 'approved',
    date: daysAgo(3)
  },
  {
    id: nid('c'),
    division: 'hr',
    type: 'document',
    title: 'Employee Handbook 2026',
    description: 'Updated policies on leave, conduct, and benefits for all BPK employees.',
    fileName: 'employee-handbook-2026.pdf',
    author: 'Siti Rahmawati',
    status: 'approved',
    date: daysAgo(20)
  },
  {
    id: nid('c'),
    division: 'hr',
    type: 'event',
    title: 'New Employee Orientation',
    description: 'Orientation program for new staff joining this quarter.',
    author: 'Siti Rahmawati',
    status: 'approved',
    date: daysFromNow(5)
  },
  {
    id: nid('c'),
    division: 'hr',
    type: 'gallery',
    title: 'Team Building 2026',
    description: 'Photos from the annual HR division team building event.',
    imageColor: '#00A99D',
    author: 'Siti Rahmawati',
    status: 'approved',
    date: daysAgo(30)
  },
  {
    id: nid('c'),
    division: 'hr',
    type: 'contact',
    title: 'HR Front Desk',
    description: 'Main contact point for HR inquiries and leave requests.',
    phone: '+62 21 5700 501',
    email: 'hr@bpk.go.id',
    author: 'Siti Rahmawati',
    status: 'approved',
    date: daysAgo(60)
  },
  {
    id: nid('c'),
    division: 'hr',
    type: 'file',
    title: 'Leave Request Form',
    description: 'Standard form template for submitting annual or sick leave requests.',
    fileName: 'leave-request-form.docx',
    author: 'Siti Rahmawati',
    status: 'approved',
    date: daysAgo(45)
  },
  {
    id: nid('c'),
    division: 'hr',
    type: 'announcement',
    title: 'Flexible Working Hours Trial',
    description: 'Proposal for a 3-month trial of flexible check-in hours for administrative staff.',
    author: 'Siti Rahmawati',
    status: 'pending',
    date: daysAgo(1)
  },

  // Finance
  {
    id: nid('c'),
    division: 'finance',
    type: 'announcement',
    title: 'Q3 Budget Realization Report Due',
    description: 'All division heads must submit Q3 budget realization reports by end of month.',
    author: 'Budi Santoso',
    status: 'approved',
    date: daysAgo(5)
  },
  {
    id: nid('c'),
    division: 'finance',
    type: 'document',
    title: 'Annual Financial Statement FY2025',
    description: 'Audited financial statement for fiscal year 2025.',
    fileName: 'financial-statement-fy2025.pdf',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(90)
  },
  {
    id: nid('c'),
    division: 'finance',
    type: 'event',
    title: 'Budget Planning Workshop',
    description: 'Workshop to align division budget proposals for the next fiscal year.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysFromNow(12)
  },
  {
    id: nid('c'),
    division: 'finance',
    type: 'contact',
    title: 'Finance Helpdesk',
    description: 'Reimbursement and disbursement inquiries.',
    phone: '+62 21 5700 502',
    email: 'finance@bpk.go.id',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(60)
  },
  {
    id: nid('c'),
    division: 'finance',
    type: 'file',
    title: 'Reimbursement Claim Template',
    description: 'Template used for official travel and operational reimbursement claims.',
    fileName: 'reimbursement-claim.xlsx',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(40)
  },

  // Legal
  {
    id: nid('c'),
    division: 'legal',
    type: 'announcement',
    title: 'Updated Audit Regulation PMK No. 12/2026',
    description: 'New ministerial regulation affecting state financial audit procedures takes effect next month.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(7)
  },
  {
    id: nid('c'),
    division: 'legal',
    type: 'document',
    title: 'Legal Opinion on Procurement Dispute',
    description: 'Formal legal opinion regarding the ongoing procurement dispute case.',
    fileName: 'legal-opinion-procurement.pdf',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(15)
  },
  {
    id: nid('c'),
    division: 'legal',
    type: 'contact',
    title: 'Legal Affairs Office',
    description: 'Contact for legal consultation and compliance questions.',
    phone: '+62 21 5700 503',
    email: 'legal@bpk.go.id',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(60)
  },

  // IT
  {
    id: nid('c'),
    division: 'it',
    type: 'announcement',
    title: 'Scheduled Maintenance: Internal Portal',
    description: 'The internal document portal will be offline this Saturday from 22:00-02:00 for maintenance.',
    author: 'Dewi Lestari',
    status: 'approved',
    date: daysAgo(2)
  },
  {
    id: nid('c'),
    division: 'it',
    type: 'document',
    title: 'IT Security Policy v3',
    description: 'Guidelines on password management, data handling, and device usage.',
    fileName: 'it-security-policy-v3.pdf',
    author: 'Dewi Lestari',
    status: 'approved',
    date: daysAgo(25)
  },
  {
    id: nid('c'),
    division: 'it',
    type: 'event',
    title: 'Cybersecurity Awareness Training',
    description: 'Mandatory training session for all staff on phishing and data protection.',
    author: 'Dewi Lestari',
    status: 'approved',
    date: daysFromNow(8)
  },
  {
    id: nid('c'),
    division: 'it',
    type: 'file',
    title: 'VPN Setup Guide',
    description: 'Step-by-step instructions for configuring remote VPN access.',
    fileName: 'vpn-setup-guide.pdf',
    author: 'Dewi Lestari',
    status: 'approved',
    date: daysAgo(35)
  },
  {
    id: nid('c'),
    division: 'it',
    type: 'contact',
    title: 'IT Helpdesk',
    description: 'Technical support for hardware, software, and network issues.',
    phone: '+62 21 5700 504',
    email: 'it-helpdesk@bpk.go.id',
    author: 'Dewi Lestari',
    status: 'approved',
    date: daysAgo(60)
  },
  {
    id: nid('c'),
    division: 'it',
    type: 'document',
    title: 'Data Center Migration Plan',
    description: 'Draft migration plan for moving internal servers to the new data center.',
    fileName: 'datacenter-migration-plan.pdf',
    author: 'Dewi Lestari',
    status: 'pending',
    date: daysAgo(1)
  },

  // PR
  {
    id: nid('c'),
    division: 'pr',
    type: 'announcement',
    title: 'Press Conference: Annual Audit Findings',
    description: 'BPK will hold a press conference to present the summary of annual audit findings.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(4)
  },
  {
    id: nid('c'),
    division: 'pr',
    type: 'gallery',
    title: 'National Audit Day Celebration',
    description: 'Highlights from the National Audit Day celebration event.',
    imageColor: '#003366',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(50)
  },
  {
    id: nid('c'),
    division: 'pr',
    type: 'event',
    title: 'Media Briefing Session',
    description: 'Quarterly briefing session with national media representatives.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysFromNow(15)
  },
  {
    id: nid('c'),
    division: 'pr',
    type: 'contact',
    title: 'Public Relations Office',
    description: 'Media inquiries and public information requests.',
    phone: '+62 21 5700 505',
    email: 'pr@bpk.go.id',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(60)
  },

  // Planning
  {
    id: nid('c'),
    division: 'planning',
    type: 'announcement',
    title: 'Strategic Plan 2026-2030 Consultation',
    description: 'Public consultation forum for the draft strategic plan is now open for input.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(6)
  },
  {
    id: nid('c'),
    division: 'planning',
    type: 'document',
    title: 'Annual Audit Program 2026',
    description: 'Comprehensive plan of audit engagements scheduled for the year.',
    fileName: 'annual-audit-program-2026.pdf',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(70)
  },
  {
    id: nid('c'),
    division: 'planning',
    type: 'contact',
    title: 'Planning & Development Office',
    description: 'Coordination for strategic planning and performance monitoring.',
    phone: '+62 21 5700 506',
    email: 'planning@bpk.go.id',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(60)
  },

  // Archives
  {
    id: nid('c'),
    division: 'archives',
    type: 'announcement',
    title: 'Digitization of Physical Records',
    description: 'Archives division has begun digitizing records from 2015-2020 for the online repository.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(10)
  },
  {
    id: nid('c'),
    division: 'archives',
    type: 'file',
    title: 'Records Retention Schedule',
    description: 'Official schedule outlining retention periods for various document categories.',
    fileName: 'records-retention-schedule.pdf',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(55)
  },
  {
    id: nid('c'),
    division: 'archives',
    type: 'contact',
    title: 'Archives & Records Office',
    description: 'Requests for archived document retrieval.',
    phone: '+62 21 5700 507',
    email: 'archives@bpk.go.id',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(60)
  },

  // General Affairs
  {
    id: nid('c'),
    division: 'general',
    type: 'announcement',
    title: 'Office Renovation Notice',
    description: 'Third floor meeting rooms will be under renovation from next week for two months.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(8)
  },
  {
    id: nid('c'),
    division: 'general',
    type: 'event',
    title: 'Fire Safety Drill',
    description: 'Mandatory evacuation drill for all building occupants.',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysFromNow(20)
  },
  {
    id: nid('c'),
    division: 'general',
    type: 'contact',
    title: 'General Affairs & Facilities',
    description: 'Office supplies, facilities, and logistics support.',
    phone: '+62 21 5700 508',
    email: 'general@bpk.go.id',
    author: 'Andi Wijaya',
    status: 'approved',
    date: daysAgo(60)
  },
  {
    id: nid('c'),
    division: 'general',
    type: 'document',
    title: 'Procurement Vendor Proposal',
    description: 'Draft proposal from a new vendor for office supply procurement, pending review.',
    fileName: 'vendor-proposal-2026.pdf',
    author: 'Andi Wijaya',
    status: 'rejected',
    date: daysAgo(2)
  }
]
