import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-navy text-white hover:bg-navy-700 focus-visible:ring-navy-300',
  teal: 'bg-teal text-white hover:bg-teal-600 focus-visible:ring-teal-200',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-200',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200',
  link: 'bg-transparent text-teal underline-offset-4 hover:underline p-0 h-auto'
}

const sizes = {
  default: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9'
}

export const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors active:scale-[0.98]',
          'disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
