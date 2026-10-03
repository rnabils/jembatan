import { useEffect, useRef, useState } from 'react'
import { FileSpreadsheet, Info, LoaderCircle, Save, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { useAuth } from '../../context/AuthContext'
import { parseExcelABK } from '../../lib/parseExcelABK'
import { HR_METRICS, KELOMPOK_METRIK, saveMetrics } from '../../lib/metricStorage'

// Memetakan isi berkas bezetting ke kunci-kunci form. Berkasnya menyimpan hal
// yang sama dengan nama yang berbeda-beda, jadi pemetaannya ditulis di satu
// tempat ini supaya mudah ditambah kalau nanti berkasnya berubah.
function dariBerkas(hasil) {
  const golongan = (nama) => hasil?.rekap?.golongan?.find((item) => item.nama === nama)?.jumlah
  const daftar = (pola) => hasil?.daftarAngka?.find((item) => pola.test(item.label))

  return {
    totalPegawai: hasil?.total?.riil ?? null,
    kebutuhanAbk: hasil?.total?.standar ?? null,
    cutiAktif: daftar(/cuti/i)?.nilai ?? null,
    diklatBerjalan: daftar(/diklat|pelatihan/i)?.nilai ?? null,
    pns: golongan('PNS') ?? null,
    ttt: golongan('TTT') ?? null,
    ob: golongan('OB') ?? null,
    laki: hasil?.rekap?.laki ?? null,
    perempuan: hasil?.rekap?.perempuan ?? null
  }
}

export function HrDataModal({ open, onOpenChange, divisionId, awal, onTersimpan }) {
  const { user } = useAuth()
  const [nilai, setNilai] = useState({})
  const [catatan, setCatatan] = useState('')
  const [dariExcel, setDariExcel] = useState({})
  const [namaBerkas, setNamaBerkas] = useState('')
  const [membaca, setMembaca] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState('')
  const [pesan, setPesan] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setNilai(Object.fromEntries(Object.entries(awal?.nilai || {}).map(([k, v]) => [k, String(v)])))
    setCatatan(awal?.catatan || '')
    setDariExcel({})
    setNamaBerkas('')
    setGalat('')
    setPesan('')
    setMenyimpan(false)
  }, [open, awal])

  // Berkas di sini tidak disimpan ke mana pun. Ia hanya dibaca untuk mengisi
  // kolom form, lalu dilupakan - yang tersimpan cuma angka yang Anda setujui
  // saat menekan Simpan. Jadi salah pilih berkas tidak merusak apa pun.
  const ambilDariBerkas = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setMembaca(true)
    setGalat('')
    setPesan('')

    try {
      const hasil = await parseExcelABK(file)
      const terbaca = dariBerkas(hasil)
      const terisi = Object.entries(terbaca).filter(([, angka]) => angka !== null && angka !== undefined)

      if (!terisi.length) {
        setGalat('Berkas terbaca, tetapi tidak ada angka yang dikenali di dalamnya.')
        return
      }

      setNilai((sekarang) => {
        const berikut = { ...sekarang }
        terisi.forEach(([kunci, angka]) => { berikut[kunci] = String(angka) })
        return berikut
      })
      setDariExcel(Object.fromEntries(terisi.map(([kunci]) => [kunci, true])))
      setNamaBerkas(file.name)
      setPesan(`${terisi.length} kolom terisi dari berkas. Periksa dulu, lengkapi yang kosong, baru simpan.`)
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMembaca(false)
    }
  }

  const ubah = (kunci) => (event) => {
    const teks = event.target.value
    setNilai((sekarang) => ({ ...sekarang, [kunci]: teks }))
    // Begitu disunting tangan, penanda "dari berkas" dilepas supaya tidak
    // mengaku angka itu datang dari sana.
    setDariExcel((sekarang) => {
      if (!sekarang[kunci]) return sekarang
      const berikut = { ...sekarang }
      delete berikut[kunci]
      return berikut
    })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setMenyimpan(true)
    setGalat('')

    const angka = {}
    for (const { kunci, label } of HR_METRICS) {
      const teks = String(nilai[kunci] ?? '').trim()
      if (!teks) continue
      const parsed = Number(teks.replace(/\./g, '').replace(',', '.'))
      if (!Number.isFinite(parsed) || parsed < 0) {
        setGalat(`Nilai "${label}" harus berupa angka tidak negatif.`)
        setMenyimpan(false)
        return
      }
      angka[kunci] = parsed
    }

    try {
      const { record, shared, message } = await saveMetrics(divisionId, {
        nilai: angka,
        catatan,
        namaPengguna: user?.name || '',
        userId: user?.id || null
      })
      onTersimpan(record, { shared, message })
      onOpenChange(false)
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div>
            <DialogTitle>Perbarui Data SDM</DialogTitle>
            <DialogDescription>
              Isi langsung, atau tarik dulu dari berkas lalu lengkapi yang kosong.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex min-w-0 items-start gap-2 text-sm text-sky-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Berkas yang dipilih di sini <strong>tidak disimpan</strong> dan tidak menimpa dokumen mana pun.
                Isinya hanya dipakai mengisi kolom di bawah.
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-full px-4"
              disabled={membaca}
              onClick={() => inputRef.current?.click()}
            >
              {membaca ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {membaca ? 'Membaca...' : 'Ambil dari Excel'}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm,.xls"
              className="hidden"
              onChange={ambilDariBerkas}
            />
          </div>
          {namaBerkas && <p className="mt-2 text-xs text-sky-800">Dibaca dari: {namaBerkas}</p>}
        </div>

        {pesan ? (
          <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {pesan}
          </div>
        ) : null}
        {galat ? (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {galat}
          </div>
        ) : null}

        <form onSubmit={simpan} className="space-y-5">
          {KELOMPOK_METRIK.map((kelompok) => (
            <div key={kelompok}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{kelompok}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {HR_METRICS.filter((item) => item.kelompok === kelompok).map((item) => (
                  <div key={item.kunci}>
                    <label
                      htmlFor={`metrik-${item.kunci}`}
                      className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700"
                    >
                      {item.label}
                      {dariExcel[item.kunci] && (
                        <span
                          title="Terisi dari berkas yang baru dibaca"
                          className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> dari berkas
                        </span>
                      )}
                    </label>
                    <Input
                      id={`metrik-${item.kunci}`}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={nilai[item.kunci] ?? ''}
                      onChange={ubah(item.kunci)}
                      placeholder="Kosongkan bila belum ada"
                    />
                    <p className="mt-1 text-xs text-slate-400">{item.keterangan}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label htmlFor="metrik-catatan" className="mb-1 block text-sm font-medium text-slate-700">
              Catatan
            </label>
            <Textarea
              id="metrik-catatan"
              value={catatan}
              onChange={(event) => setCatatan(event.target.value)}
              placeholder="Misalnya periode datanya, atau hal yang perlu diketahui pembaca."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" variant="teal" disabled={menyimpan}>
              <Save className="h-4 w-4" /> {menyimpan ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
