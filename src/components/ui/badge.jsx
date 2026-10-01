import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-navy-50 text-navy border border-navy-100',
  teal: 'bg-teal-50 text-teal-700 border border-teal-100',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  destructive: 'bg-red-50 text-red-700 border border-red-100',
  outline: 'bg-white text-slate-600 border border-slate-200'
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
