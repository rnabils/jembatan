import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef(({ className, rows = 4, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:border-teal',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'
