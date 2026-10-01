import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, LineChart } from 'lucide-react'
import { useData } from '../context/DataContext'
import { SectionHeader, SummaryTile } from '../components/layout/SectionHeader'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { formatDate } from '../lib/utils'
import { AGENDA_CATEGORY_ID, parseDateKey } from '../lib/agendaStorage'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function documentDate(document) {
  return new Date(document.documentDate || document.uploadedAt)
}

export default function Reports() {
  const { documents, agendaEvents, getDocumentDivision, getDocumentCategories } = useData()
  const navigate = useNavigate()

  const divisionId = sessionStorage.getItem('bpk-dashboard-selected-division') || 'finance'
  const division = getDocumentDivision(divisionId)
  const categories = getDocumentCategories(divisionId)

  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [month, setMonth] = useState('all')

  const divisionDocuments = useMemo(
    () => documents.filter((document) => document.divisionId === divisionId),
    [documents, divisionId]
  )
  const divisionAgenda = useMemo(
    () => agendaEvents.filter((event) => event.divisionId === divisionId),
    [agendaEvents, divisionId]
  )

  const years = useMemo(() => {
    const found = new Set(divisionDocuments.map((document) => documentDate(document).getFullYear()).filter(Boolean))
    divisionAgenda.forEach((event) => found.add(parseDateKey(event.eventDate).getFullYear()))
    found.add(new Date().getFullYear())
    return [...found].sort((a, b) => b - a)
  }, [divisionDocuments, divisionAgenda])

  const inPeriod = (date) => {
    if (String(date.getFullYear()) !== String(year)) return false
    return month === 'all' || date.getMonth() === Number(month)
  }

  const periodDocuments = useMemo(
    () => divisionDocuments.filter((document) => inPeriod(documentDate(document))),
    [divisionDocuments, year, month]
  )
  const periodAgenda = useMemo(
    () => divisionAgenda.filter((event) => inPeriod(parseDateKey(event.eventDate))),
    [divisionAgenda, year, month]
  )

  const rows = useMemo(
    () =>
      categories.map((category) => {
        const isAgenda = category.id === AGENDA_CATEGORY_ID
        const items = isAgenda
          ? periodAgenda.filter((event) => event.categoryId === category.id)
          : periodDocuments.filter((document) => document.categoryId === category.id)

        return {
          id: category.id,
          name: category.name,
          jenis: isAgenda ? 'Agenda' : 'Dokumen',
          total: items.length,
          selesai: isAgenda
            ? items.filter((item) => item.status === 'done').length
            : items.filter((item) => item.status === 'approved').length,
          menunggu: isAgenda
            ? items.filter((item) => item.status === 'scheduled').length
            : items.filter((item) => item.status === 'pending').length,
          batal: isAgenda
            ? items.filter((item) => item.status === 'cancelled').length
            : items.filter((item) => item.status === 'rejected').length
        }
      }),
    [categories, periodDocuments, periodAgenda]
  )

  const periodLabel = month === 'all' ? `Tahun ${year}` : `${MONTHS[Number(month)]} ${year}`

  const summary = useMemo(
    () => ({
      dokumen: periodDocuments.length,
      disetujui: periodDocuments.filter((document) => document.status === 'approved').length,
      menunggu: periodDocuments.filter((document) => document.status === 'pending').length,
      agenda: periodAgenda.length
    }),
    [periodDocuments, periodAgenda]
  )

  // Ekspor memakai pustaka xlsx yang sudah ada di proyek, jadi laporannya bisa
  // langsung dilampirkan tanpa menyalin ulang isi tabel.
  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const sheetRows = [
      [`Laporan ${division?.name || divisionId}`],
      [`Periode: ${periodLabel}`],
      [`Diunduh: ${formatDate(new Date().toISOString())}`],
      [],
      ['Layanan', 'Jenis', 'Total', 'Disetujui / Selesai', 'Menunggu / Terjadwal', 'Ditolak / Batal'],
      ...rows.map((row) => [row.name, row.jenis, row.total, row.selesai, row.menunggu, row.batal]),
      [],
      ['Total dokumen', summary.dokumen],
      ['Dokumen disetujui', summary.disetujui],
      ['Dokumen menunggu review', summary.menunggu],
      ['Agenda kegiatan', summary.agenda]
    ]

    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.aoa_to_sheet(sheetRows)
    sheet['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 22 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(workbook, sheet, 'Laporan')
    XLSX.writeFile(workbook, `Laporan ${division?.shortName || divisionId} - ${periodLabel}.xlsx`)
  }

  return (
    <div className="space-y-6 text-slate-800">
      <SectionHeader
        eyebrow="LAPORAN"
        title="Laporan"
        subtitle={`Rekapitulasi ${division?.name || 'bidang ini'} - ${periodLabel}`}
      >
        <Button variant="outline" onClick={() => navigate('/dashboard/monitoring')} className="rounded-full px-4">
          <LineChart className="h-4 w-4" /> Monitoring
        </Button>
        <Button variant="teal" onClick={exportExcel} className="rounded-full px-5">
          <Download className="h-4 w-4" /> Unduh Excel
        </Button>
      </SectionHeader>

      <div className="flex flex-wrap items-end gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="w-40">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tahun</label>
          <Select value={year} onChange={(event) => setYear(event.target.value)}>
            {years.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Bulan</label>
          <Select value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="all">Seluruh bulan</option>
            {MONTHS.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Dokumen Masuk" value={summary.dokumen} color="#2a78d6" hint={periodLabel} />
        <SummaryTile label="Disetujui" value={summary.disetujui} color="#16a34a" />
        <SummaryTile label="Menunggu Review" value={summary.menunggu} color="#f59e0b" />
        <SummaryTile label="Agenda Kegiatan" value={summary.agenda} color="#7c3aed" />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[#233b84]">Rekap per Layanan</h2>
          <p className="text-sm text-slate-500">{periodLabel}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[#f8fbff]">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Layanan</th>
                <th className="px-5 py-3">Jenis</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Disetujui / Selesai</th>
                <th className="px-5 py-3 text-right">Menunggu / Terjadwal</th>
                <th className="px-5 py-3 text-right">Ditolak / Batal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-[#233b84]">{row.name}</td>
                  <td className="px-5 py-3 text-slate-500">{row.jenis}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700">{row.total}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.selesai}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.menunggu}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.batal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
