import { Clock3, MapPin } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatAgendaDateRange, formatAgendaTime, getAgendaStatusMeta, getAgendaTypeMeta, isMultiDayAgenda } from '../../lib/agendaStorage'
import { getDivisionVisual } from '../../data/divisionPalette'

// Satu-satunya bentuk baris agenda di seluruh portal: dipakai kalender bersama,
// agenda per bidang, dan dashboard bidang. Kalau ada tiga salinan, cepat atau
// lambat ketiganya berbeda.
export function AgendaListItem({ event, divisionName = '', onSelect, showDate = false, isGuest = false }) {
  const visual = getDivisionVisual(event.divisionId)
  const typeMeta = getAgendaTypeMeta(event.eventType)
  const statusMeta = getAgendaStatusMeta(event.status)

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 active:scale-[0.995]"
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-1 shrink-0 self-stretch',
          isGuest ? 'w-0 border-l-[3px] border-dashed' : 'w-1 rounded-full'
        )}
        style={isGuest ? { borderLeftColor: visual.color } : { backgroundColor: visual.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#233b84]">{event.title}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {divisionName ? `${divisionName} · ${typeMeta.label}` : typeMeta.label}
          {isGuest ? ' · BIDANG LAIN' : ''}
        </p>
        {showDate && <p className="mt-1 text-xs font-medium text-[#1f63d3]">{formatAgendaDateRange(event)}</p>}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />{' '}
          {isMultiDayAgenda(event) ? formatAgendaDateRange(event) : formatAgendaTime(event)}
        </p>
        {event.location ? (
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {event.location}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
        {statusMeta.label}
      </span>
    </button>
  )
}
