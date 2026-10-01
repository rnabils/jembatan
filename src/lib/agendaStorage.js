const AGENDA_KEY = 'bpk-dashboard-agenda'

export const AGENDA_CATEGORY_ID = 'agenda-kalan'

export const AGENDA_EVENT_TYPES = [
  { id: 'rapat', label: 'Rapat', color: '#2563eb' },
  { id: 'kunjungan', label: 'Kunjungan', color: '#16a34a' },
  { id: 'pemeriksaan', label: 'Pemeriksaan', color: '#f97316' },
  { id: 'sosialisasi', label: 'Sosialisasi', color: '#7c3aed' },
  { id: 'upacara', label: 'Upacara', color: '#0ea5e9' },
  { id: 'lainnya', label: 'Lainnya', color: '#64748b' }
]

export const AGENDA_STATUSES = [
  { id: 'scheduled', label: 'Terjadwal', variant: 'teal' },
  { id: 'done', label: 'Selesai', variant: 'success' },
  { id: 'cancelled', label: 'Dibatalkan', variant: 'destructive' }
]

export const AGENDA_VISIBILITIES = [
  { id: 'public', label: 'Seluruh kantor', hint: 'Terlihat oleh semua pengguna portal.' },
  { id: 'division', label: 'Divisi sendiri', hint: 'Hanya terlihat oleh divisi pemilik agenda.' },
  { id: 'restricted', label: 'Terbatas', hint: 'Hanya pencatat agenda dan administrator.' }
]

export function getAgendaVisibilityMeta(visibility) {
  return AGENDA_VISIBILITIES.find((item) => item.id === visibility) || AGENDA_VISIBILITIES[0]
}

// Cermin dari RLS select policy di supabase/agenda.sql. Di mode localStorage
// ini satu-satunya penyaring; di mode Supabase ia hanya lapisan kedua.
export function canViewAgendaEvent(event, user) {
  if (!user) return false
  if (user.role === 'admin') return true
  if (event.createdBy && event.createdBy === user.id) return true
  if (event.createdByName && event.createdByName === user.name) return true
  if (event.visibility === 'public') return true
  if (event.visibility === 'division') return event.divisionId === user.division
  return false
}

export function getAgendaTypeMeta(eventType) {
  return AGENDA_EVENT_TYPES.find((item) => item.id === eventType) || AGENDA_EVENT_TYPES.at(-1)
}

export function getAgendaStatusMeta(status) {
  return AGENDA_STATUSES.find((item) => item.id === status) || AGENDA_STATUSES[0]
}

export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

// eventDate adalah tanggal mulai; endDate kosong berarti kegiatan sehari.
export function agendaEndDate(event) {
  const end = event?.endDate
  return end && end >= event.eventDate ? end : event?.eventDate
}

export function isMultiDayAgenda(event) {
  return agendaEndDate(event) !== event?.eventDate
}

// Perbandingan string cukup karena formatnya YYYY-MM-DD.
export function agendaCoversDate(event, dateKey) {
  return dateKey >= event.eventDate && dateKey <= agendaEndDate(event)
}

// Kegiatan 31 Agustus - 5 September harus tampil di bulan Agustus maupun
// September, jadi yang diperiksa irisannya dengan bulan, bukan tanggal mulai.
export function agendaOverlapsMonth(event, year, month) {
  const monthStart = toDateKey(new Date(year, month, 1))
  const monthEnd = toDateKey(new Date(year, month + 1, 0))
  return event.eventDate <= monthEnd && agendaEndDate(event) >= monthStart
}

export function agendaDateKeys(event) {
  const keys = []
  const end = agendaEndDate(event)
  const cursor = parseDateKey(event.eventDate)

  // Penjaga terhadap endDate yang keliru jauh ke depan; tanpa ini satu baris
  // data rusak bisa membuat kalender menggantung.
  for (let guard = 0; guard < 400; guard += 1) {
    const key = toDateKey(cursor)
    keys.push(key)
    if (key >= end) break
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

export function formatAgendaDate(value) {
  return parseDateKey(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatAgendaDateRange(event) {
  const akhir = agendaEndDate(event)
  if (akhir === event.eventDate) return formatAgendaDate(event.eventDate)

  const mulai = parseDateKey(event.eventDate)
  const selesai = parseDateKey(akhir)
  const tahunSama = mulai.getFullYear() === selesai.getFullYear()
  const bulanSama = tahunSama && mulai.getMonth() === selesai.getMonth()

  // Nama hari hanya pantas untuk kegiatan sehari; pada rentang ia justru
  // membingungkan karena seolah menunjuk satu tanggal saja.
  const teksMulai = mulai.toLocaleDateString('id-ID', {
    day: 'numeric',
    ...(bulanSama ? {} : { month: 'long' }),
    ...(tahunSama ? {} : { year: 'numeric' })
  })
  const teksSelesai = selesai.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return `${teksMulai} - ${teksSelesai}`
}

function normalizeTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function formatAgendaTime(event) {
  if (event?.allDay) return 'Sehari penuh'
  const start = normalizeTime(event?.startTime)
  const end = normalizeTime(event?.endTime)
  if (!start) return 'Waktu belum diatur'
  return end ? `${start} - ${end}` : start
}

function minutesOf(value) {
  const [hours, minutes] = normalizeTime(value).split(':').map(Number)
  return Number.isFinite(hours) ? hours * 60 + (minutes || 0) : null
}

// Agenda tanpa jam selesai dianggap berdurasi satu jam, supaya rapat yang
// beruntun (09.00-11.00 lalu 11.00-12.00) tidak ikut dilaporkan bentrok.
function minuteRange(event) {
  if (event.allDay) return { start: 0, end: 24 * 60 }
  const start = minutesOf(event.startTime)
  if (start === null) return null
  const end = minutesOf(event.endTime)
  return { start, end: end !== null && end > start ? end : start + 60 }
}

function sameLocation(a, b) {
  const left = String(a || '').trim().toLowerCase()
  const right = String(b || '').trim().toLowerCase()
  return Boolean(left) && left === right
}

// Bentrok yang benar-benar merugikan ada dua: tempat yang sama dipakai dua
// kegiatan, dan satu divisi punya dua kegiatan di jam yang sama. Dua divisi
// berbeda yang rapat bersamaan di ruang berbeda bukan bentrok.
export function findAgendaConflicts(events, candidate) {
  const target = minuteRange(candidate)
  if (!target || !candidate.eventDate) return []

  const candidateEnd = agendaEndDate(candidate)

  return events.reduce((result, event) => {
    if (event.id === candidate.id) return result
    if (event.status === 'cancelled') return result

    // Tanggalnya harus beririsan lebih dulu; kegiatan berhari-hari cukup
    // diperiksa pada tingkat tanggal, karena jam mulai dan selesainya hanya
    // berlaku di hari pertama dan terakhir.
    if (event.eventDate > candidateEnd || agendaEndDate(event) < candidate.eventDate) return result

    const lintasHari = isMultiDayAgenda(event) || isMultiDayAgenda(candidate)
    if (!lintasHari) {
      const range = minuteRange(event)
      if (!range || range.start >= target.end || target.start >= range.end) return result
    }

    const locationClash = sameLocation(event.location, candidate.location)
    const divisionClash = event.divisionId === candidate.divisionId
    if (!locationClash && !divisionClash) return result

    result.push({ event, reason: locationClash ? 'location' : 'division' })
    return result
  }, [])
}

// Pesan mentah PostgREST tidak bisa ditindaklanjuti pengguna. Yang paling sering
// muncul adalah skema tertinggal di belakang kode, dan itu punya satu jalan keluar.
export function describeAgendaError(error) {
  const detail = error?.message || ''

  if (/schema cache|column .* does not exist/i.test(detail)) {
    return {
      message: 'Struktur tabel agenda di Supabase belum sesuai. Jalankan ulang supabase/agenda.sql di SQL Editor Supabase, lalu coba simpan lagi.',
      detail
    }
  }

  if (/row-level security|violates row-level/i.test(detail)) {
    return { message: 'Anda tidak punya izin menyimpan agenda untuk bidang ini.', detail }
  }

  return { message: detail || 'Gagal menyimpan agenda.' }
}

export function sortAgendaEvents(events) {
  return [...events].sort((a, b) => {
    if (a.eventDate !== b.eventDate) return a.eventDate < b.eventDate ? -1 : 1
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
    return normalizeTime(a.startTime).localeCompare(normalizeTime(b.startTime))
  })
}

export function groupAgendaByDate(events) {
  return events.reduce((result, event) => {
    for (const key of agendaDateKeys(event)) {
      const bucket = result[key] || []
      bucket.push(event)
      result[key] = bucket
    }
    return result
  }, {})
}

export function mapRemoteAgendaEvent(row) {
  return {
    id: row.id,
    divisionId: row.division_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description || '',
    location: row.location || '',
    organizer: row.organizer || '',
    attendees: row.attendees || '',
    eventDate: row.event_date,
    endDate: row.end_date || null,
    startTime: normalizeTime(row.start_time),
    endTime: normalizeTime(row.end_time),
    allDay: Boolean(row.all_day),
    eventType: row.event_type,
    status: row.status,
    visibility: row.visibility || 'public',
    createdBy: row.created_by || null,
    createdByName: row.created_by_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function toRemoteAgendaPayload(event) {
  return {
    division_id: event.divisionId,
    category_id: event.categoryId || AGENDA_CATEGORY_ID,
    title: event.title,
    description: event.description || null,
    location: event.location || null,
    organizer: event.organizer || null,
    attendees: event.attendees || null,
    event_date: event.eventDate,
    end_date: event.endDate || null,
    start_time: event.allDay ? null : normalizeTime(event.startTime) || null,
    end_time: event.allDay ? null : normalizeTime(event.endTime) || null,
    all_day: Boolean(event.allDay),
    event_type: event.eventType,
    status: event.status,
    visibility: event.visibility || 'public'
  }
}

export function normalizeAgendaInput(input) {
  const allDay = Boolean(input.allDay)
  return {
    divisionId: input.divisionId,
    categoryId: input.categoryId || AGENDA_CATEGORY_ID,
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    location: String(input.location || '').trim(),
    organizer: String(input.organizer || '').trim(),
    attendees: String(input.attendees || '').trim(),
    eventDate: input.eventDate,
    endDate: input.endDate && input.endDate > input.eventDate ? input.endDate : null,
    startTime: allDay ? '' : normalizeTime(input.startTime),
    endTime: allDay ? '' : normalizeTime(input.endTime),
    allDay,
    eventType: input.eventType || 'rapat',
    status: input.status || 'scheduled',
    visibility: input.visibility || 'public'
  }
}

function buildSeedAgenda() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dayAt = (offset) => {
    const day = Math.min(Math.max(today.getDate() + offset, 1), daysInMonth)
    return toDateKey(new Date(year, month, day))
  }

  const base = {
    divisionId: 'pr',
    categoryId: AGENDA_CATEGORY_ID,
    allDay: false,
    status: 'scheduled',
    visibility: 'public',
    createdBy: null,
    createdByName: 'Administrator',
    createdAt: new Date().toISOString()
  }

  return [
    {
      ...base,
      id: 'agenda-seed-1',
      title: 'Rapat Koordinasi Mingguan Kalan',
      description: 'Pembahasan progres pemeriksaan berjalan dan tindak lanjut disposisi pimpinan.',
      location: 'Ruang Rapat Lantai 3',
      organizer: 'Sekretariat Kalan',
      attendees: 'Kalan, para Kasubbag, seluruh ketua tim',
      eventDate: dayAt(0),
      startTime: '09:00',
      endTime: '11:00',
      eventType: 'rapat'
    },
    {
      ...base,
      id: 'agenda-seed-2',
      title: 'Audiensi Pemerintah Daerah',
      description: 'Audiensi terkait tindak lanjut rekomendasi hasil pemeriksaan tahun sebelumnya.',
      location: 'Ruang Tamu Kalan',
      organizer: 'Humas',
      attendees: 'Kalan, Tim Humas, perwakilan Pemda',
      eventDate: dayAt(1),
      startTime: '13:30',
      endTime: '15:00',
      eventType: 'kunjungan'
    },
    {
      ...base,
      id: 'agenda-seed-3',
      title: 'Entry Meeting Pemeriksaan Semester II',
      description: 'Pembukaan pemeriksaan semester II beserta paparan ruang lingkup dan jadwal penugasan.',
      location: 'Aula Perwakilan',
      organizer: 'Subauditorat',
      attendees: 'Tim pemeriksa dan entitas terperiksa',
      eventDate: dayAt(3),
      startTime: '08:30',
      endTime: '12:00',
      eventType: 'pemeriksaan'
    },
    {
      ...base,
      id: 'agenda-seed-4',
      title: 'Sosialisasi Aplikasi JEMBATAN',
      description: 'Pengenalan alur dokumen dan agenda pada dashboard internal untuk seluruh bidang.',
      location: 'Ruang Multimedia',
      organizer: 'Umum dan TI',
      attendees: 'Seluruh pegawai perwakilan',
      eventDate: dayAt(6),
      startTime: '10:00',
      endTime: '11:30',
      eventType: 'sosialisasi'
    },
    {
      ...base,
      id: 'agenda-seed-5',
      title: 'Upacara Peringatan Hari Bhakti',
      description: 'Upacara bersama seluruh pegawai di halaman kantor perwakilan.',
      location: 'Halaman Kantor Perwakilan',
      organizer: 'Bagian Umum',
      attendees: 'Seluruh pegawai',
      eventDate: dayAt(-2),
      allDay: true,
      startTime: '',
      endTime: '',
      eventType: 'upacara',
      status: 'done'
    },
    {
      ...base,
      id: 'agenda-seed-6',
      divisionId: 'finance',
      title: 'Rekonsiliasi Realisasi Anggaran Triwulan',
      description: 'Pencocokan data realisasi dengan SPM dan SP2D triwulan berjalan.',
      location: 'Ruang Rapat Lantai 2',
      organizer: 'Subbagian Keuangan',
      attendees: 'Bendahara, PPK, staf verifikasi',
      eventDate: dayAt(1),
      startTime: '09:00',
      endTime: '11:30',
      eventType: 'rapat',
      visibility: 'division'
    },
    {
      ...base,
      id: 'agenda-seed-7',
      divisionId: 'hr',
      title: 'Diklat Penyegaran Pemeriksa',
      description: 'Pelatihan penyegaran metodologi pemeriksaan untuk pemeriksa muda.',
      location: 'Ruang Multimedia',
      organizer: 'Subbagian SDM',
      attendees: 'Pemeriksa muda dan pertama',
      eventDate: dayAt(2),
      startTime: '08:00',
      endTime: '16:00',
      eventType: 'sosialisasi'
    },
    {
      ...base,
      id: 'agenda-seed-8',
      divisionId: 'legal',
      title: 'Review MOU dengan Perguruan Tinggi',
      description: 'Telaah klausul kerja sama sebelum penandatanganan.',
      location: 'Ruang Rapat Lantai 2',
      organizer: 'Subbagian Hukum',
      attendees: 'Tim hukum, perwakilan universitas',
      eventDate: dayAt(4),
      startTime: '13:00',
      endTime: '15:00',
      eventType: 'rapat'
    },
    {
      ...base,
      id: 'agenda-seed-9',
      divisionId: 'it',
      title: 'Pemeliharaan Server dan Jaringan',
      description: 'Pemeliharaan terjadwal, layanan daring berpotensi terganggu.',
      location: 'Ruang Server',
      organizer: 'Subbagian Umum dan TI',
      attendees: 'Tim TI',
      eventDate: dayAt(5),
      allDay: true,
      startTime: '',
      endTime: '',
      eventType: 'lainnya'
    }
  ]
}

export function loadStoredAgenda() {
  try {
    const saved = localStorage.getItem(AGENDA_KEY)
    if (!saved) return buildSeedAgenda()
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : buildSeedAgenda()
  } catch {
    return buildSeedAgenda()
  }
}

export function saveStoredAgenda(events) {
  try {
    localStorage.setItem(AGENDA_KEY, JSON.stringify(events))
  } catch {
    // Kuota localStorage penuh atau diblokir: data tetap hidup di memori.
  }
}
