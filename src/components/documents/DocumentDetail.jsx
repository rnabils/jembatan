import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { formatDate, formatFileSize } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'
import { DocumentPreview } from './DocumentPreview'
import { getDocumentFileExtension } from '../../lib/documentStorage'
import {
  formatSisaHari,
  getAgreementStatus,
  getAgreementStatusMeta,
  getAgreementTypeMeta,
  sisaHariBerlaku
} from '../../data/agreementStatus'

export function DocumentDetail({ document, open, onOpenChange }) {
  if (!document) return null
  const extension = getDocumentFileExtension(document.fileName)
  // Blok kerja sama hanya muncul bila dokumennya memang membawa metadata itu,
  // jadi dokumen kategori lain tampil persis seperti sebelumnya.
  const jenisKerjaSama = document.agreementType ? getAgreementTypeMeta(document.agreementType) : null
  const statusKerjaSama = jenisKerjaSama ? getAgreementStatusMeta(getAgreementStatus(document)) : null
  const isWideContent = ['xlsx', 'xlsm', 'xls', 'csv', 'pdf'].includes(extension)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isWideContent ? 'max-w-6xl' : 'max-w-4xl'}>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div>
            <DialogTitle>{document.title}</DialogTitle>
            <DialogDescription>{document.description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={document.status} />
          <Badge variant="outline">{document.year}</Badge>
          <Badge variant="outline">{document.fileName}</Badge>
          {jenisKerjaSama ? <Badge variant="outline">{jenisKerjaSama.label}</Badge> : null}
          {statusKerjaSama ? (
            <Badge variant={statusKerjaSama.badge} className="gap-1">
              <statusKerjaSama.icon className="h-3 w-3" /> {statusKerjaSama.label}
            </Badge>
          ) : null}
        </div>

        <div className={isWideContent ? 'space-y-5' : 'grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'}>
            <DocumentPreview document={document} />

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Nomor Dokumen</span>
              <span className="font-medium text-navy">{document.documentNumber || '-'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">{jenisKerjaSama ? 'Ditandatangani' : 'Tanggal Dokumen'}</span>
              <span className="font-medium text-navy">{document.documentDate ? formatDate(document.documentDate) : '-'}</span>
            </div>
            {jenisKerjaSama ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Jenis</span>
                  <span className="font-medium text-navy">{jenisKerjaSama.label}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Pihak Terkait</span>
                  <span className="font-medium text-navy">{document.counterparty || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Masa Berlaku</span>
                  <span className="text-right font-medium text-navy">
                    {document.validUntil ? (
                      <>
                        {formatDate(document.validUntil)}
                        <span className="block text-xs font-normal text-slate-400">
                          {formatSisaHari(sisaHariBerlaku(document))}
                        </span>
                      </>
                    ) : jenisKerjaSama.berjangka ? (
                      'Belum dicatat'
                    ) : (
                      'Tidak berjangka'
                    )}
                  </span>
                </div>
              </>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Ukuran File</span>
              <span className="font-medium text-navy">{formatFileSize(document.fileSize)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Diunggah Oleh</span>
              <span className="font-medium text-navy">{document.uploadedBy || '-'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Diunggah Pada</span>
              <span className="font-medium text-navy">{document.uploadedAt ? formatDate(document.uploadedAt) : '-'}</span>
            </div>
            {document.rejectionReason ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                <p className="text-xs font-semibold uppercase tracking-wide">Alasan Penolakan</p>
                <p className="mt-1 text-sm">{document.rejectionReason}</p>
              </div>
            ) : null}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
