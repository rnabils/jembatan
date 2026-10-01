import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatAgendaTime, groupAgendaByDate, sortAgendaEvents, toDateKey } from '../../lib/agendaStorage'
import { COLORED_DIVISION_IDS, getDivisionVisual } from '../../data/divisionPalette'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MAX_VISIBLE_CHIPS = 3

function buildMonthMatrix(cursor) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < startOffset; index += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7))
}

// Warna chip selalu menandai divisi, tidak pernah jenis kegiatan - supaya satu
// kegiatan berwarna sama di kalender bersama maupun di kalender divisi.
// Jenis kegiatan dibawa oleh teks, bukan warna.
export function AgendaCalendar({
  cursor,
  events,
  selectedKey,
  showDivisionTag = false,
  showLegend = false,
  homeDivisionId = '',
  divisionLabels = {},
  title = 'Kalender Kegiatan',
  onChangeMonth,
  onToday,
  onSelectDay,
  onSelectEvent
}) {
  const weeks = useMemo(() => buildMonthMatrix(cursor), [cursor])
  const eventsByDate = useMemo(() => groupAgendaByDate(sortAgendaEvents(events)), [events])
  const todayKey = toDateKey(new Date())

  // Urutan legenda mengikuti urutan slot warna yang tetap, bukan urutan kemunculan,
  // supaya posisi sebuah bidang tidak berpindah saat isi bulan berubah.
  const legendDivisions = useMemo(() => {
    const present = new Set(events.map((event) => event.divisionId))
    return COLORED_DIVISION_IDS.filter((id) => present.has(id))
  }, [events])

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#233b84]">{title}</h2>
          <p className="text-sm text-slate-500">
            {cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            className="cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 active:scale-[0.95]"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 active:scale-[0.98]"
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(1)}
            className="cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 active:scale-[0.95]"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showLegend && legendDivisions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-slate-50 px-3 py-2.5">
          {legendDivisions.map((id) => {
            const visual = getDivisionVisual(id)
            return (
              <span key={id} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-inset ring-black/15"
                  style={{ backgroundColor: visual.color }}
                />
                {divisionLabels[id] || visual.abbr}
              </span>
            )
          })}
          {homeDivisionId && legendDivisions.some((id) => id !== homeDivisionId) && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span aria-hidden="true" className="h-3 w-0 border-l-[3px] border-dashed border-slate-400" />
              Garis putus-putus = bidang lain
            </span>
          )}
        </div>
      )}

      <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="mt-2 space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={`${weekIndex}-${dayIndex}`} className="min-h-[124px] rounded-2xl border border-transparent" />
                }

                const dateKey = toDateKey(date)
                const dayEvents = eventsByDate[dateKey] || []
                const isToday = dateKey === todayKey
                const isSelected = dateKey === selectedKey

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => onSelectDay(dateKey)}
                    className={cn(
                      'flex min-h-[124px] cursor-pointer flex-col rounded-2xl border p-2 text-left transition-colors',
                      isSelected ? 'border-[#1f63d3] bg-[#eff5ff] ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                    )}
                    aria-label={`Lihat agenda tanggal ${date.getDate()}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                          isToday ? 'bg-[#1f63d3] text-white' : 'text-[#233b84]'
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, MAX_VISIBLE_CHIPS).map((event) => {
                        const visual = getDivisionVisual(event.divisionId)
                        const isGuest = Boolean(homeDivisionId) && event.divisionId !== homeDivisionId
                        return (
                          <span
                            key={event.id}
                            role="button"
                            tabIndex={0}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation()
                              onSelectEvent(event)
                            }}
                            onKeyDown={(keyEvent) => {
                              if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return
                              keyEvent.preventDefault()
                              keyEvent.stopPropagation()
                              onSelectEvent(event)
                            }}
                            title={`${visual.abbr} - ${formatAgendaTime(event)} - ${event.title}${isGuest ? ' (bidang lain)' : ''}`}
                            className={cn(
                              'block cursor-pointer truncate rounded-lg border-l-[3px] px-1.5 py-1 text-[11px] font-medium transition-colors',
                              isGuest
                                ? 'border-dashed bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
                                : 'bg-slate-50 text-[#233b84] hover:bg-slate-100',
                              event.status === 'cancelled' && 'text-slate-400 line-through'
                            )}
                            style={{ borderLeftColor: visual.color }}
                          >
                            {showDivisionTag && (
                              <span className="mr-1 font-bold text-slate-500">{visual.abbr}</span>
                            )}
                            {event.allDay ? event.title : `${event.startTime || '--:--'} ${event.title}`}
                          </span>
                        )
                      })}

                      {dayEvents.length > MAX_VISIBLE_CHIPS && (
                        <span className="block px-1.5 text-[11px] font-semibold text-[#1f63d3]">
                          +{dayEvents.length - MAX_VISIBLE_CHIPS} lainnya
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
