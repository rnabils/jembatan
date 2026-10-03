import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LoaderCircle,
  PencilLine,
  Star,
  TrendingDown,
  User,
  UserRound,
  Users
} from 'lucide-react'
import { Button } from '../ui/button'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { hasDocumentFile, resolveDocumentFileUrl } from '../../lib/documentStorage'
import { parseExcelABK } from '../../lib/parseExcelABK'
import { formatWaktuMetrik, loadMetrics } from '../../lib/metricStorage'
import { TAMPILKAN_SUMBER_ANGKA } from '../../lib/tampilan'
import { HrDataModal } from './HrDataModal'
import {
  AGENDA_STATUSES,
  agendaCoversDate,
  getAgendaTypeMeta,
  sortAgendaEvents,
  toDateKey
} from '../../lib/agendaStorage'

const KATEGORI_BEZETTING = 'bezetting'
const HARI_KE_DEPAN = 7

const WARNA_GOLONGAN = { PNS: '#2563eb', TTT: '#7c3aed', OB: '#0ea5e9' }
const WARNA_CADANGAN = ['#16a34a', '#f59e0b', '#64748b']

// Ikon bulat di kiri, judul di sebelahnya, angka besar di bawahnya, lalu satu
// baris keterangan.
//
// Bilah persentase sebelumnya ada di sini dan sudah dilepas. Pada kartu seperti
// Cuti Aktif angkanya menyesatkan - "7%" di situ persentase terhadap seluruh
// pegawai, yang bukan pertanyaan yang sedang dijawab kartu itu. Persentase kini
// hanya tampil di kartu yang memang isinya persentase, sebagai angka utamanya,
// dengan pembagiannya diterangkan di baris keterangan.
//
// keterangan menjelaskan arti angkanya dan selalu tampil. sumber menjelaskan
// asal angkanya dan ikut saklar global - dua hal berbeda, jadi dipisah.
function Kartu({ label, nilai, keterangan, sumber, warna, ikon: Ikon, kosong = false }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      {/* Judul boleh turun ke baris kedua. Tingginya tetap dikuasai ikon 36px,
          jadi dua baris pun kartunya tidak ikut memanjang - dan judul panjang
          seperti "Ketersediaan Formasi" tidak perlu dipotong. */}
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: kosong ? '#cbd5e1' : warna }}
        >
          <Ikon className="h-4 w-4" />
        </span>
        <p className="min-w-0 text-sm font-semibold leading-tight text-[#233b84]">{label}</p>
      </div>

      <p
        className={`mt-2.5 text-3xl font-bold tabular-nums tracking-tight ${kosong ? 'text-slate-300' : 'text-[#233b84]'}`}
      >
        {kosong ? '–' : nilai}
      </p>
      <p className="mt-1 text-xs text-slate-500">{keterangan}</p>
      {TAMPILKAN_SUMBER_ANGKA && sumber ? (
        <p className="mt-0.5 text-[11px] text-slate-400">{sumber}</p>
      ) : null}
    </div>
  )
}

export function HrOverview({ divisionId }) {
  const { documents, agendaEvents } = useData()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [metrik, setMetrik] = useState(null)
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [kabar, setKabar] = useState(null)

  const bolehMengisi = isAdmin || (user?.division || user?.division_id) === divisionId

  useEffect(() => {
    let dibatalkan = false
    loadMetrics(divisionId)
      .then((hasil) => { if (!dibatalkan) setMetrik(hasil) })
      .catch(() => { if (!dibatalkan) setMetrik(null) })
    return () => { dibatalkan = true }
  }, [divisionId])

  // Angka pegawai tidak disimpan di basis data - sumbernya berkas bezetting
  // yang diunggah di layanan Bezetting. Yang dibaca selalu dokumen terbaru,
  // jadi begitu berkas periode berikutnya diunggah, dashboard ikut berubah.
  const dokumenBezetting = useMemo(() => {
    return documents
      .filter((item) => item.divisionId === divisionId && item.categoryId === KATEGORI_BEZETTING && hasDocumentFile(item))
      .sort((a, b) => new Date(b.uploadedAt || b.documentDate || 0) - new Date(a.uploadedAt || a.documentDate || 0))[0]
  }, [documents, divisionId])

  useEffect(() => {
    if (!dokumenBezetting) {
      setData(null)
      setGalat('')
      setMemuat(false)
      return undefined
    }

    let dibatalkan = false
    setMemuat(true)
    setGalat('')

    resolveDocumentFileUrl(dokumenBezetting)
      .then((url) => {
        if (!url) throw new Error('Berkas bezetting gagal diambil dari penyimpanan.')
        return parseExcelABK(url)
      })
      .then((hasil) => { if (!dibatalkan) setData(hasil) })
      .catch((error) => {
        if (dibatalkan) return
        setData(null)
        setGalat(error.message)
      })
      .finally(() => { if (!dibatalkan) setMemuat(false) })

    return () => { dibatalkan = true }
  }, [dokumenBezetting])

  const agendaTerdekat = useMemo(() => {
    const hariIni = new Date()
    const kunci = Array.from({ length: HARI_KE_DEPAN }, (_, i) => {
      const tanggal = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate() + i)
      return toDateKey(tanggal)
    })

    return sortAgendaEvents(
      agendaEvents.filter(
        (event) => event.divisionId === divisionId && kunci.some((k) => agendaCoversDate(event, k))
      )
    )
  }, [agendaEvents, divisionId])

  // Isian form menang atas angka dari berkas: diisi lebih sengaja dan biasanya
  // lebih baru. Yang tidak diisi tetap memakai angka berkasnya.
  const isian = metrik?.nilai || {}
  const pakai = (kunci, dariBerkas) => (isian[kunci] ?? null) !== null ? isian[kunci] : dariBerkas
  const sumber = (kunci) => ((isian[kunci] ?? null) !== null ? 'form' : 'berkas')

  const total = data?.total
  // Dibedakan antara "belum ada angkanya" dan "angkanya nol". Kalau form baru
  // diisi satu kolom, sisanya tidak boleh tampil sebagai 0 - tidak ada yang
  // pernah menyatakan jumlahnya nol. Yang belum ada tampil sebagai garis.
  const angkaRiil = pakai('totalPegawai', total?.riil ?? null)
  const angkaStandar = pakai('kebutuhanAbk', total?.standar ?? null)
  const adaRiil = angkaRiil !== null && angkaRiil !== undefined
  const adaStandar = angkaStandar !== null && angkaStandar !== undefined
  const riil = adaRiil ? angkaRiil : 0
  const standar = adaStandar ? angkaStandar : 0
  const kekurangan = Math.max(0, standar - riil)
  const ketersediaan = standar ? Math.round((riil / standar) * 100) : 0

  const rekap = data?.rekap
  // Komposisi disusun dari isian form bila ada, kalau tidak dari rekap berkas.
  // Keduanya tidak dicampur per golongan supaya persentasenya tetap berjumlah
  // seratus - mencampur angka dua periode akan menghasilkan total yang aneh.
  const komposisi = useMemo(() => {
    const dariForm = ['PNS', 'TTT', 'OB']
      .map((nama) => ({ nama, jumlah: isian[nama.toLowerCase()] }))
      .filter((item) => item.jumlah !== null && item.jumlah !== undefined)

    const sumberGolongan = dariForm.length ? dariForm : rekap?.golongan || []
    const laki = isian.laki ?? rekap?.laki ?? null
    const perempuan = isian.perempuan ?? rekap?.perempuan ?? null
    const totalGolongan = sumberGolongan.reduce((jumlah, item) => jumlah + (item.jumlah || 0), 0)
    const totalOrang = totalGolongan || ((laki || 0) + (perempuan || 0))

    if (!totalOrang) return null

    return {
      golongan: sumberGolongan.map((item, index) => ({
        ...item,
        warna: WARNA_GOLONGAN[item.nama] || WARNA_CADANGAN[index % WARNA_CADANGAN.length],
        persen: totalOrang ? ((item.jumlah || 0) / totalOrang) * 100 : 0
      })),
      laki,
      perempuan,
      total: totalOrang,
      dariForm: dariForm.length > 0
    }
  }, [rekap, isian])

  // Angka cuti dan diklat tidak ada di sheet ABK maupun rekap - keduanya diisi
  // manual sebagai baris label dan nilai pada sheet "JUMLAH SDM". Dicari lewat
  // kata kuncinya, bukan posisi barisnya, supaya penulisan labelnya boleh
  // berbeda. Kalau belum ada barisnya, kartunya tampil kosong, bukan nol -
  // "belum diisi" dan "tidak ada yang cuti" dua hal yang berbeda.
  const angka = (pola) => (data?.daftarAngka || []).find((item) => pola.test(item.label))
  const dariDaftar = (kunci, pola) => {
    if ((isian[kunci] ?? null) !== null) return { nilai: isian[kunci], label: 'Diisi lewat form' }
    const ketemu = angka(pola)
    return ketemu ? { nilai: ketemu.nilai, label: ketemu.label } : null
  }
  const cuti = dariDaftar('cutiAktif', /cuti/i)
  const diklat = dariDaftar('diklatBerjalan', /diklat|pelatihan/i)

  // Unit yang kekurangan orang paling banyak. Menggantikan daftar "jabatan
  // prioritas" yang tidak punya sumber data: ini dihitung dari selisih pada
  // berkas bezetting itu sendiri.
  // Berapa banyak unit yang jumlah riilnya di bawah kebutuhan. Dipakai sebagai
  // penanda berapa titik yang perlu ditindaklanjuti.
  const unitKurang = useMemo(() => {
    if (!data?.rows?.length) return 0
    return data.rows.filter(
      (row) => row.unitKerja && !/jumlah/i.test(row.unitKerja) && (row.selisih ?? 0) < 0
    ).length
  }, [data])

  if (memuat) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white p-10 text-sm text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#1f63d3]" /> Membaca data pegawai...
      </div>
    )
  }

  const formModal = (
    <HrDataModal
      open={formTerbuka}
      onOpenChange={setFormTerbuka}
      divisionId={divisionId}
      awal={metrik}
      onTersimpan={(record, { shared, message }) => {
        setMetrik(record)
        setKabar(
          shared
            ? { nada: 'sukses', teks: 'Data tersimpan dan terlihat oleh semua pengguna.' }
            : {
                nada: 'ingat',
                teks: message
                  ? `Data tersimpan di browser ini, tetapi gagal dikirim ke server: ${message}`
                  : 'Data tersimpan di browser ini saja. Jalankan supabase/jalankan-semua.sql agar terlihat oleh semua pengguna.'
              }
        )
      }}
    />
  )

  // Isian form saja sudah cukup untuk menampilkan dashboard - berkas bezetting
  // tidak wajib ada lebih dulu.
  const adaIsian = Object.keys(isian).length > 0

  if ((!dokumenBezetting && !adaIsian) || (galat && !adaIsian)) {
    return (
      <>
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-bold text-[#233b84]">Data pegawai belum tersedia</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
            {galat
              ? galat
              : 'Unggah berkas bezetting pada layanan Bezetting, atau isi langsung lewat form di bawah. Angka dari berkas dibaca otomatis; yang tidak ada di berkas bisa diketik sendiri.'}
          </p>
          {bolehMengisi && (
            <Button variant="teal" className="mt-4 rounded-full px-5" onClick={() => setFormTerbuka(true)}>
              <PencilLine className="h-4 w-4" /> Isi Data SDM
            </Button>
          )}
        </div>
        {formModal}
      </>
    )
  }

  const asalAngka = metrik?.diperbaruiPada
    ? `Sebagian angka diisi lewat form${metrik.diperbaruiOleh ? ` oleh ${metrik.diperbaruiOleh}` : ''}, ${formatWaktuMetrik(metrik.diperbaruiPada)}.`
    : 'Seluruh angka dibaca dari berkas bezetting terbaru.'
  const keteranganSumber = [TAMPILKAN_SUMBER_ANGKA ? asalAngka : '', metrik?.catatan || '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-5">
      {/* Keterangan asal angka ikut saklar global. Catatan yang diketik sendiri
          lewat form bukan keterangan sistem, jadi tetap tampil. */}
      <div
        className={`flex flex-wrap items-center gap-3 ${
          keteranganSumber ? 'justify-between' : 'justify-end'
        }`}
      >
        {keteranganSumber ? <p className="text-sm text-slate-500">{keteranganSumber}</p> : null}
        {bolehMengisi && (
          <Button variant="outline" className="rounded-full px-4" onClick={() => setFormTerbuka(true)}>
            <PencilLine className="h-4 w-4" /> Perbarui Data
          </Button>
        )}
      </div>

      {kabar && (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${
            kabar.nada === 'sukses'
              ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
              : 'bg-amber-50 text-amber-900 ring-amber-200'
          }`}
        >
          <p className="min-w-0">{kabar.teks}</p>
          <button type="button" onClick={() => setKabar(null)} className="shrink-0 cursor-pointer font-semibold underline">
            Tutup
          </button>
        </div>
      )}

      {formModal}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kartu
          label="Total Pegawai"
          nilai={riil}
          keterangan={adaRiil ? 'Pegawai aktif saat ini' : 'Belum ada angkanya'}
          sumber={
            adaRiil
              ? sumber('totalPegawai') === 'form'
                ? 'Diisi lewat form'
                : 'Jumlah riil pada berkas bezetting'
              : ''
          }
          warna="#2563eb"
          ikon={Users}
          kosong={!adaRiil}
        />
        <Kartu
          label="Cuti Aktif"
          nilai={cuti?.nilai ?? 0}
          keterangan={cuti ? 'Sedang menjalani cuti' : 'Belum ada datanya'}
          sumber={cuti ? cuti.label : 'Belum ada barisnya di berkas bezetting'}
          warna="#7c3aed"
          ikon={UserRound}
          kosong={!cuti}
        />
        <Kartu
          label="Diklat Berjalan"
          nilai={diklat?.nilai ?? 0}
          keterangan={diklat ? 'Sedang mengikuti diklat' : 'Belum ada datanya'}
          sumber={diklat ? diklat.label : 'Belum ada barisnya di berkas bezetting'}
          warna="#f97316"
          ikon={GraduationCap}
          kosong={!diklat}
        />
        {/* Satu-satunya kartu yang angka utamanya persentase, jadi keterangannya
            menyebut pembagiannya - "45 dari 85 formasi" - supaya pembaca tahu
            53 persen itu datang dari mana tanpa membuka panel lain. */}
        <Kartu
          label="Ketersediaan Formasi"
          nilai={`${ketersediaan}%`}
          keterangan={adaRiil && adaStandar ? `${riil} dari ${standar} formasi` : 'Belum ada angka formasinya'}
          warna="#16a34a"
          ikon={BarChart3}
          kosong={!adaRiil || !adaStandar}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {komposisi && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#1f63d3]">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#233b84]">Komposisi Pegawai</h2>
                <p className="text-sm text-slate-500">Menurut golongan dan jenis kelamin</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
              <div
                aria-hidden="true"
                className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${komposisi.golongan
                    .reduce(
                      (hasil, item) => {
                        const akhir = hasil.posisi + item.persen
                        hasil.bagian.push(`${item.warna} ${hasil.posisi}% ${akhir}%`)
                        hasil.posisi = akhir
                        return hasil
                      },
                      { posisi: 0, bagian: [] }
                    )
                    .bagian.join(', ')})`
                }}
              >
                {/* Bukan "Total Pegawai": angka ini jumlah golongan yang terdata,
                    yang tidak selalu sama dengan jumlah riil di kartu atas -
                    sumbernya dua sheet berbeda. Diberi nama lain supaya dua
                    angka berbeda tidak tampil dengan label yang sama. */}
                <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-bold tabular-nums text-[#233b84]">{komposisi.total}</span>
                  <span className="text-[11px] leading-tight text-slate-500">Pegawai Terdata</span>
                </div>
              </div>

              <dl className="min-w-0 flex-1 space-y-2.5">
                {komposisi.golongan.map((item) => (
                  <div key={item.nama} className="flex items-center justify-between gap-3">
                    <dt className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.warna }}
                      />
                      {item.nama}
                    </dt>
                    <dd className="flex shrink-0 items-baseline gap-2">
                      <span className="text-lg font-bold tabular-nums text-[#233b84]">{item.jumlah}</span>
                      <span className="text-xs tabular-nums text-slate-400">{Math.round(item.persen)}%</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              {[
                { label: 'Laki-laki', nilai: komposisi.laki ?? 0, warna: '#2563eb', ikon: User },
                { label: 'Perempuan', nilai: komposisi.perempuan ?? 0, warna: '#db2777', ikon: UserRound }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#f8fbff] px-4 py-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: item.warna }}
                  >
                    <item.ikon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-slate-500">{item.label}</p>
                    <p className="flex items-baseline gap-2">
                      <span className="text-xl font-bold tabular-nums text-[#233b84]">{item.nilai}</span>
                      <span className="text-xs tabular-nums text-slate-400">
                        {komposisi.total ? Math.round((item.nilai / komposisi.total) * 100) : 0}%
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kebutuhan dan kekurangan dipindah ke sini dari deretan kartu atas,
            mengikuti rancangan: kartu atas untuk angka harian, panel ini untuk
            kondisi formasinya. */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#1f63d3]">
              <TrendingDown className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#233b84]">Ringkasan SDM</h2>
              <p className="text-sm text-slate-500">Kondisi formasi terhadap kebutuhan</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3">
            {[
              {
                label: 'Pegawai Aktif',
                nilai: adaRiil ? riil : '–',
                sisi: adaRiil
                  ? riil && komposisi?.total
                    ? `${Math.round((riil / komposisi.total) * 100)}%`
                    : '100%'
                  : '',
                keterangan: adaRiil ? 'dari total pegawai' : 'belum ada angkanya',
                warna: '#16a34a',
                ikon: Users
              },
              {
                label: 'Kebutuhan ABK',
                nilai: adaStandar ? standar : '–',
                sisi: adaStandar ? '100%' : '',
                keterangan: adaStandar ? 'total formasi' : 'belum ada angkanya',
                warna: '#2563eb',
                ikon: FileText
              },
              {
                label: 'Kekurangan Pegawai',
                nilai: adaRiil && adaStandar ? kekurangan : '–',
                sisi: adaRiil && adaStandar ? `${standar ? Math.round((kekurangan / standar) * 100) : 0}%` : '',
                keterangan: adaRiil && adaStandar ? 'dari kebutuhan ABK' : 'perlu dua angka di atas',
                warna: '#dc2626',
                ikon: AlertTriangle
              },
              {
                // Hitungan per unit hanya ada kalau berkas bezettingnya terbaca.
                // Isian form tidak memuat rinciannya.
                label: 'Unit Kekurangan',
                nilai: data?.rows?.length ? unitKurang : '–',
                sisi: '',
                keterangan: data?.rows?.length ? 'perlu tindak lanjut' : 'perlu berkas bezetting',
                warna: '#7c3aed',
                ikon: Star
              }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: item.warna }}
                >
                  <item.ikon className="h-4 w-4" />
                </span>
                <dt className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium" style={{ color: item.warna }}>
                    {item.label}
                  </span>
                  <span
                    className={`block text-xl font-bold tabular-nums ${
                      item.nilai === '–' ? 'text-slate-300' : 'text-[#233b84]'
                    }`}
                  >
                    {item.nilai}
                  </span>
                </dt>
                <dd className="shrink-0 text-right">
                  {item.sisi ? (
                    <span className="block text-sm font-bold tabular-nums" style={{ color: item.warna }}>
                      {item.sisi}
                    </span>
                  ) : null}
                  <span className="block text-xs text-slate-500">{item.keterangan}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Jadwal sepekan ke depan dalam bentuk tabel. Kalender tetap ada di
          bawahnya, tetapi untuk menengok agenda terdekat beserta jenis dan
          penanggung jawabnya, daftar seperti ini lebih cepat dibaca daripada
          mencarinya satu per satu di kotak tanggal. */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#1f63d3]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#233b84]">Jadwal SDM {HARI_KE_DEPAN} Hari ke Depan</h2>
              <p className="text-sm text-slate-500">Kegiatan bidang ini pada pekan berjalan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/kalender')}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#1f63d3] transition-colors hover:bg-[#eff5ff]"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {agendaTerdekat.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Tidak ada kegiatan terjadwal pada {HARI_KE_DEPAN} hari ke depan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#f8fbff]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Agenda</th>
                  <th className="px-5 py-3">Jenis</th>
                  <th className="px-5 py-3">PIC</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agendaTerdekat.map((event) => {
                  const jenis = getAgendaTypeMeta(event.eventType)
                  const status = AGENDA_STATUSES.find((item) => item.id === event.status) || AGENDA_STATUSES[0]
                  const warnaStatus =
                    status.id === 'done'
                      ? 'bg-emerald-50 text-emerald-700'
                      : status.id === 'cancelled'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-[#eff5ff] text-[#1f3f89]'

                  return (
                    <tr key={event.id} className="transition-colors hover:bg-[#f8fbff]">
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-600">
                        {new Date(event.eventDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#233b84]">{event.title}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                            style={{ backgroundColor: jenis.color }}
                          />
                          {jenis.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{event.organizer || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${warnaStatus}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
