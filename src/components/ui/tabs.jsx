import { createContext, useContext, useState } from 'react'
import { cn } from '../../lib/utils'

const TabsContext = createContext(null)

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value !== undefined ? value : internal
  const setActive = onValueChange || setInternal

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1',
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children, icon: Icon }) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === value
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-700',
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div className={cn('mt-4 animate-fade-in', className)}>{children}</div>
}
