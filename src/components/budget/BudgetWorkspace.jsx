import { useMemo } from 'react'
import { ArrowUpRight, Wallet } from 'lucide-react'
import { SummaryTile } from '../layout/SectionHeader'
import { getServiceContent } from '../../data/serviceContent'

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value || 0))}`
}

function BudgetGauge({ title, subtitle, percentage, value, valueLabel, pagu, accent, icon: Icon }) {
  const clamped = Math.max(0, Math.min(100, percentage || 0))

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#233b84]">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center justify-center sm:w-36">
          <div
            className="relative flex h-32 w-32 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(${accent} ${clamped}%, #e2e8f0 ${clamped}% 100%)` }}
          >
            <div className="absolute inset-3 rounded-full bg-white" />
            <span className="relative text-2xl font-semibold text-[#233b84]">{Math.round(clamped)}%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{valueLabel}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#233b84]">{formatRupiah(value)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pagu</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-600">{formatRupiah(pagu)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Layanan anggaran tidak berhenti di daftar berkas: angkanya dibaca dari dokumen
// anggaran dan ditampilkan sebagai konteks, dengan rincian per kode program.
export function BudgetWorkspace({ categoryId, categoryName, budget }) {
  const budgetCode = getServiceContent(categoryId).budgetCode
  const isSisa = categoryId === 'sisa-anggaran'

  // Layanan yang terikat satu kode akun hanya menampilkan angka kode itu;
  // realisasi dan sisa anggaran memakai angka keseluruhan.
  const codeRow = useMemo(
    () => (budgetCode ? (budget?.breakdown || []).find((row) => String(row.code) === budgetCode) : null),
    [budget, budgetCode]
  )

  const angka = budgetCode
    ? {
        pagu: codeRow?.pagu || 0,
        realisasi: codeRow?.realisasi || 0,
        sisa: codeRow?.sisa || 0
      }
    : {
        pagu: budget?.totalPagu || 0,
        realisasi: budget?.totalRealisasi || 0,
        sisa: budget?.totalSisa || 0
      }

  const serapanPercent = angka.pagu ? (angka.realisasi / angka.pagu) * 100 : 0
  const sisaPercent = angka.pagu ? (angka.sisa / angka.pagu) * 100 : 0

  const breakdown = useMemo(() => {
    const rows = budget?.breakdown || []
    return [...rows]
      .filter((row) => row.pagu || row.realisasi || row.sisa)
      .sort((a, b) => b.pagu - a.pagu)
  }, [budget])

  return (
    <div className="space-y-5">
      {budgetCode && !codeRow && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Kode anggaran {budgetCode} tidak ditemukan pada dokumen anggaran yang tersimpan, sehingga angkanya belum bisa ditampilkan.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Pagu Anggaran"
          value={formatRupiah(angka.pagu)}
          color="#2a78d6"
          hint={budgetCode ? `Kode ${budgetCode} - tahun ${budget?.fiscalYear || '-'}` : `Tahun ${budget?.fiscalYear || '-'}`}
        />
        <SummaryTile label="Realisasi" value={formatRupiah(angka.realisasi)} color="#16a34a" />
        <SummaryTile label="Sisa Anggaran" value={formatRupiah(angka.sisa)} color="#f59e0b" />
        <SummaryTile label="Penyerapan" value={`${Math.round(serapanPercent)}%`} color="#7c3aed" hint="Realisasi terhadap pagu" />
      </div>

      <BudgetGauge
        title={budgetCode ? categoryName || `Kode ${budgetCode}` : isSisa ? 'Sisa Anggaran' : 'Realisasi Anggaran'}
        subtitle={
          budgetCode
            ? `Penyerapan kode akun ${budgetCode} terhadap pagunya`
            : isSisa
              ? 'Pagu yang belum terserap'
              : 'Penyerapan terhadap pagu tahun berjalan'
        }
        percentage={isSisa && !budgetCode ? sisaPercent : serapanPercent}
        value={isSisa && !budgetCode ? angka.sisa : angka.realisasi}
        valueLabel={isSisa && !budgetCode ? 'Sisa Anggaran' : 'Realisasi'}
        pagu={angka.pagu}
        accent={isSisa && !budgetCode ? '#f59e0b' : '#16a34a'}
        icon={isSisa && !budgetCode ? Wallet : ArrowUpRight}
      />

      {!budgetCode && breakdown.length > 0 && (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-lg font-bold text-[#233b84]">Rincian per Kode Anggaran</h3>
            <p className="text-sm text-slate-500">Dibaca dari dokumen anggaran yang tersimpan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#f8fbff]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Kode</th>
                  <th className="px-5 py-3 text-right">Pagu</th>
                  <th className="px-5 py-3 text-right">Realisasi</th>
                  <th className="px-5 py-3 text-right">Sisa</th>
                  <th className="px-5 py-3 text-right">Serapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdown.map((row) => {
                  const percent = row.pagu ? Math.round((row.realisasi / row.pagu) * 100) : 0
                  return (
                    <tr key={row.code} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-[#233b84]">{row.code}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{formatRupiah(row.pagu)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatRupiah(row.realisasi)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatRupiah(row.sisa)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full bg-[#16a34a]" style={{ width: `${Math.min(100, percent)}%` }} />
                          </span>
                          <span className="w-10 text-right tabular-nums text-slate-600">{percent}%</span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
