import { useMemo } from 'react'
import { kelompokkan, formatRupiahRingkas, UMUR_BUCKETS } from '../../lib/assetWorkbook'
import { kondisiMeta, warnaKategori, warnaUmur } from '../../data/assetPalette'

// Batang mendatar, bukan diagram lingkaran: perbandingan besaran jauh lebih
// mudah dibaca pada sumbu yang sama. Tiap batang diberi label langsung sehingga
// tidak perlu legenda terpisah.
function BarRow({ label, icon: Icon, value, display, max, color, hint }) {
  const persen = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#233b84]" title={label}>
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} /> : null}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">{display}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(persen, value > 0 ? 2 : 0)}%`, backgroundColor: color }}
          />
        </div>
        {hint ? <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-400">{hint}</span> : null}
      </div>
    </li>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-base font-bold text-[#233b84]">{title}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

export function AssetAnalytics({ assets }) {
  const perJenis = useMemo(() => kelompokkan(assets, (a) => a.jenisBmn), [assets])
  const perKondisi = useMemo(() => kelompokkan(assets, (a) => a.kondisi), [assets])

  const perUmur = useMemo(
    () =>
      UMUR_BUCKETS.map((bucket) => ({
        ...bucket,
        jumlah: assets.filter((a) => bucket.uji(a.umurAset)).length
      })),
    [assets]
  )

  const maxJumlahJenis = Math.max(...perJenis.map((g) => g.jumlah), 1)
  const maxNilaiJenis = Math.max(...perJenis.map((g) => g.nilaiPerolehan), 1)
  const maxKondisi = Math.max(...perKondisi.map((g) => g.jumlah), 1)
  const maxUmur = Math.max(...perUmur.map((g) => g.jumlah), 1)
  const totalAset = assets.length || 1

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Jumlah Aset per Jenis BMN" subtitle="Banyaknya unit pada tiap kelompok barang">
        {perJenis.map((g, index) => (
          <BarRow
            key={g.kunci}
            label={g.kunci}
            value={g.jumlah}
            display={`${g.jumlah} unit`}
            max={maxJumlahJenis}
            color={warnaKategori(index)}
            hint={`${Math.round((g.jumlah / totalAset) * 100)}%`}
          />
        ))}
      </Panel>

      <Panel title="Nilai BMN per Jenis" subtitle="Nilai perolehan pada tiap kelompok barang">
        {[...perJenis]
          .sort((a, b) => b.nilaiPerolehan - a.nilaiPerolehan)
          .map((g) => (
            <BarRow
              key={g.kunci}
              label={g.kunci}
              value={g.nilaiPerolehan}
              display={formatRupiahRingkas(g.nilaiPerolehan)}
              max={maxNilaiJenis}
              // Warna mengikuti entitasnya, bukan peringkat pada panel ini,
              // sehingga satu jenis berwarna sama di kedua panel.
              color={warnaKategori(perJenis.findIndex((x) => x.kunci === g.kunci))}
            />
          ))}
      </Panel>

      <Panel title="Distribusi Kondisi Aset" subtitle="Kondisi fisik menurut catatan BMN">
        {perKondisi.map((g) => {
          const meta = kondisiMeta(g.kunci)
          const Icon = meta.icon
          return (
            <BarRow
              key={g.kunci}
              label={meta.label}
              icon={Icon}
              value={g.jumlah}
              display={`${g.jumlah} unit`}
              max={maxKondisi}
              color={meta.color}
              hint={`${Math.round((g.jumlah / totalAset) * 100)}%`}
            />
          )
        })}
      </Panel>

      <Panel title="Distribusi Umur Aset" subtitle="Sebaran umur aset dalam tahun">
        {perUmur.map((g, index) => (
          <BarRow
            key={g.id}
            label={g.label}
            value={g.jumlah}
            display={`${g.jumlah} unit`}
            max={maxUmur}
            color={warnaUmur(index)}
            hint={`${Math.round((g.jumlah / totalAset) * 100)}%`}
          />
        ))}
      </Panel>
    </div>
  )
}
