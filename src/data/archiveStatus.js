import { Archive, FolderOpen, Trash2 } from 'lucide-react'

// Siklus hidup arsip. Ini sumbu yang berbeda dari `status` dokumen
// (pending/approved/rejected) yang mengatur alur persetujuan - sebuah arsip bisa
// sudah "approved" tapi statusnya "musnah", dan itu wajar.
export const ARCHIVE_CATEGORY_ID = 'arsip'

export const DEFAULT_ARCHIVE_STATUS = 'aktif'

export const ARCHIVE_STATUSES = [
  {
    id: 'aktif',
    label: 'Aktif',
    subtitle: 'Masih sering digunakan',
    description: 'Arsip yang frekuensi penggunaannya masih tinggi dalam kegiatan sehari-hari.',
    color: '#16a34a',
    badge: 'success',
    icon: FolderOpen
  },
  {
    id: 'inaktif',
    label: 'Inaktif',
    subtitle: 'Jarang digunakan, masa retensi berjalan',
    description: 'Arsip yang sudah menurun frekuensi penggunaannya namun masih dalam masa retensi.',
    color: '#f59e0b',
    badge: 'warning',
    icon: Archive
  },
  {
    id: 'musnah',
    label: 'Musnah',
    subtitle: 'Telah melewati masa retensi',
    description: 'Arsip yang masa retensinya berakhir dan dijadwalkan atau sudah dimusnahkan.',
    color: '#dc2626',
    badge: 'destructive',
    icon: Trash2
  }
]

export function getArchiveStatusMeta(archiveStatus) {
  return ARCHIVE_STATUSES.find((item) => item.id === archiveStatus) || ARCHIVE_STATUSES[0]
}

export function isArchiveCategory(categoryId) {
  return categoryId === ARCHIVE_CATEGORY_ID
}
