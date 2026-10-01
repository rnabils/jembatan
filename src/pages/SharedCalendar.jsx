import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Info } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { UserAccountMenu } from '../components/layout/UserAccountMenu'
import { AgendaCalendar } from '../components/agenda/AgendaCalendar'
import { AgendaEventModal } from '../components/agenda/AgendaEventModal'
import { AgendaEventDetail } from '../components/agenda/AgendaEventDetail'
import { DivisionFilterPanel } from '../components/agenda/DivisionFilterPanel'
import { AgendaListItem } from '../components/agenda/AgendaListItem'
import { COLORED_DIVISION_IDS } from '../data/divisionPalette'
import {
  agendaCoversDate,
  agendaEndDate,
  agendaOverlapsMonth,
  formatAgendaDate,
  parseDateKey,
  sortAgendaEvents,
  toDateKey
} from '../lib/agendaStorage'

const FILTER_KEY = 'bpk-dashboard-agenda-divisions'

export default function SharedCalendar() {
  const { agendaEvents, divisions, addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, isAgendaRemote } = useData()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const todayKey = toDateKey(new Date())

  // Hanya bidang yang punya slot warna tervalidasi yang tampil di kalender bersama.
  const calendarDivisions = useMemo(
    () => COLORED_DIVISION_IDS.map((id) => divisions.find((division) => division.id === id)).filter(Boolean),
    [divisions]
  )

  // Default: bidang sendiri + Humas dan TU Kalan, karena agenda pimpinan yang
  // berlingkup sekantor dikelola di sana. Admin melihat semuanya.
  const [activeIds, setActiveIds] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(FILTER_KEY) || 'null')
      if (Array.isArray(saved) && saved.length) return saved
    } catch {
      /* pilihan tersimpan rusak: pakai default di bawah */
    }
    if (user?.role === 'admin') return [...COLORED_DIVISION_IDS]
    return [...new Set([user?.division, 'pr'].filter(Boolean))]
  })

  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(activeIds))
  }, [activeIds])

  const divisionName = useCallback(
    (divisionId) => divisions.find((division) => division.id === divisionId)?.name || '',
    [divisions]
  )

  const visibleEvents = useMemo(
    () => agendaEvents.filter((event) => activeIds.includes(event.divisionId)),
    [agendaEvents, activeIds]
  )

  const monthEvents = useMemo(
    () => visibleEvents.filter((event) => agendaOverlapsMonth(event, cursor.getFullYear(), cursor.getMonth())),
    [visibleEvents, cursor]
  )

  const monthCountsByDivision = useMemo(() => {
    const counts = {}
    for (const event of agendaEvents) {
      if (!agendaOverlapsMonth(event, cursor.getFullYear(), cursor.getMonth())) continue
      counts[event.divisionId] = (counts[event.divisionId] || 0) + 1
    }
    return counts
  }, [agendaEvents, cursor])

  const selectedDayEvents = useMemo(
    () => sortAgendaEvents(visibleEvents.filter((event) => agendaCoversDate(event, selectedKey))),
    [visibleEvents, selectedKey]
  )

  const upcomingEvents = useMemo(
    // Kegiatan yang sedang berlangsung tetap terhitung mendatang sampai berakhir.
    () => sortAgendaEvents(visibleEvents.filter((event) => agendaEndDate(event) >= todayKey && event.status !== 'cancelled')).slice(0, 5),
    [visibleEvents, todayKey]
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

  const toggleDivision = (divisionId) => {
    setActiveIds((current) =>
      current.includes(divisionId) ? current.filter((id) => id !== divisionId) : [...current, divisionId]
    )
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
    } else {
      await addAgendaEvent(payload)
    }

    // Pastikan agenda yang baru disimpan benar-benar terlihat, bukan tersembunyi
    // di balik filter bidang yang sedang mati.
    setActiveIds((current) => (current.includes(payload.divisionId) ? current : [...current, payload.divisionId]))
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
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#eff5ff] px-3 py-1 text-xs font-semibold tracking-[0.26em] text-[#1f3f89] transition-colors hover:bg-[#dceaff] active:scale-[0.98]"
          >
            KALENDER BERSAMA
          </button>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#233b84] sm:text-3xl">Kalender Bersama</h1>
          <p className="mt-1 text-sm text-[#61739b]">Agenda seluruh bidang dalam satu tampilan</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <UserAccountMenu />
          <Button variant="teal" onClick={openCreate} className="rounded-full px-5 shadow-[0_14px_30px_rgba(31,99,211,0.26)]">
            <CalendarPlus className="h-4 w-4" /> Tambah Agenda
          </Button>
        </div>
      </div>

      {isAdmin && !isAgendaRemote && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Agenda masih tersimpan di browser ini saja. Jalankan <code className="font-semibold">supabase/agenda.sql</code> di
          SQL Editor Supabase agar agenda tersimpan di server dan terlihat oleh semua pengguna.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
        <AgendaCalendar
          title="Agenda Seluruh Bidang"
          cursor={cursor}
          events={monthEvents}
          selectedKey={selectedKey}
          showDivisionTag
          onChangeMonth={changeMonth}
          onToday={goToToday}
          onSelectDay={setSelectedKey}
          onSelectEvent={openDetail}
        />

        <div className="space-y-5">
          <DivisionFilterPanel
            divisions={calendarDivisions}
            activeIds={activeIds}
            counts={monthCountsByDivision}
            onToggle={toggleDivision}
            onSelectAll={() => setActiveIds([...COLORED_DIVISION_IDS])}
            onClear={() => setActiveIds([])}
          />

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#233b84]">Agenda Terpilih</h3>
                <p className="truncate text-sm text-slate-500">{formatAgendaDate(selectedKey)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate} className="shrink-0 rounded-full">
                <CalendarPlus className="h-3.5 w-3.5" /> Tambah
              </Button>
            </div>

            <div className="mt-3 space-y-1">
              {selectedDayEvents.length === 0 ? (
                <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-6 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {activeIds.length === 0
                    ? 'Belum ada bidang yang dicentang.'
                    : 'Tidak ada kegiatan pada tanggal ini.'}
                </div>
              ) : (
                selectedDayEvents.map((event) => (
                  <AgendaListItem
                    key={event.id}
                    event={event}
                    divisionName={divisionName(event.divisionId)}
                    onSelect={openDetail}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <h3 className="text-lg font-bold text-[#233b84]">Kegiatan Mendatang</h3>
            <p className="text-sm text-slate-500">Lima agenda terdekat dari bidang yang dicentang</p>

            <div className="mt-3 space-y-1">
              {upcomingEvents.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-3 py-6 text-sm text-slate-500">Belum ada agenda mendatang.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <AgendaListItem
                    key={event.id}
                    event={event}
                    divisionName={divisionName(event.divisionId)}
                    onSelect={openDetail}
                    showDate
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
        defaultDivisionId={editingEvent?.divisionId || user?.division || calendarDivisions[0]?.id || ''}
        divisionOptions={calendarDivisions}
        lockDivision={!isAdmin}
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
        divisionName={detailEvent ? divisionName(detailEvent.divisionId) : ''}
      />
    </div>
  )
}
