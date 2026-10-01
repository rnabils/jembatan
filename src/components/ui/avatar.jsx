import { cn } from '../../lib/utils'
import { initialsFromName } from '../../lib/utils'

export function Avatar({ name = '', className, size = 'default' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg'
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-700 font-semibold text-white shrink-0',
        sizes[size],
        className
      )}
    >
      {initialsFromName(name) || '?'}
    </div>
  )
}
