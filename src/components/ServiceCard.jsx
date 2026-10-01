import { ArrowRight } from 'lucide-react'

export function ServiceCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
  active = false,
  ratio = 0.75,
  actionLabel = 'Lihat Data'
}) {
  const barWidth = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex cursor-pointer flex-col rounded-2xl border bg-white p-4 text-left shadow-[0_1px_10px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)] active:scale-[0.99] ${
        active ? 'border-blue-200 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#233b84]">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-[0_12px_20px_rgba(0,0,0,0.08)]" style={{ backgroundColor: color }}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold tracking-tight text-[#233b84]">{value}</p>
          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all" style={{ width: barWidth, backgroundColor: color }} />
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#233b84]">
          {actionLabel} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  )
}