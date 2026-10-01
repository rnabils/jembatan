import {
  Megaphone,
  FileText,
  CalendarDays,
  Image as ImageIcon,
  Contact,
  Paperclip,
  Check,
  X as XIcon,
  Trash2,
  Download,
  Mail,
  Phone
} from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { formatDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const TYPE_META = {
  announcement: { icon: Megaphone, label: 'Announcement', tone: 'teal' },
  document: { icon: FileText, label: 'Document', tone: 'default' },
  event: { icon: CalendarDays, label: 'Event', tone: 'teal' },
  gallery: { icon: ImageIcon, label: 'Gallery', tone: 'default' },
  contact: { icon: Contact, label: 'Contact', tone: 'outline' },
  file: { icon: Paperclip, label: 'File', tone: 'default' }
}

const STATUS_META = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending Review', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' }
}

export function ContentCard({ item }) {
  const { isAdmin, user } = useAuth()
  const { updateStatus, deleteContent } = useData()
  const meta = TYPE_META[item.type] || TYPE_META.document
  const Icon = meta.icon
  const statusMeta = STATUS_META[item.status] || STATUS_META.approved
  const canManage = isAdmin || item.author === user?.name

  return (
    <div className="group relative flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy leading-tight">{item.title}</p>
            <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
          </div>
        </div>
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
      </div>

      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.description}</p>

      {item.type === 'gallery' && (
        <div
          className="mt-3 flex h-28 items-center justify-center rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: item.imageColor || '#00A99D' }}
        >
          <ImageIcon className="mr-2 h-5 w-5" /> Gallery Preview
        </div>
      )}

      {(item.type === 'document' || item.type === 'file') && item.fileName && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-dashed border-slate-300 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Paperclip className="h-4 w-4 text-slate-400" />
            {item.fileName}
          </div>
          <Download className="h-4 w-4 text-slate-400" />
        </div>
      )}

      {item.type === 'contact' && (
        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
          {item.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-teal" /> {item.phone}
            </div>
          )}
          {item.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-teal" /> {item.email}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <Badge variant={meta.tone}>{meta.label}</Badge>
          <span className="text-xs text-slate-400">by {item.author}</span>
        </div>

        <div className="flex items-center gap-1">
          {isAdmin && item.status === 'pending' && (
            <>
              <Button size="sm" variant="success" onClick={() => updateStatus(item.id, 'approved')}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus(item.id, 'rejected')}>
                <XIcon className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {canManage && item.status !== 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteContent(item.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
