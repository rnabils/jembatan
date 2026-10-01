import { useEffect, useState } from 'react'
import { ArrowLeft, Download, ExternalLink, FileSpreadsheet } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { StatusBadge } from '../components/documents/StatusBadge'
import ExcelWorkbookViewer from '../components/ExcelWorkbookViewer'
import { hasDocumentFile, resolveDocumentFileUrl } from '../lib/documentStorage'

export default function KondisiPegawaiPage() {
  const { divisionId, documentId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { documents, getDocumentDivision } = useData()
  const document = documents.find((item) => item.id === documentId) || location.state?.document
  const documentDivisionId = document?.divisionId || divisionId
  const division = getDocumentDivision(documentDivisionId)
  const [fileUrl, setFileUrl] = useState('')

  useEffect(() => {
    if (!hasDocumentFile(document)) {
      setFileUrl('')
      return undefined
    }
    let cancelled = false
    resolveDocumentFileUrl(document).then((url) => { if (!cancelled) setFileUrl(url || '') })
    return () => { cancelled = true }
  }, [document])

  const downloadFile = () => {
    if (!fileUrl) return
    const link = globalThis.document.createElement('a')
    link.href = fileUrl
    link.download = document.fileName || document.title
    link.click()
  }

  const openFile = () => {
    if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  if (!document) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <FileSpreadsheet className="h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-[#233b84]">Dokumen tidak ditemukan</h1>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/dashboard/division/${documentDivisionId}`)}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke dokumen
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-5 text-slate-800">
      <div className="flex flex-col gap-4 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(`/dashboard/division/${documentDivisionId}`)}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke {division?.shortName || 'divisi'}
        </Button>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f63d3]">Analisis Data Excel</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#10245c] sm:text-3xl">{document.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{document.fileName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={document.status} />
            <Badge variant="outline">{document.year || '-'}</Badge>
            <Button size="sm" variant="outline" onClick={openFile}><ExternalLink className="h-4 w-4" /> Buka Excel</Button>
            <Button size="sm" variant="outline" onClick={downloadFile}><Download className="h-4 w-4" /> Download</Button>
          </div>
        </div>
      </div>

      {fileUrl ? (
        <ExcelWorkbookViewer source={fileUrl} />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          File Excel belum memiliki data file yang dapat dibaca. Silakan upload ulang dokumen Bezetting.
        </div>
      )}
    </div>
  )
}
