// Apa yang seharusnya ada di tiap layanan.
//
// Sebelumnya semua layanan diperlakukan sama: tabel dokumen dan tombol unggah.
// Padahal Agenda Kalan butuh jadwal, dan Realisasi Anggaran butuh angka yang
// dibaca dari dokumennya - bukan sekadar daftar berkas.
//
// `type` menentukan modul yang dirender:
//   agenda   - kalender kegiatan (bukan dokumen sama sekali)
//   anggaran - angka pagu/realisasi/sisa, dibaca dari dokumen pendukungnya
//   aset     - portal BMN: ringkasan, analitik, dan tabel aset dari berkas
//   legislasi - kerja sama hukum: jenis, pihak, masa berlaku, dan pemantauan
//   dokumen  - tabel dokumen, tetap default untuk sebagian besar layanan
//
// `budgetCode` mengikat layanan ke satu kode akun belanja pada dokumen
// anggaran. Tanpa kode, layanan anggaran menampilkan angka keseluruhan.
//
// `expects` untuk sementara TIDAK ditampilkan di mana pun. Isinya disusun dari
// rujukan umum tugas subbagian, bukan dari ketentuan resmi perwakilan ini,
// sehingga belum tentu benar - dan daftar yang salah di halaman layanan lebih
// menyesatkan daripada tidak ada daftar sama sekali. Datanya dibiarkan utuh di
// sini supaya bisa dimunculkan kembali begitu sudah diverifikasi; yang perlu
// diubah hanya ServiceIntro.jsx.
//
// Rujukan tugas subbagian: laman Bidang Tugas BPK RI Perwakilan Sulawesi Utara
// dan Papua Barat.

const DEFAULT_CONTENT = {
  type: 'dokumen',
  budgetCode: null,
  summary: 'Dokumen layanan bidang ini.',
  expects: [],
  uploadLabel: 'Upload Dokumen',
  emptyHint: 'Belum ada dokumen pada layanan ini.'
}

export const SERVICE_CONTENT = {
  // ---------------------------------------------------------------- Keuangan
  'realisasi-anggaran': {
    type: 'anggaran',
    summary: 'Penyerapan anggaran perwakilan terhadap pagu tahun berjalan.',
    expects: [
      'Laporan realisasi anggaran bulanan dan triwulanan',
      'Rekonsiliasi dengan KPPN dan Kanwil Ditjen Perbendaharaan',
      'Laporan Pertanggungjawaban (LPJ) Bendahara'
    ],
    uploadLabel: 'Upload Laporan',
    emptyHint: 'Unggah laporan realisasi agar angka penyerapan terbaca di sini.'
  },
  'sisa-anggaran': {
    type: 'anggaran',
    summary: 'Sisa pagu yang belum terserap beserta proyeksi sampai akhir tahun.',
    expects: [
      'Pemantauan sisa pagu per program dan jenis belanja',
      'Usulan revisi anggaran',
      'Proyeksi penyerapan triwulan berikutnya'
    ],
    uploadLabel: 'Upload Laporan',
    emptyHint: 'Unggah dokumen pemantauan agar sisa anggaran terbaca di sini.'
  },
  'belanja-pegawai': {
    type: 'anggaran',
    budgetCode: '51',
    summary: 'Pembayaran gaji, tunjangan, dan hak keuangan pegawai.',
    expects: [
      'Daftar gaji dan tunjangan kinerja',
      'SPM dan SP2D belanja pegawai',
      'Bukti potong pajak SPT Pasal 21'
    ],
    uploadLabel: 'Upload Dokumen Belanja',
    emptyHint: 'Belum ada dokumen belanja pegawai untuk periode ini.'
  },
  'belanja-barang': {
    type: 'anggaran',
    budgetCode: '52',
    summary: 'Pengeluaran operasional dan belanja barang habis pakai.',
    expects: [
      'SPM dan SP2D belanja barang',
      'Kuitansi dan bukti pembayaran pihak ketiga',
      'Buku Kas Umum (BKU) dan buku pembantu'
    ],
    uploadLabel: 'Upload Dokumen Belanja',
    emptyHint: 'Belum ada dokumen belanja barang untuk periode ini.'
  },
  'belanja-modal': {
    type: 'anggaran',
    budgetCode: '53',
    summary: 'Pengadaan aset tetap yang menambah nilai kekayaan negara.',
    expects: [
      'Kontrak dan berita acara serah terima pengadaan',
      'SPM dan SP2D belanja modal',
      'Dokumen penetapan aset hasil pengadaan'
    ],
    uploadLabel: 'Upload Dokumen Belanja',
    emptyHint: 'Belum ada dokumen belanja modal untuk periode ini.'
  },

  // -------------------------------------------------- Sumber Daya Manusia
  bezetting: {
    summary: 'Kondisi riil pegawai dibanding formasi yang dibutuhkan.',
    expects: [
      'Daftar bezetting pegawai per jabatan dan golongan',
      'Analisis beban kerja (ABK)',
      'Usulan kebutuhan formasi pegawai'
    ],
    uploadLabel: 'Upload Data Pegawai',
    emptyHint: 'Unggah berkas bezetting atau ABK untuk dibaca di aplikasi.'
  },
  diklat: {
    summary: 'Penyelenggaraan dan riwayat pengembangan kompetensi pegawai.',
    expects: [
      'Surat tugas dan jadwal diklat',
      'Sertifikat dan laporan hasil pelatihan',
      'Rekap jam pelajaran pengembangan kompetensi'
    ],
    uploadLabel: 'Upload Berkas Diklat',
    emptyHint: 'Belum ada berkas diklat yang tercatat.'
  },
  'manajemen-pengetahuan': {
    summary: 'Berbagi pengetahuan dan praktik kerja antar pegawai.',
    expects: [
      'Materi knowledge sharing dan paparan internal',
      'Notula dan rekomendasi hasil diskusi',
      'Panduan kerja dan pembelajaran dari penugasan'
    ],
    uploadLabel: 'Upload Materi',
    emptyHint: 'Belum ada materi pengetahuan yang dibagikan.'
  },
  klinik: {
    summary: 'Layanan kesehatan pegawai di lingkungan perwakilan.',
    expects: [
      'Rekap kunjungan dan layanan klinik',
      'Laporan persediaan obat',
      'Jadwal dan kehadiran tenaga kesehatan'
    ],
    uploadLabel: 'Upload Laporan Klinik',
    emptyHint: 'Belum ada laporan layanan klinik.'
  },
  mcu: {
    summary: 'Pemeriksaan kesehatan berkala bagi pegawai.',
    expects: [
      'Jadwal dan daftar peserta medical check up',
      'Rekap hasil pemeriksaan (tanpa data medis perorangan)',
      'Tindak lanjut dan rujukan kesehatan'
    ],
    uploadLabel: 'Upload Berkas MCU',
    emptyHint: 'Belum ada berkas MCU untuk periode ini.'
  },

  // ------------------------------------------------ Humas dan TU Kalan
  'agenda-kalan': {
    type: 'agenda',
    summary: 'Jadwal kegiatan dan agenda pimpinan perwakilan.',
    expects: [
      'Rapat koordinasi dan rapat pimpinan',
      'Audiensi, kunjungan, dan entry meeting pemeriksaan',
      'Upacara dan kegiatan seremonial'
    ],
    uploadLabel: 'Tambah Agenda',
    emptyHint: 'Belum ada kegiatan terjadwal.'
  },
  'tata-usaha-kalan': {
    summary: 'Administrasi persuratan dan disposisi Kepala Perwakilan.',
    expects: [
      'Surat masuk dan surat keluar pimpinan',
      'Lembar disposisi dan tindak lanjutnya',
      'Nota dinas dan surat tugas'
    ],
    uploadLabel: 'Upload Surat',
    emptyHint: 'Belum ada surat atau disposisi yang tercatat.'
  },
  'publikasi-pemberitaan': {
    summary: 'Publikasi resmi dan pemberitaan mengenai perwakilan.',
    expects: [
      'Siaran pers dan rilis resmi',
      'Kliping pemberitaan media',
      'Materi publikasi media sosial'
    ],
    uploadLabel: 'Upload Publikasi',
    emptyHint: 'Belum ada publikasi atau pemberitaan yang diarsipkan.'
  },
  'dokumentasi-kegiatan': {
    summary: 'Dokumentasi visual dan laporan pelaksanaan kegiatan.',
    expects: [
      'Foto dan video kegiatan perwakilan',
      'Laporan pelaksanaan kegiatan',
      'Daftar hadir dan notula'
    ],
    uploadLabel: 'Upload Dokumentasi',
    emptyHint: 'Belum ada dokumentasi kegiatan yang diunggah.'
  },
  'arsip-pemeriksaan': {
    summary: 'Berkas pemeriksaan yang disimpan sebagai referensi kerja.',
    expects: [
      'Laporan Hasil Pemeriksaan (LHP)',
      'Kertas Kerja Pemeriksaan (KKP)',
      'Tindak lanjut rekomendasi hasil pemeriksaan'
    ],
    uploadLabel: 'Upload Berkas Pemeriksaan',
    emptyHint: 'Belum ada berkas pemeriksaan yang diarsipkan.'
  },
  perpustakaan: {
    summary: 'Koleksi referensi dan literatur perwakilan.',
    expects: [
      'Katalog buku dan terbitan berkala',
      'Peraturan dan standar pemeriksaan',
      'Catatan peminjaman koleksi'
    ],
    uploadLabel: 'Upload Koleksi',
    emptyHint: 'Belum ada koleksi yang tercatat.'
  },

  // ------------------------------------------------------------- Hukum
  jdih: {
    summary: 'Jaringan Dokumentasi dan Informasi Hukum perwakilan.',
    expects: [
      'Peraturan perundang-undangan dan produk hukum BPK',
      'Keputusan dan surat edaran',
      'Abstrak serta katalog dokumen hukum'
    ],
    uploadLabel: 'Upload Produk Hukum',
    emptyHint: 'Belum ada produk hukum yang didokumentasikan.'
  },
  'legislasi-review-mou': {
    type: 'legislasi',
    summary: 'Telaah regulasi dan kajian hukum atas rencana kerja sama.',
    expects: [
      'Telaah dan pendapat hukum',
      'Hasil review draf MOU dan perjanjian kerja sama',
      'Catatan pendampingan hukum penugasan'
    ],
    uploadLabel: 'Upload Dokumen Kerja Sama',
    emptyHint: 'Belum ada nota kesepahaman, perjanjian, atau telaah yang tercatat.'
  },
  perjanjian: {
    summary: 'Perjanjian dan kesepakatan kerja sama yang berlaku.',
    expects: [
      'Nota kesepahaman dan perjanjian kerja sama',
      'Adendum dan perpanjangan perjanjian',
      'Catatan masa berlaku dan evaluasi pelaksanaan'
    ],
    uploadLabel: 'Upload Perjanjian',
    emptyHint: 'Belum ada perjanjian yang tercatat.'
  },
  'manajemen-risiko': {
    summary: 'Identifikasi dan mitigasi risiko di lingkungan perwakilan.',
    expects: [
      'Register risiko perwakilan',
      'Rencana dan realisasi mitigasi risiko',
      'Laporan pemantauan risiko berkala'
    ],
    uploadLabel: 'Upload Dokumen Risiko',
    emptyHint: 'Belum ada dokumen manajemen risiko.'
  },

  // ------------------------------------------------------ Umum dan TI
  aset: {
    type: 'aset',
    summary: 'Barang Milik Negara yang dikuasai perwakilan.',
    expects: [
      'Daftar inventaris dan kartu identitas barang',
      'Laporan Barang Kuasa Pengguna (LBKP)',
      'Berita acara pemeliharaan dan penghapusan aset'
    ],
    uploadLabel: 'Upload Data Aset',
    emptyHint: 'Unggah berkas daftar aset agar data BMN terbaca di sini.'
  },
  arsip: {
    summary: 'Arsip dinamis perwakilan menurut siklus retensinya.',
    expects: [
      'Daftar arsip aktif, inaktif, dan usul musnah',
      'Berita acara pemindahan dan pemusnahan arsip',
      'Jadwal retensi arsip'
    ],
    uploadLabel: 'Upload Daftar Arsip',
    emptyHint: 'Belum ada daftar arsip yang diunggah.'
  },
  'pengadaan-barang-jasa': {
    summary: 'Proses pengadaan barang dan jasa perwakilan.',
    expects: [
      'Rencana Umum Pengadaan (RUP)',
      'Dokumen pemilihan dan evaluasi penyedia',
      'Kontrak dan berita acara serah terima pekerjaan'
    ],
    uploadLabel: 'Upload Dokumen Pengadaan',
    emptyHint: 'Belum ada dokumen pengadaan untuk periode ini.'
  },
  'peminjaman-aset': {
    summary: 'Pinjam pakai aset dan fasilitas kantor.',
    expects: [
      'Formulir permohonan pinjam pakai',
      'Berita acara serah terima dan pengembalian',
      'Catatan kondisi aset setelah dipakai'
    ],
    uploadLabel: 'Upload Berkas Peminjaman',
    emptyHint: 'Belum ada catatan peminjaman aset.'
  }
}

export function getServiceContent(categoryId) {
  const content = SERVICE_CONTENT[categoryId]
  if (!content) return DEFAULT_CONTENT
  return { ...DEFAULT_CONTENT, ...content }
}

export function getServiceType(categoryId) {
  return getServiceContent(categoryId).type
}
