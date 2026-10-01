import { Download, Eye, Pencil, Trash2 } from 'lucide-react'
import { formatDate, formatFileSize } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'
import { Badge } from '../ui/badge'
import { DEFAULT_ARCHIVE_STATUS, getArchiveStatusMeta, isArchiveCategory } from '../../data/archiveStatus'
import { Button } from '../ui/button'

export function DocumentTable({
  documents,
  categoryName,
  onView,
  onEdit,
  onDelete,
  onDownload,
  canEditDocument = false,
  canDeleteDocument = false,
  canDownload = false
}) {
  if (!documents.length) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
        <p className="font-medium text-slate-500">Belum ada dokumen</p>
        <p className="mt-1 text-sm text-slate-400">{categoryName || 'Kategori ini'} masih kosong.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="hidden grid-cols-[minmax(0,1.6fr)_140px_130px_120px_140px_180px] border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
        <div>Dokumen</div>
        <div>Nomor</div>
        <div>Tahun</div>
        <div>Ukuran</div>
        <div>Status</div>
        <div className="text-right">Aksi</div>
      </div>

      <div className="divide-y divide-slate-100">
        {documents.map((document) => (
          <div key={document.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_140px_130px_120px_140px_180px] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-navy">{document.title}</p>
                <StatusBadge status={document.status} />
                {isArchiveCategory(document.categoryId) && (() => {
                  const meta = getArchiveStatusMeta(document.archiveStatus || DEFAULT_ARCHIVE_STATUS)
                  return (
                    <Badge variant={meta.badge} className="gap-1">
                      <meta.icon className="h-3 w-3" /> Arsip {meta.label}
                    </Badge>
                  )
                })()}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{document.description}</p>
              <p className="mt-1 text-xs text-slate-400">{document.fileName} · {formatDate(document.documentDate || document.uploadedAt)}</p>
            </div>

            <div className="text-sm text-slate-600">{document.documentNumber || '-'}</div>
            <div className="text-sm text-slate-600">{document.year || '-'}</div>
            <div className="text-sm text-slate-600">{formatFileSize(document.fileSize)}</div>
            <div>
              <StatusBadge status={document.status} />
            </div>
            <div className="flex flex-wrap justify-start gap-2 md:justify-end">
              <Button size="sm" variant="outline" onClick={() => onView(document)}>
                <Eye className="h-3.5 w-3.5" /> View
              </Button>
              {canDownload && (
                <Button size="sm" variant="ghost" onClick={() => onDownload(document)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              )}
              {(() => {
                const editAllowed = typeof canEditDocument === 'function' ? canEditDocument(document) : canEditDocument
                return editAllowed ? (
                  <Button size="sm" variant="ghost" onClick={() => onEdit(document)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                ) : null
              })()}
              {(() => {
                const deleteAllowed = typeof canDeleteDocument === 'function' ? canDeleteDocument(document) : canDeleteDocument
                return deleteAllowed ? (
                  <Button size="sm" variant="ghost" onClick={() => onDelete(document)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                ) : null
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
