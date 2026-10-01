import { AlertTriangle, CircleCheck, CircleSlash, FileCheck2, Handshake, ScrollText } from 'lucide-react'

// Layanan Legislasi / Review MOU menampung tiga hal yang berbeda sifatnya:
// nota kesepahaman, perjanjian yang mengikat, dan telaah hukum. Hanya dua yang
// pertama punya masa berlaku - telaah tidak berakhir, ia hanya bertanggal.
//
// Sumbu ini terpisah dari `status` dokumen (pending/approved/rejected) yang
// mengatur alur persetujuan unggahan, sama seperti archiveStatus. Sebuah MoU
// bisa berstatus 'approved' sekaligus sudah 'berakhir'.
export const AGREEMENT_CATEGORY_ID = 'legislasi-review-mou'

export function isAgreementCategory(categoryId) {
  return categoryId === AGREEMENT_CATEGORY_ID
}

export const DEFAULT_AGREEMENT_TYPE = 'mou'

export const AGREEMENT_TYPES = [
  {
    id: 'mou',
    label: 'MoU',
    subtitle: 'Nota kesepahaman',
    description: 'Kesepakatan awal antara dua pihak, biasanya belum mengatur teknis pelaksanaan.',
    // Menentukan apakah dokumen ini punya masa berlaku yang perlu dipantau.
    berjangka: true,
    color: '#2a78d6',
    icon: Handshake
  },
  {
    id: 'perjanjian',
    label: 'Perjanjian',
    subtitle: 'Perjanjian kerja sama',
    description: 'Perjanjian yang mengikat para pihak beserta hak dan kewajibannya.',
    berjangka: true,
    color: '#4a3aa7',
    icon: FileCheck2
  },
  {
    id: 'review',
    label: 'Review',
    subtitle: 'Telaah hukum',
    description: 'Telaah, pendapat hukum, atau hasil review atas draf dan regulasi.',
    berjangka: false,
    color: '#eda100',
    icon: ScrollText
  }
]

export function getAgreementTypeMeta(type) {
  return AGREEMENT_TYPES.find((item) => item.id === type) || AGREEMENT_TYPES[0]
}

// Ambang "perlu ditinjau". Tiga bulan cukup untuk menyiapkan perpanjangan atau
// memutuskan mengakhiri kerja sama sebelum masa berlakunya lewat.
export const REVIEW_WINDOW_DAYS = 90

export const AGREEMENT_STATUSES = [
  {
    id: 'aktif',
    label: 'Aktif',
    description: `Masih berlaku lebih dari ${REVIEW_WINDOW_DAYS} hari lagi.`,
    color: '#16a34a',
    badge: 'success',
    icon: CircleCheck
  },
  {
    id: 'review',
    label: 'Review',
    description: `Masa berlakunya habis dalam ${REVIEW_WINDOW_DAYS} hari - perlu ditinjau atau diperpanjang.`,
    color: '#f59e0b',
    badge: 'warning',
    icon: AlertTriangle
  },
  {
    id: 'berakhir',
    label: 'Berakhir',
    description: 'Masa berlakunya sudah lewat.',
    color: '#dc2626',
    badge: 'destructive',
    icon: CircleSlash
  }
]

export function getAgreementStatusMeta(status) {
  return AGREEMENT_STATUSES.find((item) => item.id === status) || null
}

// Tanggal dibandingkan sebagai hari kalender, bukan milidetik, supaya perbedaan
// jam dan zona waktu tidak membuat dokumen yang berakhir hari ini terbaca sudah
// lewat - atau sebaliknya.
function nomorHari(value) {
  if (!value) return null
  const tanggal = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(tanggal.getTime())) return null
  return Math.floor(Date.UTC(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate()) / 86400000)
}

// Sisa hari sampai masa berlaku habis. null bila tanggalnya tidak ada atau
// tidak terbaca; negatif bila sudah lewat.
export function sisaHariBerlaku(document, hariIni = new Date()) {
  const akhir = nomorHari(document?.validUntil)
  if (akhir === null) return null
  const kini = nomorHari(hariIni)
  if (kini === null) return null
  return akhir - kini
}

// Status dihitung dari tanggal, tidak pernah disimpan. Status yang disimpan
// akan basi begitu tanggalnya lewat tanpa ada yang menyunting dokumennya.
//
// null berarti status memang tidak berlaku: telaah hukum tidak punya masa
// berlaku, dan perjanjian yang masa berlakunya belum dicatat tidak bisa
// dinilai. Keduanya dibedakan lewat butuhMasaBerlaku().
export function getAgreementStatus(document, hariIni = new Date()) {
  if (!getAgreementTypeMeta(document?.agreementType).berjangka) return null

  const sisa = sisaHariBerlaku(document, hariIni)
  if (sisa === null) return null
  if (sisa < 0) return 'berakhir'
  if (sisa <= REVIEW_WINDOW_DAYS) return 'review'
  return 'aktif'
}

// Dokumen berjangka yang masa berlakunya belum diisi. Ini lubang data, bukan
// status - dan perlu ditampilkan supaya tidak diam-diam luput dari pemantauan.
export function butuhMasaBerlaku(document) {
  if (!getAgreementTypeMeta(document?.agreementType).berjangka) return false
  return sisaHariBerlaku(document) === null
}

export function formatSisaHari(sisa) {
  if (sisa === null) return '-'
  if (sisa < 0) return `Lewat ${Math.abs(sisa)} hari`
  if (sisa === 0) return 'Berakhir hari ini'
  return `${sisa} hari lagi`
}
