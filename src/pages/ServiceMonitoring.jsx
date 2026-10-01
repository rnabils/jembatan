import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, FileText } from 'lucide-react'
import { useData } from '../context/DataContext'
import { SectionHeader, SummaryTile } from '../components/layout/SectionHeader'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { formatDate } from '../lib/utils'
import { AGENDA_CATEGORY_ID } from '../lib/agendaStorage'

const STALE_DAYS = 90

function daysSince(dateValue) {
  if (!dateValue) return null
  const diff = Date.now() - new Date(dateValue).getTime()
  return Number.isFinite(diff) ? Math.floor(diff / 86400000) : null
}

// Status layanan dibaca dari datanya sendiri, bukan diisi manual: layanan yang
// punya tunggakan review lebih mendesak daripada layanan yang sekadar sepi.
function describeHealth({ total, pending, lastActivityDays }) {
  if (total === 0) return { label: 'Belum ada data', variant: 'outline' }
  if (pending > 0) return { label: `${pending} menunggu review`, variant: 'warning' }
  if (lastActivityDays !== null && lastActivityDays > STALE_DAYS) {
    return { label: `Tidak ada pembaruan ${lastActivityDays} hari`, variant: 'destructive' }
  }
  return { label: 'Berjalan', variant: 'success' }
}

export default function ServiceMonitoring() {
  const { documents, agendaEvents, getDocumentDivision, getDocumentCategories } = useData()
  const navigate = useNavigate()

  const divisionId = sessionStorage.getItem('bpk-dashboard-selected-division') || 'finance'
  const division = getDocumentDivision(divisionId)
  const categories = getDocumentCategories(divisionId)

  const divisionDocuments = useMemo(
    () => documents.filter((document) => document.divisionId === divisionId),
    [documents, divisionId]
  )

  const rows = useMemo(
    () =>
      categories.map((category) => {
        const isAgenda = category.id === AGENDA_CATEGORY_ID
        const items = isAgenda
          ? agendaEvents.filter((event) => event.divisionId === divisionId && event.categoryId === category.id)
          : divisionDocuments.filter((document) => document.categoryId === category.id)

        const lastActivity = items.reduce((latest, item) => {
          const value = item.uploadedAt || item.createdAt || item.documentDate || item.eventDate
          if (!value) return latest
          return !latest || new Date(value) > new Date(latest) ? value : latest
        }, null)

        const pending = isAgenda ? 0 : items.filter((item) => item.status === 'pending').length

        return {
          id: category.id,
          name: category.name,
          isAgenda,
          total: items.length,
          approved: isAgenda ? items.filter((item) => item.status === 'done').length : items.filter((item) => item.status === 'approved').length,
          pending,
          rejected: isAgenda ? items.filter((item) => item.status === 'cancelled').length : items.filter((item) => item.status === 'rejected').length,
          lastActivity,
          health: describeHealth({ total: items.length, pending, lastActivityDays: daysSince(lastActivity) })
        }
      }),
    [categories, divisionDocuments, agendaEvents, divisionId]
  )

  const summary = useMemo(
    () => ({
      total: divisionDocuments.length,
      pending: divisionDocuments.filter((document) => document.status === 'pending').length,
      approved: divisionDocuments.filter((document) => document.status === 'approved').length,
      kosong: rows.filter((row) => row.total === 0).length
    }),
    [divisionDocuments, rows]
  )

  const openCategory = (row) => {
    sessionStorage.setItem('bpk-dashboard-selected-division', divisionId)
    sessionStorage.setItem(`bpk-dashboard-active-category-${divisionId}`, row.id)
    navigate(`/dashboard/division/${divisionId}`)
  }

  return (
    <div className="space-y-6 text-slate-800">
      <SectionHeader
        eyebrow="MONITORING LAYANAN"
        title="Monitoring Layanan"
        subtitle={`Kondisi tiap layanan pada ${division?.name || 'bidang ini'}`}
      >
        <Button variant="outline" onClick={() => navigate('/dashboard/laporan')} className="rounded-full px-4">
          <FileText className="h-4 w-4" /> Buka Laporan
        </Button>
      </SectionHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total Dokumen" value={summary.total} color="#2a78d6" />
        <SummaryTile label="Menunggu Review" value={summary.pending} color="#f59e0b" hint="Perlu ditindaklanjuti admin" />
        <SummaryTile label="Sudah Disetujui" value={summary.approved} color="#16a34a" />
        <SummaryTile label="Layanan Kosong" value={summary.kosong} color="#64748b" hint="Belum memiliki data sama sekali" />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[#233b84]">Rincian per Layanan</h2>
          <p className="text-sm text-slate-500">Klik satu baris untuk membuka layanannya</p>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.6fr)_90px_110px_120px_110px_150px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
          <div>Layanan</div>
          <div className="text-right">Total</div>
          <div className="text-right">Disetujui</div>
          <div className="text-right">Menunggu</div>
          <div className="text-right">Ditolak</div>
          <div>Aktivitas Terakhir</div>
          <div>Kondisi</div>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => openCategory(row)}
              className="grid w-full cursor-pointer grid-cols-1 gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 active:scale-[0.998] lg:grid-cols-[minmax(0,1.6fr)_90px_110px_120px_110px_150px_minmax(0,1fr)] lg:items-center"
            >
              <div className="flex items-center gap-2 font-semibold text-[#233b84]">
                {row.isAgenda ? <CalendarDays className="h-4 w-4 shrink-0 text-[#1f63d3]" /> : <FileText className="h-4 w-4 shrink-0 text-[#1f63d3]" />}
                <span className="truncate">{row.name}</span>
              </div>
              <div className="text-sm text-slate-700 lg:text-right">
                <span className="font-semibold lg:hidden">Total: </span>{row.total}
              </div>
              <div className="text-sm text-slate-600 lg:text-right">
                <span className="font-semibold lg:hidden">Disetujui: </span>{row.approved}
              </div>
              <div className="text-sm text-slate-600 lg:text-right">
                <span className="font-semibold lg:hidden">Menunggu: </span>{row.pending}
              </div>
              <div className="text-sm text-slate-600 lg:text-right">
                <span className="font-semibold lg:hidden">Ditolak: </span>{row.rejected}
              </div>
              <div className="text-sm text-slate-500">{row.lastActivity ? formatDate(row.lastActivity) : '-'}</div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant={row.health.variant}>{row.health.label}</Badge>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 lg:block" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
