import { ChevronRight } from 'lucide-react'

export function CategoryCard({ category, count = 0, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full flex-col rounded-2xl border p-4 text-left transition-all ${
        active
          ? 'border-sky-400 bg-sky-50 shadow-panel'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-panel'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-navy">{category.name}</p>
          <p className="mt-1 text-sm text-slate-500">{category.description}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Subbagian</span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  )
}
