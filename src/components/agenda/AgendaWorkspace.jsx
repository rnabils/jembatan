import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, CalendarPlus, Database, Info } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/button'
import { AgendaCalendar } from './AgendaCalendar'
import { AgendaEventModal } from './AgendaEventModal'
import { AgendaEventDetail } from './AgendaEventDetail'
import { AgendaListItem } from './AgendaListItem'
import { OtherDivisionsToggle } from './OtherDivisionsToggle'
import {
  agendaCoversDate,
  agendaEndDate,
  agendaOverlapsMonth,
  formatAgendaDate,
  parseDateKey,
  sortAgendaEvents,
  toDateKey
} from '../../lib/agendaStorage'

const OTHER_DIVISIONS_KEY = 'bpk-dashboard-agenda-show-others'

export function AgendaWorkspace({ divisionId, focusDate = '', createTick = 0 }) {
  const { agendaEvents, divisions, addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, isAgendaRemote } = useData()
  const { user, isAdmin, canUploadToDivision } = useAuth()
  const navigate = useNavigate()

  const todayKey = toDateKey(new Date())
  const [cursor, setCursor] = useState(() => {
    const base = focusDate ? parseDateKey(focusDate) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(() => focusDate || todayKey)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showOtherDivisions, setShowOtherDivisions] = useState(
    () => sessionStorage.getItem(OTHER_DIVISIONS_KEY) !== 'false'
  )

  const canCreate = canUploadToDivision(divisionId)

  useEffect(() => {
    if (!focusDate) return
    const target = parseDateKey(focusDate)
    setCursor(new Date(target.getFullYear(), target.getMonth(), 1))
    setSelectedKey(focusDate)
  }, [focusDate])

  useEffect(() => {
    if (createTick <= 0) return
    setEditingEvent(null)
    setFormOpen(true)
  }, [createTick])

  const divisionEvents = useMemo(
    () => agendaEvents.filter((event) => event.divisionId === divisionId),
    [agendaEvents, divisionId]
  )
  const otherDivisionEvents = useMemo(
    () => agendaEvents.filter((event) => event.divisionId !== divisionId),
    [agendaEvents, divisionId]
  )
  const calendarEvents = showOtherDivisions ? agendaEvents : divisionEvents
  const divisionLabels = useMemo(
    () => Object.fromEntries(divisions.map((division) => [division.id, division.name])),
    [divisions]
  )
  const isGuest = (event) => event.divisionId !== divisionId

  const inCursorMonth = (event) => agendaOverlapsMonth(event, cursor.getFullYear(), cursor.getMonth())
  const monthEvents = useMemo(() => calendarEvents.filter(inCursorMonth), [calendarEvents, cursor])
  const ownMonthCount = useMemo(() => divisionEvents.filter(inCursorMonth).length, [divisionEvents, cursor])

  const selectedDayEvents = useMemo(
    () => sortAgendaEvents(calendarEvents.filter((event) => agendaCoversDate(event, selectedKey))),
    [calendarEvents, selectedKey]
  )

  const upcomingEvents = useMemo(
    () => sortAgendaEvents(calendarEvents.filter((event) => agendaEndDate(event) >= todayKey && event.status !== 'cancelled')).slice(0, 5),
    [calendarEvents, todayKey]
  )

  const canManage = useCallback(
    (event) => {
      if (!user) return false
      if (isAdmin) return true
      if (event.createdBy && user.id) return event.createdBy === user.id
      return Boolean(event.createdByName) && event.createdByName === user.name
    },
    [user, isAdmin]
  )

  const toggleOtherDivisions = (next) => {
    setShowOtherDivisions(next)
    sessionStorage.setItem(OTHER_DIVISIONS_KEY, String(next))
  }

  const openDetail = (event) => {
    setDetailEvent(event)
    setDetailOpen(true)
  }

  const openCreate = () => {
    setEditingEvent(null)
    setFormOpen(true)
  }

  const handleEdit = (event) => {
    setDetailOpen(false)
    setEditingEvent(event)
    setFormOpen(true)
  }

  const handleDelete = async (event) => {
    if (!window.confirm(`Hapus agenda "${event.title}"?`)) return
    await deleteAgendaEvent(event.id)
    setDetailOpen(false)
    setDetailEvent(null)
  }

  const handleSubmit = async (payload) => {
    if (payload.id) {
      await updateAgendaEvent(payload.id, payload)
      return
    }
    await addAgendaEvent({ ...payload, divisionId })
    setSelectedKey(payload.eventDate)
    const target = parseDateKey(payload.eventDate)
    setCursor(new Date(target.getFullYear(), target.getMonth(), 1))
  }

  const changeMonth = (offset) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const goToToday = () => {
    const now = new Date()
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedKey(toDateKey(now))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#233b84]">Agenda Kegiatan Kalan</h2>
          <p className="text-sm text-[#61739b]">Catat jadwal kegiatan, lihat di kalender, klik untuk membuka detail</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#233b84] shadow-sm">
            {ownMonthCount} kegiatan bulan ini
          </span>
          <OtherDivisionsToggle
            checked={showOtherDivisions}
            onChange={toggleOtherDivisions}
            count={otherDivisionEvents.length}
          />
          <Button variant="outline" onClick={() => navigate('/dashboard/kalender')} className="rounded-full px-4">
            <CalendarRange className="h-4 w-4" /> Kalender Bersama
          </Button>
          {canCreate && (
            <Button variant="teal" onClick={openCreate} className="rounded-full px-5">
              <CalendarPlus className="h-4 w-4" /> Tambah Agenda
            </Button>
          )}
        </div>
      </div>

      {isAdmin && !isAgendaRemote && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Database className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Agenda masih tersimpan di browser ini saja. Jalankan <code className="font-semibold">supabase/agenda.sql</code> di SQL
            Editor Supabase agar agenda tersimpan di server dan terlihat oleh semua pengguna.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
        <AgendaCalendar
          cursor={cursor}
          events={monthEvents}
          selectedKey={selectedKey}
          showDivisionTag={showOtherDivisions}
          showLegend={showOtherDivisions}
          homeDivisionId={divisionId}
          divisionLabels={divisionLabels}
          onChangeMonth={changeMonth}
          onToday={goToToday}
          onSelectDay={setSelectedKey}
          onSelectEvent={openDetail}
        />

        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#233b84]">Agenda Terpilih</h3>
                <p className="truncate text-sm text-slate-500">{formatAgendaDate(selectedKey)}</p>
              </div>
              {canCreate && (
                <Button size="sm" variant="outline" onClick={openCreate} className="shrink-0 rounded-full">
                  <CalendarPlus className="h-3.5 w-3.5" /> Tambah
                </Button>
              )}
            </div>

            <div className="mt-3 space-y-1">
              {selectedDayEvents.length === 0 ? (
                <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-6 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  Tidak ada kegiatan pada tanggal ini.
                </div>
              ) : (
                selectedDayEvents.map((event) => (
                  <AgendaListItem
                    key={event.id}
                    event={event}
                    onSelect={openDetail}
                    isGuest={isGuest(event)}
                    divisionName={isGuest(event) ? divisionLabels[event.divisionId] : ''}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <h3 className="text-lg font-bold text-[#233b84]">Kegiatan Mendatang</h3>
            <p className="text-sm text-slate-500">Lima agenda terdekat dari hari ini</p>

            <div className="mt-3 space-y-1">
              {upcomingEvents.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-3 py-6 text-sm text-slate-500">Belum ada agenda mendatang.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <AgendaListItem
                    key={event.id}
                    event={event}
                    onSelect={openDetail}
                    showDate
                    isGuest={isGuest(event)}
                    divisionName={isGuest(event) ? divisionLabels[event.divisionId] : ''}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AgendaEventModal
        open={formOpen}
        onOpenChange={setFormOpen}
        initialEvent={editingEvent}
        defaultDate={selectedKey}
        defaultDivisionId={editingEvent?.divisionId || divisionId}
        divisionOptions={divisions.filter((division) => division.id === (editingEvent?.divisionId || divisionId))}
        lockDivision
        conflictPool={agendaEvents}
        onSubmit={handleSubmit}
      />

      <AgendaEventDetail
        event={detailEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canManage={detailEvent ? canManage(detailEvent) : false}
        divisionName={divisions.find((division) => division.id === detailEvent?.divisionId)?.name || ''}
      />
    </div>
  )
}
