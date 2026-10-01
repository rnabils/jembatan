import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Check, X as XIcon, Filter, Eye } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { DocumentDetail } from '../components/documents/DocumentDetail'
import { StatusBadge } from '../components/documents/StatusBadge'
import { formatDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

export default function Approvals() {
  const { documents, divisions, approveDocument, rejectDocument, getDocumentCategory } = useData()
  const { canReviewDocuments } = useAuth()
  const navigate = useNavigate()
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [selectedForReject, setSelectedForReject] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const pendingItems = useMemo(() => {
    return documents
      .filter((document) => document.status === 'pending')
      .filter((document) => divisionFilter === 'all' || document.divisionId === divisionFilter)
      .sort((a, b) => new Date(b.uploadedAt || b.documentDate) - new Date(a.uploadedAt || a.documentDate))
  }, [documents, divisionFilter])

  const recentDecisions = useMemo(() => {
    return documents
      .filter((document) => document.status !== 'pending')
      .sort((a, b) => new Date(b.uploadedAt || b.documentDate) - new Date(a.uploadedAt || a.documentDate))
      .slice(0, 8)
  }, [documents])

  if (!canReviewDocuments()) {
    return null
  }

  const handleRejectClick = (document) => {
    setSelectedForReject(document)
    setReason('')
    setReasonOpen(true)
  }

  const handleRejectSubmit = () => {
    rejectDocument(selectedForReject.id, reason.trim() || 'Tidak ada alasan disimpan.')
    setReasonOpen(false)
    setSelectedForReject(null)
    setReason('')
  }

  const handleView = (document) => {
    if (document.categoryId === 'bezetting') {
      navigate(`/dashboard/division/${document.divisionId}/bezetting/${document.id}`, { state: { document } })
      return
    }
    setSelectedDocument(document)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
            <ShieldCheck className="h-6 w-6 text-teal" /> Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">Review dokumen pending dari seluruh bidang dan simpan alasan penolakan bila diperlukan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)} className="w-52">
            <option value="all">All Divisions</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Pending</p><p className="mt-2 text-3xl font-bold text-navy">{pendingItems.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Approved</p><p className="mt-2 text-3xl font-bold text-navy">{documents.filter((document) => document.status === 'approved').length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Rejected</p><p className="mt-2 text-3xl font-bold text-navy">{documents.filter((document) => document.status === 'rejected').length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Total Dokumen</p><p className="mt-2 text-3xl font-bold text-navy">{documents.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-semibold text-navy">Pending Review <Badge variant="warning">{pendingItems.length}</Badge></p>
          </div>
          {pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="mb-3 h-10 w-10 text-emerald-300" />
              <p className="font-medium text-slate-500">No pending submissions</p>
              <p className="mt-1 text-sm text-slate-400">Everything has been reviewed. Great job!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingItems.map((document) => {
                const division = divisions.find((item) => item.id === document.divisionId)
                const category = getDocumentCategory(document.divisionId, document.categoryId)
                return (
                  <div key={document.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-navy">{document.title}</p>
                        <Badge variant="outline">{division?.shortName}</Badge>
                        <Badge variant="default">{category?.name || 'Category'}</Badge>
                        <StatusBadge status={document.status} />
                      </div>
                      <p className="mt-1 max-w-2xl text-sm text-slate-500">{document.description}</p>
                      <p className="mt-1 text-xs text-slate-400">Submitted by {document.uploadedBy} &middot; {formatDate(document.uploadedAt || document.documentDate)}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(document)}><Eye className="h-3.5 w-3.5" /> View</Button>
                      <Button size="sm" variant="success" onClick={() => approveDocument(document.id)}><Check className="h-3.5 w-3.5" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectClick(document)}><XIcon className="h-3.5 w-3.5" /> Reject</Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-4"><p className="font-semibold text-navy">Recent Decisions</p></div>
          <div className="divide-y divide-slate-100">
            {recentDecisions.map((document) => {
              const division = divisions.find((item) => item.id === document.divisionId)
              const category = getDocumentCategory(document.divisionId, document.categoryId)
              return (
                <div key={document.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{document.title}</p>
                    <p className="text-xs text-slate-400">{division?.name} &middot; {category?.name || 'Category'} &middot; {document.uploadedBy} &middot; {formatDate(document.uploadedAt || document.documentDate)}</p>
                    {document.rejectionReason ? <p className="mt-1 text-xs text-red-600">Reason: {document.rejectionReason}</p> : null}
                  </div>
                  <Badge variant={document.status === 'approved' ? 'success' : 'destructive'}>{document.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader onClose={() => setReasonOpen(false)}>
            <div>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>Tambahkan alasan penolakan yang akan tersimpan di dokumen.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-navy">{selectedForReject?.title}</p>
              <p className="mt-1 text-xs text-slate-400">{selectedForReject?.uploadedBy}</p>
            </div>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Masukkan alasan penolakan" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReasonOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectSubmit} disabled={!selectedForReject}><XIcon className="h-4 w-4" /> Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentDetail document={selectedDocument} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}