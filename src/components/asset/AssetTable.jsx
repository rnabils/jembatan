import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { formatRupiah, formatTanggalIndo, punyaPsp, tahunDari } from '../../lib/assetWorkbook'
import { kondisiMeta } from '../../data/assetPalette'

const PER_HALAMAN = 15

const KOLOM = [
  { id: 'nup', label: 'NUP', align: 'left', lebar: 'w-[70px]' },
  { id: 'kodeBarang', label: 'Kode Barang', align: 'left', lebar: 'w-[130px]' },
  { id: 'namaBarang', label: 'Nama Barang', align: 'left', lebar: 'min-w-[200px]' },
  { id: 'jenisBmn', label: 'Jenis BMN', align: 'left', lebar: 'min-w-[180px]' },
  { id: 'merkTipe', label: 'Merk / Tipe', align: 'left', lebar: 'min-w-[180px]', tanpaSort: true },
  { id: 'kondisi', label: 'Kondisi', align: 'left', lebar: 'w-[120px]' },
  { id: 'tanggalPerolehan', label: 'Tgl Perolehan', align: 'left', lebar: 'w-[140px]' },
  { id: 'nilaiPerolehan', label: 'Nilai Perolehan', align: 'right', lebar: 'w-[160px]' },
  { id: 'nilaiBuku', label: 'Nilai Buku', align: 'right', lebar: 'w-[160px]' },
  { id: 'statusPenggunaan', label: 'Status Penggunaan', align: 'left', lebar: 'min-w-[200px]' },
  { id: 'noPsp', label: 'PSP', align: 'left', lebar: 'min-w-[170px]' }
]

const FILTER_AWAL = { cari: '', jenis: 'all', kondisi: 'all', tahun: 'all', psp: 'all' }

export function AssetTable({ assets, onSelect, filterAwal }) {
  const [filter, setFilter] = useState({ ...FILTER_AWAL, ...filterAwal })
  const [urut, setUrut] = useState({ kolom: 'nilaiPerolehan', arah: 'desc' })
  const [halaman, setHalaman] = useState(1)

  // Pintasan dari panel "Perlu Perhatian" mengubah filter dari luar.
  useEffect(() => {
    if (filterAwal) setFilter({ ...FILTER_AWAL, ...filterAwal })
  }, [filterAwal])

  const opsi = useMemo(
    () => ({
      jenis: [...new Set(assets.map((a) => a.jenisBmn).filter(Boolean))].sort(),
      kondisi: [...new Set(assets.map((a) => a.kondisi).filter(Boolean))].sort(),
      tahun: [...new Set(assets.map((a) => tahunDari(a.tanggalPerolehan)).filter(Boolean))].sort((a, b) => b - a)
    }),
    [assets]
  )

  const tersaring = useMemo(() => {
    const kata = filter.cari.trim().toLowerCase()

    return assets.filter((a) => {
      const cocokKata =
        !kata ||
        [a.namaBarang, a.kodeBarang, a.nup, a.merk, a.tipe, a.noPsp, a.jenisBmn]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(kata))

      const cocokJenis = filter.jenis === 'all' || a.jenisBmn === filter.jenis
      const cocokKondisi = filter.kondisi === 'all' || a.kondisi === filter.kondisi
      const cocokTahun = filter.tahun === 'all' || String(tahunDari(a.tanggalPerolehan)) === String(filter.tahun)
      const cocokPsp =
        filter.psp === 'all' || (filter.psp === 'sudah' ? punyaPsp(a) : !punyaPsp(a))

      return cocokKata && cocokJenis && cocokKondisi && cocokTahun && cocokPsp
    })
  }, [assets, filter])

  const terurut = useMemo(() => {
    const arah = urut.arah === 'asc' ? 1 : -1
    return [...tersaring].sort((a, b) => {
      const kiri = a[urut.kolom]
      const kanan = b[urut.kolom]
      if (typeof kiri === 'number' && typeof kanan === 'number') return (kiri - kanan) * arah
      return String(kiri ?? '').localeCompare(String(kanan ?? ''), 'id') * arah
    })
  }, [tersaring, urut])

  const totalHalaman = Math.max(1, Math.ceil(terurut.length / PER_HALAMAN))
  const halamanAman = Math.min(halaman, totalHalaman)
  const tampil = terurut.slice((halamanAman - 1) * PER_HALAMAN, halamanAman * PER_HALAMAN)

  const ubahFilter = (kunci) => (event) => {
    setFilter((current) => ({ ...current, [kunci]: event.target.value }))
    setHalaman(1)
  }

  const ubahUrut = (kolom) => {
    setUrut((current) =>
      current.kolom === kolom
        ? { kolom, arah: current.arah === 'asc' ? 'desc' : 'asc' }
        : { kolom, arah: 'asc' }
    )
    setHalaman(1)
  }

  const adaFilterAktif = JSON.stringify(filter) !== JSON.stringify(FILTER_AWAL)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_1px_10px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={filter.cari}
            onChange={ubahFilter('cari')}
            placeholder="Cari nama, kode barang, NUP, merk, atau PSP..."
            className="pl-9"
          />
        </div>

        <Select value={filter.jenis} onChange={ubahFilter('jenis')} aria-label="Filter jenis BMN">
          <option value="all">Semua Jenis BMN</option>
          {opsi.jenis.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>

        <Select value={filter.kondisi} onChange={ubahFilter('kondisi')} aria-label="Filter kondisi">
          <option value="all">Semua Kondisi</option>
          {opsi.kondisi.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>

        <Select value={filter.tahun} onChange={ubahFilter('tahun')} aria-label="Filter tahun perolehan">
          <option value="all">Semua Tahun</option>
          {opsi.tahun.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>

        <Select value={filter.psp} onChange={ubahFilter('psp')} aria-label="Filter status PSP">
          <option value="all">Semua Status PSP</option>
          <option value="sudah">Sudah ada PSP</option>
          <option value="belum">Belum ada PSP</option>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={() => { setFilter(FILTER_AWAL); setHalaman(1) }}
          disabled={!adaFilterAktif}
          className="justify-center"
        >
          <X className="h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#233b84]">Data Aset</h3>
            <p className="text-sm text-slate-500">Klik satu baris untuk membuka rincian aset</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {terurut.length} dari {assets.length} aset
          </span>
        </div>

        {terurut.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            Tidak ada aset yang cocok dengan pencarian dan filter ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#f8fbff]">
                <tr>
                  {KOLOM.map((kolom) => (
                    <th
                      key={kolom.id}
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400',
                        kolom.lebar,
                        kolom.align === 'right' && 'text-right'
                      )}
                    >
                      {kolom.tanpaSort ? (
                        kolom.label
                      ) : (
                        <button
                          type="button"
                          onClick={() => ubahUrut(kolom.id)}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-[#1f63d3]',
                            urut.kolom === kolom.id && 'text-[#1f63d3]'
                          )}
                        >
                          {kolom.label}
                          {urut.kolom === kolom.id &&
                            (urut.arah === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tampil.map((asset) => {
                  const meta = kondisiMeta(asset.kondisi)
                  const Icon = meta.icon
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => onSelect(asset)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 tabular-nums text-slate-600">{asset.nup || '-'}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{asset.kodeBarang || '-'}</td>
                      <td className="px-4 py-3 font-medium text-[#233b84]">{asset.namaBarang}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.jenisBmn}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {[asset.merk, asset.tipe].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.badge} className="gap-1">
                          <Icon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatTanggalIndo(asset.tanggalPerolehan)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatRupiah(asset.nilaiPerolehan)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatRupiah(asset.nilaiBuku)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{asset.statusPenggunaan || '-'}</td>
                      <td className="px-4 py-3">
                        {punyaPsp(asset) ? (
                          <span className="tabular-nums text-slate-600">{asset.noPsp}</span>
                        ) : (
                          <Badge variant="warning">Belum ada PSP</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalHalaman > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <p className="text-sm text-slate-500">
              Halaman {halamanAman} dari {totalHalaman}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                disabled={halamanAman === 1}
              >
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                disabled={halamanAman === totalHalaman}
              >
                Berikutnya <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
