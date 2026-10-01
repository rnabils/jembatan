import { Info } from 'lucide-react'
import { getServiceContent } from '../data/serviceContent'

// Pengantar singkat di tiap layanan: namanya dan satu kalimat keterangan.
//
// Sebelumnya bagian ini juga memuat daftar "Yang dicatat di sini" dari
// content.expects. Daftar itu dihilangkan karena isinya disusun dari rujukan
// umum tugas subbagian, bukan dari ketentuan resmi perwakilan ini, sehingga
// belum tentu benar - dan daftar yang salah di halaman layanan lebih
// menyesatkan daripada tidak ada daftar sama sekali. Datanya sendiri masih ada
// di serviceContent.js bila nanti sudah diverifikasi.
export function ServiceIntro({ categoryId, categoryName }) {
  const content = getServiceContent(categoryId)
  if (!content.summary) return null

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_1px_10px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eff5ff] text-[#1f63d3]">
          <Info className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#233b84]">{categoryName}</h2>
          <p className="mt-1 text-sm text-[#61739b]">{content.summary}</p>
        </div>
      </div>
    </div>
  )
}
