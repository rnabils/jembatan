import { useMemo, useState } from 'react'
import { CalendarClock, FileText } from 'lucide-react'
import { SummaryTile } from '../layout/SectionHeader'
import { Button } from '../ui/button'
import { LegalTable } from './LegalTable'
import { formatDate } from '../../lib/utils'
import {
  AGREEMENT_STATUSES,
  AGREEMENT_TYPES,
  butuhMasaBerlaku,
  formatSisaHari,
  getAgreementStatus,
  getAgreementStatusMeta,
  getAgreementTypeMeta,
  sisaHariBerlaku
} from '../../data/agreementStatus'

// Berapa jauh ke depan daftar pemantauan menengok. Lebih panjang dari ambang
// "review" supaya yang akan masuk masa tinjau pun sudah terlihat lebih dulu.
const HORIZON_HARI = 180

export function LegalWorkspace({ documents, onSelect }) {
  const [filterTabel, setFilterTabel] = useState(null)
  const [sorotan, setSorotan] = useState(null)

  const ringkasan = useMemo(() => {
    const hitung = { aktif: 0, review: 0, berakhir: 0 }
    documents.forEach((d) => {
      const status = getAgreementStatus(d)
      if (status) hitung[status] += 1
    })
    return { ...hitung, total: documents.length }
  }, [documents])

  // Diurutkan dari yang paling dekat berakhir. Yang sudah lewat ikut masuk,
  // karena perjanjian yang kedaluwarsa tanpa disadari justru yang paling perlu
  // ditindaklanjuti.
  const pemantauan = useMemo(
    () =>
      documents
        .filter((d) => {
          const sisa = sisaHariBerlaku(d)
          return sisa !== null && sisa <= HORIZON_HARI
        })
        .sort((a, b) => sisaHariBerlaku(a) - sisaHariBerlaku(b)),
    [documents]
  )

  const belumDicatat = useMemo(() => documents.filter(butuhMasaBerlaku), [documents])

  const kartu = useMemo(
    () => [
      ...AGREEMENT_STATUSES.filter((s) => s.id !== 'aktif').map((s) => ({
        id: s.id,
        label: s.id === 'review' ? 'Akan Berakhir' : 'Sudah Berakhir',
        keterangan: s.description,
        warna: s.color,
        items: documents.filter((d) => getAgreementStatus(d) === s.id),
        filter: { status: s.id }
      })),
      {
        id: 'belum-dicatat',
        label: 'Masa Berlaku Belum Dicatat',
        keterangan: 'MoU atau perjanjian yang tanggal berakhirnya belum diisi, sehingga luput dari pemantauan.',
        warna: '#64748b',
        items: belumDicatat,
        filter: null
      }
    ],
    [documents, belumDicatat]
  )

  if (!documents.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 text-lg font-bold text-[#233b84]">Belum ada dokumen kerja sama</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
          Unggah nota kesepahaman, perjanjian kerja sama, atau telaah hukum pada bagian dokumen di bawah.
          Saat mengunggah, isi jenis dokumen, pihak terkait, tanggal ditandatangani, dan masa berlakunya
          agar dokumen yang mendekati berakhir ikut terpantau di halaman ini.
        </p>
      </div>
    )
  }

  const daftarSorotan = sorotan ? kartu.find((k) => k.id === sorotan)?.items || [] : []

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total Dokumen" value={ringkasan.total} color="#2a78d6" hint="MoU, perjanjian, dan telaah" />
        <SummaryTile label="Kerja Sama Aktif" value={ringkasan.aktif} color="#16a34a" hint="Masih berlaku" />
        <SummaryTile
          label="Perlu Ditinjau"
          value={ringkasan.review}
          color="#f59e0b"
          hint="Berakhir dalam 90 hari"
        />
        <SummaryTile label="Sudah Berakhir" value={ringkasan.berakhir} color="#dc2626" hint="Masa berlakunya lewat" />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#233b84]">Pemantauan Masa Berlaku</h2>
            <p className="text-sm text-[#61739b]">Dokumen yang perlu ditindaklanjuti sebelum masa berlakunya lewat</p>
          </div>
          {sorotan && (
            <Button variant="outline" onClick={() => setSorotan(null)} className="rounded-full px-4">
              Tutup daftar
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kartu.map((item) => {
            const jumlah = item.items.length
            const aktif = sorotan === item.id
            return (
              <button
                key={item.id}
                type="button"
                disabled={jumlah === 0}
                onClick={() => {
                  if (item.filter) {
                    setFilterTabel({ ...item.filter })
                    setSorotan(null)
                    document.getElementById('tabel-legislasi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                  }
                  setSorotan(aktif ? null : item.id)
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
                  <p className="text-sm font-semibold text-[#233b84]">{item.label}</p>
                  <span
                    aria-hidden="true"
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15"
                    style={{ backgroundColor: item.warna }}
                  />
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[#233b84]">{jumlah}</p>
                <p className="mt-1 text-xs text-slate-500">{item.keterangan}</p>
              </button>
            )
          })}
        </div>

        {sorotan && daftarSorotan.length > 0 && (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_1px_10px_rgba(15,23,42,0.06)]">
            {daftarSorotan.map((document) => {
              const jenis = getAgreementTypeMeta(document.agreementType)
              return (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(document)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[#233b84]">{document.title}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {jenis.label} &middot; {document.counterparty || 'Pihak belum dicatat'}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{document.documentNumber || '-'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {pemantauan.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_1px_10px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f8fbff] px-5 py-3">
              <CalendarClock className="h-4 w-4 shrink-0 text-[#1f63d3]" />
              <p className="text-sm font-semibold text-[#233b84]">
                Berakhir dalam {HORIZON_HARI} hari ke depan &middot; {pemantauan.length} dokumen
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {pemantauan.map((document) => {
                const status = getAgreementStatusMeta(getAgreementStatus(document))
                const jenis = getAgreementTypeMeta(document.agreementType)
                const sisa = sisaHariBerlaku(document)

                return (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(document)}
                      className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#233b84]">{document.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {jenis.label} &middot; {document.counterparty || 'Pihak belum dicatat'} &middot; berakhir{' '}
                          {formatDate(document.validUntil)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-sm tabular-nums text-slate-600">{formatSisaHari(sisa)}</span>
                        {status ? (
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-inset ring-black/15"
                            style={{ backgroundColor: status.color }}
                          />
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-[#233b84]">Sebaran Jenis Dokumen</h2>
          <p className="text-sm text-[#61739b]">Komposisi nota kesepahaman, perjanjian, dan telaah hukum</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {AGREEMENT_TYPES.map((jenis) => {
            const jumlah = documents.filter((d) => getAgreementTypeMeta(d.agreementType).id === jenis.id).length
            return (
              <div key={jenis.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <jenis.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-sm font-semibold text-[#233b84]">{jenis.label}</p>
                  <span
                    aria-hidden="true"
                    className="ml-auto h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15"
                    style={{ backgroundColor: jenis.color }}
                  />
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[#233b84]">{jumlah}</p>
                <p className="mt-1 text-xs text-slate-500">{jenis.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="tabel-legislasi" className="space-y-3">
        <LegalTable documents={documents} onSelect={onSelect} filterAwal={filterTabel} />
      </section>
    </div>
  )
}
