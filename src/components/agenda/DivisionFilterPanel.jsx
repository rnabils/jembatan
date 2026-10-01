import { Layers } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getDivisionVisual } from '../../data/divisionPalette'

// Panel ini merangkap dua peran: kendali filter dan legenda warna. Karena selalu
// terlihat di samping kalender, tidak ada chip yang identitasnya hanya bergantung
// pada warna.
export function DivisionFilterPanel({ divisions, activeIds, onToggle, onSelectAll, onClear, counts = {} }) {
  const allActive = divisions.length > 0 && divisions.every((division) => activeIds.includes(division.id))

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#1f63d3]" />
          <h3 className="text-lg font-bold text-[#233b84]">Tampilkan Bidang</h3>
        </div>
        <button
          type="button"
          onClick={allActive ? onClear : onSelectAll}
          className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-[#1f63d3] transition-colors hover:bg-[#eff5ff] active:scale-[0.98]"
        >
          {allActive ? 'Kosongkan' : 'Pilih semua'}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {divisions.map((division) => {
          const visual = getDivisionVisual(division.id)
          const checked = activeIds.includes(division.id)

          return (
            <label
              key={division.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                checked ? 'bg-slate-50' : 'hover:bg-slate-50'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(division.id)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              />
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 rounded-[4px] ring-1 ring-inset ring-black/15"
                style={{ backgroundColor: visual.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#233b84]">{division.name}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{visual.abbr}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {counts[division.id] || 0}
              </span>
            </label>
          )
        })}
      </div>

      <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
        Warna menandai bidang, bukan jenis kegiatan. Singkatan bidang selalu ikut tercetak
        pada setiap agenda agar tetap terbaca tanpa mengandalkan warna.
      </p>
    </div>
  )
}
