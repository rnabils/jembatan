import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

const DropdownContext = createContext(null)

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={ref}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild }) {
  const { open, setOpen } = useContext(DropdownContext)
  return (
    <div onClick={() => setOpen(!open)} className="cursor-pointer">
      {children}
    </div>
  )
}

export function DropdownMenuContent({ className, align = 'end', children }) {
  const { open } = useContext(DropdownContext)
  if (!open) return null
  return (
    <div
      className={cn(
        'absolute z-40 mt-2 min-w-[12rem] rounded-md border border-slate-200 bg-white p-1.5 shadow-panel animate-fade-in',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className, children, onClick, ...props }) {
  const { setOpen } = useContext(DropdownContext)
  return (
    <button
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-navy',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-100" />
}

export function DropdownMenuLabel({ className, children }) {
  return <div className={cn('px-3 py-1.5 text-xs font-semibold uppercase text-slate-400', className)}>{children}</div>
}
