import { useEffect, useState } from 'react'
import { FileSpreadsheet, LoaderCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { readWorkbookGrid } from '../lib/excelGrid'

// Baris pertama diperlakukan sebagai kepala tabel hanya untuk penampilan;
// isinya tidak diubah, jadi berkas dengan beberapa baris judul tetap terbaca
// sebagaimana aslinya.
function SheetGrid({ sheet }) {
  const columns = Array.from({ length: sheet.columnCount }, (_, index) => index)

  return (
    <div className="max-h-[70vh] overflow-auto">
      <table className="w-max table-fixed border-collapse text-left text-sm">
        <colgroup>
          {columns.map((columnIndex) => {
            const meta = sheet.columns?.[columnIndex]
            return (
              <col
                key={columnIndex}
                style={meta?.widthPx ? { width: `${meta.widthPx}px` } : { width: '140px' }}
              />
            )
          })}
        </colgroup>
        <tbody>
          {sheet.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={cn('border-b border-slate-100 last:border-0', rowIndex % 2 ? 'bg-white' : 'bg-[#fbfdff]')}>
              {columns.map((columnIndex) => {
                if (sheet.isCovered(rowIndex, columnIndex)) return null
                const span = sheet.spanAt(rowIndex, columnIndex)
                const value = row[columnIndex] ?? ''

                return (
                  <td
                    key={columnIndex}
                    rowSpan={span?.rowSpan}
                    colSpan={span?.colSpan}
                    className={cn(
                      'overflow-hidden whitespace-pre-line break-words border border-slate-100 px-3 py-2 align-top text-slate-700',
                      rowIndex === 0 && 'bg-[#eff5ff] font-bold text-[#233b84]',
                      columnIndex === 0 && 'sticky left-0 z-10 bg-inherit',
                      columnIndex === 0 && rowIndex !== 0 && (rowIndex % 2 ? 'bg-white' : 'bg-[#fbfdff]')
                    )}
                  >
                    {value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExcelWorkbookViewer({ source, className = '' }) {
  const [workbook, setWorkbook] = useState(null)
  const [activeSheet, setActiveSheet] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!source) {
      setWorkbook(null)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError('')
    setActiveSheet(0)

    readWorkbookGrid(source)
      .then((result) => {
        if (cancelled) return
        setWorkbook(result)
        setActiveSheet(result.defaultIndex || 0)
      })
      .catch((reason) => { if (!cancelled) setError(reason.message || 'Berkas Excel gagal dibaca.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [source])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#1f63d3]" /> Membaca isi berkas Excel...
      </div>
    )
  }

  if (error) {
    return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  }

  if (!workbook) return null

  const sheet = workbook.sheets[activeSheet] || workbook.sheets[0]

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_10px_rgba(15,23,42,0.06)]', className)}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-[#eff5ff] px-5 py-4">
        <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#1f63d3]" />
        <h2 className="font-bold text-[#233b84]">{sheet.name}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
          {sheet.rows.length} baris &middot; {sheet.columnCount} kolom
        </span>
      </div>

      {workbook.sheets.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {workbook.sheets.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveSheet(index)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                index === activeSheet
                  ? 'bg-[#1f63d3] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <SheetGrid sheet={sheet} />
    </div>
  )
}
