import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10 w-full animate-fade-in">{children}</div>
    </div>,
    document.body
  )
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-panel',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className, children, onClose, ...props }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between', className)} {...props}>
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold text-navy', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('mt-1 text-sm text-slate-500', className)} {...props} />
}
