import { useMemo } from 'react'
import { BarChart3, Database, FileText, PieChart } from 'lucide-react'
import { SERVICE_CONTENT } from '../../data/serviceContent'
import { SERVICE_META } from '../../data/serviceMeta'
import { TAMPILKAN_SUMBER_ANGKA } from '../../lib/tampilan'

const SERI = [
  { kunci: 'pagu', label: 'Pagu', warna: '#2563eb' },
  { kunci: 'realisasi', label: 'Realisasi', warna: '#16a34a' },
  { kunci: 'sisa', label: 'Sisa', warna: '#94a3b8' }
]

const TINGGI_PLOT = 260
const JUMLAH_GARIS = 5

// Kode akun belanja tidak menyimpan namanya sendiri di dokumen anggaran -
// yang ada hanya "51", "52", "53". Namanya diambil dari layanan yang terikat
// ke kode itu, supaya label di grafik selalu sama dengan nama layanan di
// sidebar tanpa perlu daftar terpisah yang bisa ketinggalan.
const NAMA_KODE = Object.entries(SERVICE_CONTENT).reduce((hasil, [id, isi]) => {
  if (isi.budgetCode) hasil[isi.budgetCode] = SERVICE_META[id]?.title || id
  return hasil
}, {})

function formatRupiah(nilai) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(nilai || 0))}`
}

// updatedAt datang dalam dua bentuk: "2026-10-02" bila angkanya baru dibaca
// dari berkas Excel, dan timestamp penuh "2026-09-20T15:03:32.315037+00:00"
// bila diambil dari Supabase. Keduanya dirapikan jadi satu bentuk yang sama.
//
// Tanggal polos sengaja tidak dilewatkan ke new Date() apa adanya: string itu
// dibaca sebagai tengah malam UTC, dan di zona waktu kita tanggalnya bisa
// mundur sehari.
function formatTanggal(nilai) {
  if (!nilai) return null

  const polos = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(nilai))
  const tanggal = polos
    ? new Date(Number(polos[1]), Number(polos[2]) - 1, Number(polos[3]))
    : new Date(nilai)

  if (Number.isNaN(tanggal.getTime())) return null
  return tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Sumbu dan label batang memakai satuan miliar. Angka penuh tidak muat di
// bawah batang selebar tiga puluhan piksel.
function formatMiliar(nilai) {
  const miliar = (nilai || 0) / 1e9
  return `${miliar.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`
}

// Batas atas sumbu dibulatkan ke angka yang enak dibaca, bukan ke nilai
// tertinggi apa adanya - supaya garis kisinya jatuh di kelipatan yang rapi
// berapa pun angkanya nanti.
function batasAtas(nilai) {
  if (!nilai || nilai <= 0) return 1
  const pangkat = 10 ** Math.floor(Math.log10(nilai))
  const normal = nilai / pangkat
  const langkah = normal <= 1 ? 1 : normal <= 2 ? 2 : normal <= 2.5 ? 2.5 : normal <= 5 ? 5 : 10
  return langkah * pangkat
}

export function BudgetOverview({ budget }) {
  const baris = useMemo(() => {
    const rincian = (budget?.breakdown || [])
      .filter((row) => row.pagu || row.realisasi || row.sisa)
      .map((row) => ({
        kode: String(row.code),
        label: NAMA_KODE[String(row.code)] || `Kode ${row.code}`,
        pagu: row.pagu || 0,
        realisasi: row.realisasi || 0,
        sisa: row.sisa || 0
      }))

    if (!budget?.totalPagu) return rincian

    return [
      ...rincian,
      {
        kode: 'total',
        label: 'Total',
        pagu: budget.totalPagu,
        realisasi: budget.totalRealisasi || 0,
        sisa: budget.totalSisa || 0
      }
    ]
  }, [budget])

  const maksimum = useMemo(
    () => batasAtas(Math.max(0, ...baris.flatMap((row) => [row.pagu, row.realisasi, row.sisa]))),
    [baris]
  )

  const garis = useMemo(
    () => Array.from({ length: JUMLAH_GARIS + 1 }, (_, i) => (maksimum / JUMLAH_GARIS) * i),
    [maksimum]
  )

  const persenRealisasi = budget?.totalPagu
    ? Math.max(0, Math.min(100, (budget.totalRealisasi / budget.totalPagu) * 100))
    : 0
  const persenSisa = Math.max(0, 100 - persenRealisasi)

  if (!budget?.totalPagu) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 text-lg font-bold text-[#233b84]">Angka anggaran belum tersedia</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
          Unggah dokumen anggaran berformat Excel pada layanan Realisasi Anggaran. Angka di halaman ini
          dibaca langsung dari berkas itu, jadi begitu berkasnya diperbarui, tampilan ini ikut berubah.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#233b84]">Nilai Anggaran (Rp)</h2>
            <p className="text-sm text-slate-500">
              Pagu, realisasi, dan sisa per jenis belanja &middot; tahun {budget.fiscalYear || '-'}
            </p>
          </div>
          {TAMPILKAN_SUMBER_ANGKA && formatTanggal(budget.updatedAt) && (
            <p className="text-xs text-slate-400">Diperbarui {formatTanggal(budget.updatedAt)}</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <div
            className="flex w-24 shrink-0 flex-col-reverse justify-between text-right text-[10px] tabular-nums leading-none text-slate-400 sm:w-32 sm:text-[11px]"
            style={{ height: TINGGI_PLOT }}
            aria-hidden="true"
          >
            {garis.map((nilai) => (
              <span key={nilai}>{new Intl.NumberFormat('id-ID').format(Math.round(nilai))}</span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1" style={{ height: TINGGI_PLOT }}>
            {garis.map((nilai) => (
              <div
                key={nilai}
                aria-hidden="true"
                className="absolute inset-x-0 border-t border-slate-100"
                style={{ bottom: `${(nilai / maksimum) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex items-end justify-around gap-2 sm:gap-4">
              {baris.map((row) => (
                <div key={row.kode} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-2">
                  {SERI.map((seri) => {
                    const nilai = row[seri.kunci]
                    const tinggi = (nilai / maksimum) * 100
                    return (
                      <div key={seri.kunci} className="relative h-full w-full max-w-[30px] sm:max-w-[38px]">
                        <span
                          className="absolute w-full text-center text-[9px] font-semibold tabular-nums leading-none text-slate-600 sm:text-[11px]"
                          style={{ bottom: `calc(${tinggi}% + 5px)` }}
                        >
                          {formatMiliar(nilai)}
                        </span>
                        <div
                          title={`${row.label} - ${seri.label}: ${formatRupiah(nilai)}`}
                          className="absolute bottom-0 w-full rounded-t-[3px]"
                          style={{
                            height: `${tinggi}%`,
                            minHeight: nilai > 0 ? 2 : 0,
                            backgroundColor: seri.warna
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <div className="w-24 shrink-0 sm:w-32" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 justify-around gap-2 sm:gap-4">
            {baris.map((row) => (
              <p
                key={row.kode}
                className="min-w-0 flex-1 text-balance text-center text-[11px] font-semibold leading-tight text-[#233b84] sm:text-sm"
              >
                {row.label}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-4">
          {SERI.map((seri) => (
            <span key={seri.kunci} className="flex items-center gap-2 text-sm text-slate-600">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-[3px]"
                style={{ backgroundColor: seri.warna }}
              />
              {seri.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#1f63d3]">
              <Database className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#233b84]">Total Anggaran</h2>
              <p className="text-sm text-slate-500">Berdasarkan seluruh kategori belanja</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3">
            {[
              { label: 'Pagu Anggaran', nilai: budget.totalPagu, warna: '#2563eb', ikon: Database },
              { label: 'Realisasi Anggaran', nilai: budget.totalRealisasi, warna: '#16a34a', ikon: BarChart3 },
              { label: 'Sisa Anggaran', nilai: budget.totalSisa, warna: '#64748b', ikon: FileText }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: item.warna }}
                >
                  <item.ikon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-medium" style={{ color: item.warna }}>{item.label}</dt>
                  <dd className="text-xl font-bold tabular-nums tracking-tight text-[#233b84] sm:text-2xl">
                    {formatRupiah(item.nilai)}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#1f63d3]">
              <PieChart className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#233b84]">Persentase Realisasi Anggaran</h2>
              <p className="text-sm text-slate-500">Dari total anggaran</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <div
              aria-hidden="true"
              className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#2563eb ${persenRealisasi}%, #cbd5e1 ${persenRealisasi}% 100%)`
              }}
            >
              <div className="absolute inset-[26px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-bold tabular-nums tracking-tight text-[#233b84]">
                  {Math.round(persenRealisasi)}%
                </span>
                <span className="text-[11px] leading-tight text-slate-500">Realisasi</span>
              </div>
            </div>

            <dl className="min-w-0 space-y-4">
              {[
                { label: 'Realisasi Anggaran', persen: persenRealisasi, nilai: budget.totalRealisasi, warna: '#2563eb' },
                { label: 'Sisa Anggaran', persen: persenSisa, nilai: budget.totalSisa, warna: '#cbd5e1' }
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.warna }}
                  />
                  <div className="min-w-0">
                    <dt className="text-xl font-bold tabular-nums text-[#233b84]">
                      {Math.round(item.persen)}%
                    </dt>
                    <dd className="text-sm text-slate-600">{item.label}</dd>
                    <dd className="text-xs tabular-nums text-slate-400">{formatRupiah(item.nilai)}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
