import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Info } from 'lucide-react'
import { useData } from '../context/DataContext'
import { ServiceCard } from '../components/ServiceCard'
import { SERVICE_META } from '../data/serviceMeta'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { AgendaCalendar } from '../components/agenda/AgendaCalendar'
import { AgendaListItem } from '../components/agenda/AgendaListItem'
import { AgendaEventDetail } from '../components/agenda/AgendaEventDetail'
import { OtherDivisionsToggle } from '../components/agenda/OtherDivisionsToggle'
import {
  AGENDA_CATEGORY_ID,
  agendaCoversDate,
  agendaOverlapsMonth,
  sortAgendaEvents,
  toDateKey
} from '../lib/agendaStorage'

const OTHER_DIVISIONS_KEY = 'bpk-dashboard-agenda-show-others'

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateInputValue(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Dashboard() {
  const { documents, agendaEvents, divisions, getDocumentDivision, getDocumentCategories } = useData()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()))
  const [detailEvent, setDetailEvent] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showOtherDivisions, setShowOtherDivisions] = useState(
    () => sessionStorage.getItem(OTHER_DIVISIONS_KEY) !== 'false'
  )

  const selectedDivisionId = sessionStorage.getItem('bpk-dashboard-selected-division') || 'finance'
  const division = getDocumentDivision(selectedDivisionId) || getDocumentDivision('finance')
  const categories = getDocumentCategories(selectedDivisionId) || getDocumentCategories('finance')

  const divisionDocuments = useMemo(
    () => documents.filter((document) => document.divisionId === selectedDivisionId),
    [documents, selectedDivisionId]
  )

  const divisionAgenda = useMemo(
    () => agendaEvents.filter((event) => event.divisionId === selectedDivisionId),
    [agendaEvents, selectedDivisionId]
  )
  const otherDivisionAgenda = useMemo(
    () => agendaEvents.filter((event) => event.divisionId !== selectedDivisionId),
    [agendaEvents, selectedDivisionId]
  )
  const calendarAgenda = showOtherDivisions ? agendaEvents : divisionAgenda
  const divisionLabels = useMemo(
    () => Object.fromEntries(divisions.map((division) => [division.id, division.name])),
    [divisions]
  )

  const selectedDateObject = useMemo(() => parseDateInputValue(selectedDate), [selectedDate])
  const calendarCursor = useMemo(
    () => new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth(), 1),
    [selectedDateObject]
  )
  const monthAgenda = useMemo(
    () => calendarAgenda.filter((event) => agendaOverlapsMonth(event, calendarCursor.getFullYear(), calendarCursor.getMonth())),
    [calendarAgenda, calendarCursor]
  )
  const selectedDayAgenda = useMemo(
    () => sortAgendaEvents(calendarAgenda.filter((event) => agendaCoversDate(event, toDateKey(selectedDateObject)))),
    [calendarAgenda, selectedDateObject]
  )

  const overviewCards = useMemo(
    () =>
      categories.map((category) => {
        const meta = SERVICE_META[category.id] || { title: category.name, subtitle: 'Dokumen layanan', color: '#2563eb', icon: Building2 }

        return {
          id: category.id,
          title: meta.title,
          subtitle: meta.subtitle,
          color: meta.color,
          icon: meta.icon,
          value: category.id === AGENDA_CATEGORY_ID
            ? divisionAgenda.filter((event) => event.categoryId === category.id).length
            : divisionDocuments.filter((document) => document.categoryId === category.id).length
        }
      }),
    [categories, divisionDocuments, divisionAgenda]
  )


  const goToDivision = () => {
    sessionStorage.setItem('bpk-dashboard-selected-division', selectedDivisionId)
    navigate(`/dashboard/division/${selectedDivisionId}`)
  }

  const goToAgenda = () => {
    sessionStorage.setItem('bpk-dashboard-selected-division', selectedDivisionId)
    sessionStorage.setItem(`bpk-dashboard-active-category-${selectedDivisionId}`, AGENDA_CATEGORY_ID)
    navigate(`/dashboard/division/${selectedDivisionId}`)
  }

  const setCalendarMonth = (offset) => {
    const nextMonth = new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth() + offset, 1)
    setSelectedDate(toDateInputValue(nextMonth))
  }

  const toggleOtherDivisions = (next) => {
    setShowOtherDivisions(next)
    sessionStorage.setItem(OTHER_DIVISIONS_KEY, String(next))
  }

  const openDetail = (event) => {
    setDetailEvent(event)
    setDetailOpen(true)
  }

  const goToToday = () => setSelectedDate(toDateInputValue(new Date()))

  return (
    <div className="space-y-6 text-slate-800">
      <DashboardHeader
        division={division}
        selectedDateObject={selectedDateObject}
        dateInputId="dashboard-date-filter"
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        actionLabel="Lihat Dokumen"
        actionIcon={Building2}
        onAction={goToDivision}
        onBrandClick={() => navigate('/dashboard')}
      />
      {/*
        <div>
          <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#eff5ff] px-3 py-1 text-xs font-semibold tracking-[0.26em] text-[#1f3f89] transition-colors hover:bg-[#dceaff] active:scale-[0.98]" aria-label="Kembali ke dashboard utama">
            DASHBOARD {division?.shortName?.toUpperCase() || 'DIVISI'}
          </button>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#233b84] sm:text-3xl">
            Dashboard {division?.shortName || 'Divisi'}
          </h1>
          <p className="mt-1 text-sm text-[#61739b]">Ringkasan layanan {division?.name || 'divisi'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="dashboard-date-filter" className="relative flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#233b84] shadow-sm transition-colors hover:border-blue-300 hover:bg-[#f8fbff] active:scale-[0.98]" title="Pilih tanggal filter">
            <CalendarRange className="h-4 w-4 text-[#1f63d3]" />
            {selectedDateObject.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            <input id="dashboard-date-filter" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Filter tanggal dashboard" />
          </label>
          <UserAccountMenu />
          <Button variant="teal" onClick={goToDivision} className="rounded-full px-5">
            <Building2 className="h-4 w-4" />
            Lihat Dokumen
          </Button>
        </div>
      </div>
      */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((item) => (
          <ServiceCard
            key={item.id}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
            icon={item.icon}
            color={item.color}
            onClick={goToDivision}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#233b84]">Kalender Kegiatan</h2>
          <p className="text-sm text-slate-500">
            Agenda {division?.name || 'bidang ini'}
            {showOtherDivisions ? ', beserta agenda bidang lain sebagai pembanding jadwal' : ''}
          </p>
        </div>
        <OtherDivisionsToggle
          checked={showOtherDivisions}
          onChange={toggleOtherDivisions}
          count={otherDivisionAgenda.length}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
        <AgendaCalendar
          title={`Kalender Kegiatan ${division?.shortName || 'Divisi'}`}
          cursor={calendarCursor}
          events={monthAgenda}
          selectedKey={toDateKey(selectedDateObject)}
          showDivisionTag={showOtherDivisions}
          showLegend={showOtherDivisions}
          homeDivisionId={selectedDivisionId}
          divisionLabels={divisionLabels}
          onChangeMonth={setCalendarMonth}
          onToday={goToToday}
          onSelectDay={setSelectedDate}
          onSelectEvent={openDetail}
        />

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#233b84]">Agenda Terdekat</h2>
              <p className="text-sm text-slate-500">Kegiatan pada tanggal terpilih</p>
            </div>
            <button type="button" onClick={() => navigate('/dashboard/kalender')} className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-sm font-medium text-[#1f63d3] transition-colors hover:bg-[#eff5ff] active:scale-[0.98]">
              Lihat Semua
            </button>
          </div>

          <div className="mt-4 space-y-1">
            {selectedDayAgenda.length === 0 ? (
              <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-6 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                Tidak ada kegiatan pada tanggal ini.
              </div>
            ) : (
              selectedDayAgenda.map((event) => (
                <AgendaListItem
                  key={event.id}
                  event={event}
                  onSelect={openDetail}
                  isGuest={event.divisionId !== selectedDivisionId}
                  divisionName={event.divisionId !== selectedDivisionId ? divisionLabels[event.divisionId] : ''}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AgendaEventDetail
        event={detailEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={goToAgenda}
        onDelete={goToAgenda}
        canManage={false}
        divisionName={division?.name || ''}
      />
    </div>
  )
}