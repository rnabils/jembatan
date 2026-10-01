import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarPlus, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import {
  AGENDA_EVENT_TYPES,
  AGENDA_STATUSES,
  AGENDA_VISIBILITIES,
  describeAgendaError,
  findAgendaConflicts,
  formatAgendaTime,
  getAgendaVisibilityMeta,
  toDateKey
} from '../../lib/agendaStorage'
import { getDivisionVisual } from '../../data/divisionPalette'

function buildEmptyForm(defaultDate, defaultDivisionId) {
  return {
    divisionId: defaultDivisionId || '',
    title: '',
    description: '',
    location: '',
    organizer: '',
    attendees: '',
    eventDate: defaultDate || toDateKey(new Date()),
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
    eventType: 'rapat',
    status: 'scheduled',
    visibility: 'public'
  }
}

export function AgendaEventModal({
  open,
  onOpenChange,
  initialEvent = null,
  defaultDate = '',
  defaultDivisionId = '',
  divisionOptions = [],
  lockDivision = false,
  conflictPool = [],
  onSubmit
}) {
  const [form, setForm] = useState(() => buildEmptyForm(defaultDate, defaultDivisionId))
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setForm(
      initialEvent
        ? {
            divisionId: initialEvent.divisionId || defaultDivisionId || '',
            title: initialEvent.title || '',
            description: initialEvent.description || '',
            location: initialEvent.location || '',
            organizer: initialEvent.organizer || '',
            attendees: initialEvent.attendees || '',
            eventDate: initialEvent.eventDate || defaultDate || toDateKey(new Date()),
            endDate: initialEvent.endDate || '',
            startTime: initialEvent.startTime || '09:00',
            endTime: initialEvent.endTime || '',
            allDay: Boolean(initialEvent.allDay),
            eventType: initialEvent.eventType || 'rapat',
            status: initialEvent.status || 'scheduled',
            visibility: initialEvent.visibility || 'public'
          }
        : buildEmptyForm(defaultDate, defaultDivisionId)
    )
    setError(null)
    setSubmitting(false)
  }, [open, initialEvent, defaultDate, defaultDivisionId])

  // Dihitung ulang sambil mengetik supaya bentrok ketahuan sebelum disimpan,
  // bukan sesudahnya. Ini peringatan, bukan penghalang - kadang dua kegiatan
  // di jam yang sama memang disengaja.
  const conflicts = useMemo(() => {
    if (!open || !form.eventDate) return []
    return findAgendaConflicts(conflictPool, { ...form, id: initialEvent?.id })
  }, [open, form, conflictPool, initialEvent?.id])

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError({ message: 'Nama kegiatan wajib diisi.' })
      return
    }

    if (!form.eventDate) {
      setError({ message: 'Tanggal kegiatan wajib diisi.' })
      return
    }

    if (!form.divisionId) {
      setError({ message: 'Pilih bidang pemilik agenda.' })
      return
    }

    if (!form.allDay && !form.startTime) {
      setError({ message: 'Isi jam mulai, atau centang "Sehari penuh".' })
      return
    }

    if (form.endDate && form.endDate < form.eventDate) {
      setError({ message: 'Tanggal selesai tidak boleh mendahului tanggal mulai.' })
      return
    }

    // Jam hanya bermakna pada kegiatan sehari; lintas hari tidak diperiksa.
    if (!form.allDay && !form.endDate && form.endTime && form.endTime <= form.startTime) {
      setError({ message: 'Jam selesai harus lebih lambat dari jam mulai.' })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({ ...form, id: initialEvent?.id })
      onOpenChange(false)
    } catch (submitError) {
      setError(describeAgendaError(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div>
            <DialogTitle>{initialEvent ? 'Edit Agenda' : 'Tambah Agenda Kegiatan'}</DialogTitle>
            <DialogDescription>
              {initialEvent
                ? 'Perbarui jadwal kegiatan yang sudah tercatat.'
                : 'Catat jadwal kegiatan baru agar tampil di kalender bidang ini.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Kegiatan</label>
            <Input value={form.title} onChange={handleChange('title')} placeholder="Contoh: Rapat Koordinasi Mingguan Kalan" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Mulai</label>
              <Input type="date" value={form.eventDate} onChange={handleChange('eventDate')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Selesai</label>
              <Input type="date" value={form.endDate} onChange={handleChange('endDate')} min={form.eventDate} />
              <p className="mt-1.5 text-xs text-slate-500">Kosongkan bila kegiatannya hanya sehari.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Jam Mulai</label>
              <Input type="time" value={form.startTime} onChange={handleChange('startTime')} disabled={form.allDay} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Jam Selesai</label>
              <Input type="time" value={form.endTime} onChange={handleChange('endTime')} disabled={form.allDay} />
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={handleChange('allDay')}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            />
            Sehari penuh
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Jenis Kegiatan</label>
              <Select value={form.eventType} onChange={handleChange('eventType')}>
                {AGENDA_EVENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status} onChange={handleChange('status')}>
                {AGENDA_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Bidang</label>
              <Select value={form.divisionId} onChange={handleChange('divisionId')} disabled={lockDivision}>
                {divisionOptions.map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Siapa yang boleh melihat</label>
              <Select value={form.visibility} onChange={handleChange('visibility')}>
                {AGENDA_VISIBILITIES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-slate-500">{getAgendaVisibilityMeta(form.visibility).hint}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tempat</label>
              <Input value={form.location} onChange={handleChange('location')} placeholder="Contoh: Ruang Rapat Lantai 3" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Penyelenggara</label>
              <Input value={form.organizer} onChange={handleChange('organizer')} placeholder="Contoh: Sekretariat Kalan" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Peserta</label>
            <Input value={form.attendees} onChange={handleChange('attendees')} placeholder="Contoh: Kalan, para Kasubbag, seluruh ketua tim" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Keterangan</label>
            <Textarea value={form.description} onChange={handleChange('description')} placeholder="Agenda pembahasan, catatan persiapan, atau informasi tambahan" />
          </div>

          {conflicts.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Berpotensi bentrok dengan {conflicts.length} kegiatan lain
              </div>
              <ul className="mt-2 space-y-2">
                {conflicts.map(({ event, reason }) => (
                  <li key={event.id} className="flex items-start gap-2 text-sm text-amber-800">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15"
                      style={{ backgroundColor: getDivisionVisual(event.divisionId).color }}
                    />
                    <span className="min-w-0">
                      <span className="font-medium">{getDivisionVisual(event.divisionId).abbr} - {event.title}</span>
                      <span className="block text-xs">
                        {formatAgendaTime(event)}
                        {reason === 'location'
                          ? ` - tempat yang sama (${event.location})`
                          : ' - bidang yang sama'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-700">
                Peringatan saja - agenda tetap bisa disimpan bila memang disengaja.
              </p>
            </div>
          )}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-sm text-red-700">{error.message}</p>
              {error.detail && error.detail !== error.message ? (
                <p className="mt-1 break-words text-xs text-red-500">Detail teknis: {error.detail}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" variant="teal" disabled={submitting}>
              {initialEvent ? <Save className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {submitting ? 'Menyimpan...' : initialEvent ? 'Simpan Perubahan' : 'Tambah Agenda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
