import { CalendarRange } from 'lucide-react'
import { Button } from '../ui/button'
import { UserAccountMenu } from './UserAccountMenu'

export function DashboardHeader({
  division,
  selectedDateObject,
  dateInputId,
  selectedDate,
  onDateChange,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  actionDisabled = false,
  onBrandClick,
  showAction = true
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:flex-row lg:items-center lg:justify-between">
      <div>
        <button type="button" onClick={onBrandClick} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#eff5ff] px-3 py-1 text-xs font-semibold tracking-[0.26em] text-[#1f3f89] transition-colors hover:bg-[#dceaff] active:scale-[0.98]">
          DASHBOARD {division?.shortName?.toUpperCase() || 'DIVISI'}
        </button>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#233b84] sm:text-3xl">
          {division?.name ? `Selamat datang di Subbag ${division.name}` : 'Selamat datang'}
        </h1>
        <p className="mt-1 text-sm text-[#61739b]">Ringkasan layanan, dokumen, dan agenda bidang ini</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={dateInputId} className="relative flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#233b84] shadow-sm transition-colors hover:border-blue-300 hover:bg-[#f8fbff] active:scale-[0.98]" title="Pilih tanggal filter">
          <CalendarRange className="h-4 w-4 text-[#1f63d3]" />
          {selectedDateObject.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          <input id={dateInputId} type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Filter tanggal dashboard" />
        </label>
        <UserAccountMenu />
        {showAction && (
          <Button variant="teal" onClick={onAction} disabled={actionDisabled} className="rounded-full px-5 shadow-[0_14px_30px_rgba(31,99,211,0.26)]">
            <ActionIcon className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}