import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Send } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'document', label: 'Document' },
  { value: 'event', label: 'Event' },
  { value: 'gallery', label: 'Gallery Item' },
  { value: 'contact', label: 'Contact' },
  { value: 'file', label: 'File' }
]

const emptyForm = {
  type: 'announcement',
  title: '',
  description: '',
  fileName: '',
  phone: '',
  email: '',
  imageColor: '#00A99D'
}

export function SubmitContentModal({ open, onOpenChange, divisionId, defaultType }) {
  const { user } = useAuth()
  const { addContent } = useData()
  const [form, setForm] = useState({ ...emptyForm, type: defaultType || 'announcement' })
  const [error, setError] = useState('')

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.')
      return
    }
    addContent({
      division: divisionId,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      fileName: form.fileName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      imageColor: form.imageColor,
      author: user?.name
    })
    setForm({ ...emptyForm, type: defaultType || 'announcement' })
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Submit New Content</DialogTitle>
          <DialogDescription>
            Your submission will be sent to the Administrator for review before it appears publicly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Content Type</label>
            <Select value={form.type} onChange={update('type')}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
            <Input value={form.title} onChange={update('title')} placeholder="Enter a clear, descriptive title" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <Textarea
              value={form.description}
              onChange={update('description')}
              placeholder="Describe the content in detail"
            />
          </div>

          {(form.type === 'document' || form.type === 'file') && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">File Name</label>
              <Input
                value={form.fileName}
                onChange={update('fileName')}
                placeholder="e.g. report-2026.pdf"
              />
            </div>
          )}

          {form.type === 'contact' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                <Input value={form.phone} onChange={update('phone')} placeholder="+62 21 ..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <Input value={form.email} onChange={update('email')} placeholder="name@bpk.go.id" />
              </div>
            </div>
          )}

          {form.type === 'gallery' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Cover Color</label>
              <input
                type="color"
                value={form.imageColor}
                onChange={update('imageColor')}
                className="h-10 w-16 cursor-pointer rounded-md border border-slate-300"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="teal">
              <Send className="h-4 w-4" /> Submit for Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
