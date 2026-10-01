import { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink, FileWarning, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getDocumentFileExtension, hasDocumentFile, resolveDocumentFileUrl } from '../../lib/documentStorage'
import ExcelWorkbookViewer from '../ExcelWorkbookViewer'

const SPREADSHEET_EXTENSIONS = ['xlsx', 'xlsm', 'xls', 'csv']

export function DocumentPreview({ document }) {
  const [fileUrl, setFileUrl] = useState('')
  const [resolving, setResolving] = useState(false)

  const extension = getDocumentFileExtension(document.fileName)
  const isImage = ['jpg', 'jpeg', 'png'].includes(extension)
  const isPdf = extension === 'pdf'
  const isSpreadsheet = SPREADSHEET_EXTENSIONS.includes(extension)
  const available = useMemo(() => hasDocumentFile(document), [document])

  useEffect(() => {
    if (!available) {
      setFileUrl('')
      return undefined
    }

    let cancelled = false
    setResolving(true)
    resolveDocumentFileUrl(document)
      .then((url) => { if (!cancelled) setFileUrl(url || '') })
      .catch(() => { if (!cancelled) setFileUrl('') })
      .finally(() => { if (!cancelled) setResolving(false) })

    return () => { cancelled = true }
  }, [document, available])

  if (!available) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <FileWarning className="h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-navy">Dokumen ini belum memiliki berkas.</p>
        <p className="mt-1 text-sm text-slate-500">Unggah ulang dokumennya untuk melampirkan berkas.</p>
      </div>
    )
  }

  if (resolving) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#1f63d3]" /> Menyiapkan berkas...
      </div>
    )
  }

  if (!fileUrl) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <FileWarning className="h-8 w-8 text-red-300" />
        <p className="mt-3 text-sm font-medium text-red-700">Berkas gagal diambil dari penyimpanan.</p>
        <p className="mt-1 text-sm text-red-600">Coba muat ulang halaman, atau hubungi administrator.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isSpreadsheet ? (
        <ExcelWorkbookViewer source={fileUrl} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {isPdf ? (
            <iframe title={document.title} src={fileUrl} className="h-[70vh] min-h-[420px] w-full" />
          ) : isImage ? (
            <img src={fileUrl} alt={document.title} className="max-h-[420px] w-full object-contain" />
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-navy">Pratinjau tidak tersedia untuk format ini.</p>
              <p className="mt-2 text-sm text-slate-500">Gunakan tombol download untuk membuka berkas aslinya.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {(isPdf || isImage) && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            <ExternalLink className="h-4 w-4" /> Buka di tab baru
          </a>
        )}
        <a
          href={fileUrl}
          download={document.fileName || document.title}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200'
          )}
        >
          <Download className="h-4 w-4" /> Download
        </a>
      </div>
    </div>
  )
}
