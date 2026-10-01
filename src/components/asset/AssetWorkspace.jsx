import { useMemo, useState } from 'react'
import { AlertTriangle, FileSpreadsheet, Info } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { SummaryTile } from '../layout/SectionHeader'
import { Button } from '../ui/button'
import { AssetAnalytics } from './AssetAnalytics'
import { AssetTable } from './AssetTable'
import { AssetDetail } from './AssetDetail'
import {
  dataTidakLengkap,
  formatRupiahRingkas,
  kondisiPerluPerhatian,
  punyaPsp,
  ringkasAset
} from '../../lib/assetWorkbook'

// Empat hal yang membuat catatan BMN bermasalah saat diperiksa. Tiap kartu
// menjadi pintasan filter, bukan sekadar angka - kalau tidak, pengguna harus
// mencarinya sendiri di tabel.
function kartuPerhatian(assets) {
  return [
    {
      id: 'belum-psp',
      label: 'Belum memiliki PSP',
      keterangan: 'Penetapan status penggunaan belum terbit',
      items: assets.filter((a) => !punyaPsp(a)),
      filter: { psp: 'belum' },
      warna: '#f59e0b'
    },
    {
      id: 'nilai-nol',
      label: 'Nilai buku Rp0',
      keterangan: 'Sudah tersusut penuh namun masih tercatat',
      items: assets.filter((a) => a.nilaiBuku === 0),
      filter: null,
      warna: '#dc2626'
    },
    {
      id: 'kondisi',
      label: 'Kondisi perlu perhatian',
      keterangan: 'Tercatat rusak ringan atau rusak berat',
      items: assets.filter(kondisiPerluPerhatian),
      filter: null,
      warna: '#dc2626'
    },
    {
      id: 'tidak-lengkap',
      label: 'Data belum lengkap',
      keterangan: 'Ada kolom penting yang masih kosong',
      items: assets.filter((a) => dataTidakLengkap(a).length > 0),
      filter: null,
      warna: '#64748b'
    }
  ]
}

export function AssetWorkspace({ divisionId }) {
  const { assets, isAssetRemote } = useData()
  const [detail, setDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [filterTabel, setFilterTabel] = useState(null)
  const [sorotan, setSorotan] = useState(null)

  const divisionAssets = useMemo(
    () => assets.filter((a) => !a.divisionId || a.divisionId === divisionId),
    [assets, divisionId]
  )

  const ringkasan = useMemo(() => ringkasAset(divisionAssets), [divisionAssets])
  const perhatian = useMemo(() => kartuPerhatian(divisionAssets), [divisionAssets])

  const bukaDetail = (asset) => {
    setDetail(asset)
    setDetailOpen(true)
  }

  if (!divisionAssets.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
        <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 text-lg font-bold text-[#233b84]">Data BMN belum tersedia</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
          Unggah berkas daftar aset berformat Excel pada bagian dokumen di bawah. Kolom yang dibaca meliputi
          Kode Barang, NUP, Nama Barang, Jenis BMN, Kondisi, Nilai Perolehan, Nilai Buku, dan PSP.
        </p>
      </div>
    )
  }

  // Aset yang sedang disorot lewat kartu perhatian tanpa padanan filter tabel.
  const daftarSorotan = sorotan ? perhatian.find((k) => k.id === sorotan)?.items || [] : []

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryTile label="Total Aset" value={ringkasan.total} color="#2a78d6" hint="Unit tercatat" />
        <SummaryTile
          label="Total Nilai Perolehan"
          value={formatRupiahRingkas(ringkasan.nilaiPerolehan)}
          color="#16a34a"
        />
        <SummaryTile
          label="Total Penyusutan"
          value={formatRupiahRingkas(ringkasan.penyusutan)}
          color="#f59e0b"
        />
        <SummaryTile label="Total Nilai Buku" value={formatRupiahRingkas(ringkasan.nilaiBuku)} color="#7c3aed" />
        <SummaryTile
          label="Aset Aktif"
          value={ringkasan.aktif}
          color="#008300"
          hint={`dari ${ringkasan.total} aset`}
        />
        <SummaryTile
          label="Aset Belum PSP"
          value={ringkasan.belumPsp}
          color="#dc2626"
          hint="Perlu penetapan status penggunaan"
        />
      </div>

      {!isAssetRemote && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Data BMN ini dibaca dari berkas yang diunggah dan tersimpan di browser ini. Jalankan{' '}
            <code className="font-semibold">supabase/aset.sql</code> agar tersimpan di server dan terlihat oleh
            semua pengguna.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-[#233b84]">Analitik BMN</h2>
          <p className="text-sm text-[#61739b]">Sebaran jumlah, nilai, kondisi, dan umur aset</p>
        </div>
        <AssetAnalytics assets={divisionAssets} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#233b84]">Perlu Perhatian</h2>
            <p className="text-sm text-[#61739b]">Catatan yang sebaiknya ditindaklanjuti sebelum pemeriksaan</p>
          </div>
          {sorotan && (
            <Button variant="outline" onClick={() => setSorotan(null)} className="rounded-full px-4">
              Tutup daftar
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {perhatian.map((kartu) => {
            const jumlah = kartu.items.length
            const aktif = sorotan === kartu.id
            return (
              <button
                key={kartu.id}
                type="button"
                disabled={jumlah === 0}
                onClick={() => {
                  if (kartu.filter) {
                    setFilterTabel({ ...kartu.filter })
                    setSorotan(null)
                    document.getElementById('tabel-aset')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                  }
                  setSorotan(aktif ? null : kartu.id)
                }}
                className={`rounded-2xl border bg-white p-4 text-left transition-all ${
                  jumlah === 0
                    ? 'cursor-default border-slate-200 opacity-60'
                    : aktif
                      ? 'cursor-pointer border-[#1f63d3] ring-2 ring-blue-100'
                      : 'cursor-pointer border-slate-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#233b84]">{kartu.label}</p>
                  <span
                    aria-hidden="true"
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15"
                    style={{ backgroundColor: kartu.warna }}
                  />
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[#233b84]">{jumlah}</p>
                <p className="mt-1 text-xs text-slate-500">{kartu.keterangan}</p>
              </button>
            )
          })}
        </div>

        {sorotan && daftarSorotan.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_1px_10px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-[#fffbeb] px-5 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm font-semibold text-amber-900">
                {perhatian.find((k) => k.id === sorotan)?.label} &middot; {daftarSorotan.length} aset
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {daftarSorotan.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => bukaDetail(asset)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[#233b84]">{asset.namaBarang}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {asset.jenisBmn} &middot; Kode {asset.kodeBarang || '-'} &middot; NUP {asset.nup || '-'}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-slate-600">
                      {formatRupiahRingkas(asset.nilaiBuku)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section id="tabel-aset" className="space-y-3">
        <AssetTable assets={divisionAssets} onSelect={bukaDetail} filterAwal={filterTabel} />
      </section>

      <AssetDetail asset={detail} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
