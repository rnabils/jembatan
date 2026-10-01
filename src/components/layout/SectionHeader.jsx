import { useNavigate } from 'react-router-dom'
import { UserAccountMenu } from './UserAccountMenu'

// Header bersama untuk halaman-halaman Monitoring. Sebelumnya tiap halaman
// menyusun headernya sendiri, dan itu sumber ketidakseragaman yang sama seperti
// pada kalender dulu.
export function SectionHeader({ eyebrow, title, subtitle, children }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#eff5ff] px-3 py-1 text-xs font-semibold tracking-[0.26em] text-[#1f3f89] transition-colors hover:bg-[#dceaff] active:scale-[0.98]"
        >
          {eyebrow}
        </button>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#233b84] sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#61739b]">{subtitle}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {children}
        <UserAccountMenu />
      </div>
    </div>
  )
}

export function SummaryTile({ label, value, hint, color = '#1f63d3' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_10px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-inset ring-black/15" style={{ backgroundColor: color }} />
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#233b84]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}
