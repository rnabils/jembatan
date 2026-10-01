import { cn } from '../lib/utils'

export function StatCard({ icon: Icon, label, value, tone = 'navy', trend }) {
  const tones = {
    navy: 'bg-navy-50 text-navy',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
