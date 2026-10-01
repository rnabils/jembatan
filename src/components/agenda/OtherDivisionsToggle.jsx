// Dipakai di dashboard bidang dan di agenda bidang. Satu komponen supaya kedua
// tempat itu tidak pelan-pelan berbeda seperti kalendernya dulu.
export function OtherDivisionsToggle({ checked, onChange, count = 0 }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#233b84] shadow-sm transition-colors hover:border-blue-300 hover:bg-[#f8fbff]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
      />
      Tampilkan bidang lain
      {count > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
      )}
    </label>
  )
}
