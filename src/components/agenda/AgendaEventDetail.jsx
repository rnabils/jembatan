import { Building2, CalendarDays, Clock3, Eye, MapPin, Pencil, Trash2, UserCircle2, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  formatAgendaDate,
  formatAgendaDateRange,
  formatAgendaTime,
  isMultiDayAgenda,
  getAgendaStatusMeta,
  getAgendaTypeMeta,
  getAgendaVisibilityMeta
} from '../../lib/agendaStorage'
import { getDivisionVisual } from '../../data/divisionPalette'

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eff5ff] text-[#1f63d3]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-[#233b84]">{value}</p>
      </div>
    </div>
  )
}

export function AgendaEventDetail({ event, open, onOpenChange, onEdit, onDelete, canManage = false, divisionName = '' }) {
  if (!event) return null

  const typeMeta = getAgendaTypeMeta(event.eventType)
  const statusMeta = getAgendaStatusMeta(event.status)
  const visual = getDivisionVisual(event.divisionId)
  const visibilityMeta = getAgendaVisibilityMeta(event.visibility)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-inset ring-black/15"
                style={{ backgroundColor: visual.color }}
              />
              {divisionName || visual.abbr} · {typeMeta.label}
            </span>
            <DialogTitle className="mt-2">{event.title}</DialogTitle>
            <DialogDescription>{formatAgendaDateRange(event)}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          <Badge variant="outline" className="gap-1.5">
            <Eye className="h-3 w-3" /> {visibilityMeta.label}
          </Badge>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <DetailRow icon={Building2} label="Bidang" value={divisionName || visual.abbr} />
          <DetailRow
            icon={CalendarDays}
            label={isMultiDayAgenda(event) ? 'Tanggal Pelaksanaan' : 'Tanggal'}
            value={formatAgendaDateRange(event)}
          />
          <DetailRow icon={Clock3} label="Waktu" value={formatAgendaTime(event)} />
          <DetailRow icon={MapPin} label="Tempat" value={event.location} />
          <DetailRow icon={UserCircle2} label="Penyelenggara" value={event.organizer} />
          <DetailRow icon={Users} label="Peserta" value={event.attendees} />
        </div>

        {event.description ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Keterangan</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.description}</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Dicatat oleh {event.createdByName || 'pengguna tidak diketahui'}
          </p>

          {canManage && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(event)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(event)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
