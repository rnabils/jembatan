import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Download, ExternalLink, FileWarning, LoaderCircle, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { SectionHeader } from '../components/layout/SectionHeader'
import { Button } from '../components/ui/button'
import {
  formatGuideUpdatedAt,
  isGuideFileAllowed,
  loadGuide,
  removeGuide,
  saveGuide
} from '../lib/guideStorage'

// Tinggi halaman dikunci ke tinggi layar dikurangi padding <main>, supaya PDF
// mengisi ruang yang tersedia dan tidak menyisakan gulir ganda: satu di dalam
// PDF, satu lagi di halaman. Angkanya mengikuti p-4 / sm:p-6 / lg:p-8 pada
// DashboardLayout - rute ini tidak memakai Topbar, jadi tidak ada 4rem lain
// yang perlu dikurangi.
const TINGGI_HALAMAN = 'h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]'

export default function SystemGuide() {
  const { isAdmin } = useAuth()
  const [guide, setGuide] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const inputRef = useRef(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    setGalat('')
    try {
      setGuide(await loadGuide())
    } catch (error) {
      setGuide(null)
      setGalat(error.message)
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => { muat() }, [muat])

  const pilihBerkas = async (event) => {
    const file = event.target.files?.[0]
    // Input dikosongkan lebih dulu supaya memilih berkas yang sama dua kali
    // tetap memicu perubahan.
    event.target.value = ''
    if (!file) return

    if (!isGuideFileAllowed(file)) {
      setGalat('Panduan harus berupa berkas PDF.')
      return
    }

    setMenyimpan(true)
    setGalat('')
    try {
      setGuide(await saveGuide(file))
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMenyimpan(false)
    }
  }

  const hapus = async () => {
    if (!window.confirm('Hapus panduan sistem yang sedang tampil?')) return
    setMenyimpan(true)
    setGalat('')
    try {
      await removeGuide()
      setGuide(null)
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMenyimpan(false)
    }
  }

  const diperbarui = formatGuideUpdatedAt(guide?.updatedAt)

  return (
    <div className={`flex flex-col gap-4 text-slate-800 ${TINGGI_HALAMAN}`}>
      <SectionHeader
        eyebrow="PANDUAN SISTEM"
        title="Panduan Sistem"
        subtitle={
          diperbarui
            ? `Petunjuk penggunaan portal JEMBATAN - diperbarui ${diperbarui}`
            : 'Petunjuk penggunaan portal JEMBATAN'
        }
      >
        {guide ? (
          <>
            <a
              href={guide.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" /> Buka di tab baru
            </a>
            <a
              href={guide.url}
              download={guide.name || 'panduan-sistem.pdf'}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-600"
            >
              <Download className="h-4 w-4" /> Download
            </a>
          </>
        ) : null}

        {isAdmin && (
          <>
            <Button
              variant="outline"
              className="rounded-full px-4"
              disabled={menyimpan}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {menyimpan ? 'Menyimpan...' : guide ? 'Ganti Panduan' : 'Unggah Panduan'}
            </Button>
            {guide && (
              <Button
                variant="outline"
                className="rounded-full px-4 text-red-600 hover:text-red-700"
                disabled={menyimpan}
                onClick={hapus}
              >
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            )}
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={pilihBerkas} />
          </>
        )}
      </SectionHeader>

      {galat ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{galat}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        {memuat ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#1f63d3]" /> Menyiapkan panduan...
          </div>
        ) : guide ? (
          <iframe title="Panduan Sistem" src={guide.url} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            {galat ? <FileWarning className="h-10 w-10 text-red-300" /> : <BookOpen className="h-10 w-10 text-slate-300" />}
            <h2 className="mt-3 text-lg font-bold text-[#233b84]">Panduan belum tersedia</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {isAdmin
                ? 'Unggah berkas PDF panduan lewat tombol di atas. Berkasnya langsung tampil di halaman ini untuk semua pengguna.'
                : 'Administrator belum mengunggah panduan penggunaan portal. Hubungi administrator bila Anda membutuhkannya.'}
            </p>
          </div>
        )}
      </div>

      {guide && !guide.shared && (
        <p className="shrink-0 text-xs text-slate-500">
          Panduan ini tersimpan di browser ini saja. Sambungkan Supabase agar terlihat oleh semua pengguna.
        </p>
      )}
    </div>
  )
}
