import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Badge } from '../ui/badge'
import { cn, formatDate } from '../../lib/utils'
import {
  AGREEMENT_STATUSES,
  AGREEMENT_TYPES,
  formatSisaHari,
  getAgreementStatus,
  getAgreementStatusMeta,
  getAgreementTypeMeta,
  sisaHariBerlaku
} from '../../data/agreementStatus'

const PER_HALAMAN = 15

const KOLOM = [
  { id: 'title', label: 'Nama Dokumen', lebar: 'min-w-[260px]' },
  { id: 'agreementType', label: 'Jenis', lebar: 'w-[140px]' },
  { id: 'counterparty', label: 'Pihak Terkait', lebar: 'min-w-[200px]' },
  { id: 'documentNumber', label: 'Nomor', lebar: 'min-w-[160px]' },
  { id: 'documentDate', label: 'Ditandatangani', lebar: 'w-[150px]' },
  { id: 'validUntil', label: 'Masa Berlaku', lebar: 'w-[190px]' },
  { id: 'statusKerjaSama', label: 'Status', lebar: 'w-[150px]', tanpaSort: true }
]

const FILTER_AWAL = { cari: '', jenis: 'all', status: 'all', tahun: 'all' }

export function LegalTable({ documents, onSelect, filterAwal }) {
  const [filter, setFilter] = useState({ ...FILTER_AWAL, ...filterAwal })
  const [urut, setUrut] = useState({ kolom: 'validUntil', arah: 'asc' })
  const [halaman, setHalaman] = useState(1)

  // Kartu pemantauan di atas tabel mengubah filter dari luar.
  useEffect(() => {
    if (filterAwal) {
      setFilter({ ...FILTER_AWAL, ...filterAwal })
      setHalaman(1)
    }
  }, [filterAwal])

  const tahunOpsi = useMemo(
    () => [...new Set(documents.map((d) => d.year).filter(Boolean))].sort((a, b) => b - a),
    [documents]
  )

  const tersaring = useMemo(() => {
    const kata = filter.cari.trim().toLowerCase()

    return documents.filter((d) => {
      const cocokKata =
        !kata ||
        [d.title, d.documentNumber, d.counterparty, d.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(kata))

      const cocokJenis = filter.jenis === 'all' || getAgreementTypeMeta(d.agreementType).id === filter.jenis
      const cocokStatus = filter.status === 'all' || getAgreementStatus(d) === filter.status
      const cocokTahun = filter.tahun === 'all' || String(d.year) === String(filter.tahun)

      return cocokKata && cocokJenis && cocokStatus && cocokTahun
    })
  }, [documents, filter])

  const terurut = useMemo(() => {
    const arah = urut.arah === 'asc' ? 1 : -1

    return [...tersaring].sort((a, b) => {
      // Tanggal dibandingkan sebagai tanggal, bukan teks. Yang kosong selalu
      // di belakang, ke arah mana pun diurutkan, supaya baris tanpa data tidak
      // menumpuk di atas dan menutupi yang penting.
      if (urut.kolom === 'documentDate' || urut.kolom === 'validUntil') {
        const kiri = a[urut.kolom] ? new Date(a[urut.kolom]).getTime() : null
        const kanan = b[urut.kolom] ? new Date(b[urut.kolom]).getTime() : null
        if (kiri === null && kanan === null) return 0
        if (kiri === null) return 1
        if (kanan === null) return -1
        return (kiri - kanan) * arah
      }

      const kiri = urut.kolom === 'agreementType' ? getAgreementTypeMeta(a.agreementType).label : a[urut.kolom]
      const kanan = urut.kolom === 'agreementType' ? getAgreementTypeMeta(b.agreementType).label : b[urut.kolom]
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
      <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_1px_10px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={filter.cari}
            onChange={ubahFilter('cari')}
            placeholder="Cari nama, nomor, atau pihak terkait..."
            className="pl-9"
          />
        </div>

        <Select value={filter.jenis} onChange={ubahFilter('jenis')} aria-label="Filter jenis dokumen">
          <option value="all">Semua Jenis</option>
          {AGREEMENT_TYPES.map((jenis) => (
            <option key={jenis.id} value={jenis.id}>{jenis.label}</option>
          ))}
        </Select>

        <Select value={filter.status} onChange={ubahFilter('status')} aria-label="Filter status">
          <option value="all">Semua Status</option>
          {AGREEMENT_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>{status.label}</option>
          ))}
        </Select>

        <Select value={filter.tahun} onChange={ubahFilter('tahun')} aria-label="Filter tahun">
          <option value="all">Semua Tahun</option>
          {tahunOpsi.map((tahun) => (
            <option key={tahun} value={tahun}>{tahun}</option>
          ))}
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
            <h3 className="text-lg font-bold text-[#233b84]">Daftar Dokumen</h3>
            <p className="text-sm text-slate-500">Klik satu baris untuk membuka rincian dan scan dokumennya</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {terurut.length} dari {documents.length} dokumen
          </span>
        </div>

        {terurut.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            Tidak ada dokumen yang cocok dengan pencarian dan filter ini.
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
                        kolom.lebar
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
                {tampil.map((document) => {
                  const jenis = getAgreementTypeMeta(document.agreementType)
                  const status = getAgreementStatusMeta(getAgreementStatus(document))
                  const sisa = sisaHariBerlaku(document)

                  return (
                    <tr
                      key={document.id}
                      onClick={() => onSelect(document)}
                      className="cursor-pointer transition-colors hover:bg-[#f8fbff]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#233b84]">{document.title}</p>
                        {document.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{document.description}</p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15"
                            style={{ backgroundColor: jenis.color }}
                          />
                          {jenis.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600">{document.counterparty || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{document.documentNumber || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {document.documentDate ? formatDate(document.documentDate) : '-'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {document.validUntil ? (
                          <>
                            <span className="text-slate-600">{formatDate(document.validUntil)}</span>
                            <span className="mt-0.5 block text-xs text-slate-400">{formatSisaHari(sisa)}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">{jenis.berjangka ? 'Belum dicatat' : 'Tidak berjangka'}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {status ? (
                          <Badge variant={status.badge} className="gap-1">
                            <status.icon className="h-3 w-3" /> {status.label}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
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
