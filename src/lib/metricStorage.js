import { isSupabaseConfigured, supabase } from './supabaseClient'

// Angka bidang yang diisi lewat form, bukan dibaca dari dokumen yang diunggah.
//
// Dokumen tetap jadi sumber utama untuk data massal - ABK, komposisi, daftar
// pegawai - karena sekali unggah mengisi puluhan angka. Yang disimpan di sini
// adalah angka yang sering berubah atau memang tidak ada di berkasnya, seperti
// cuti aktif. Mengubah satu angka begitu tidak sepadan dengan menyunting Excel
// lalu mengunggahnya ulang.
//
// Nilai di sini menang atas angka dari dokumen untuk indikator yang sama,
// karena diisi lebih sengaja dan biasanya lebih baru. Tampilan menyebut
// sumbernya supaya tidak ada angka yang tidak jelas asalnya.
const METRIC_KEY = 'bpk-dashboard-metrics'

// Indikator yang dikenal form. Urutannya ikut urutan tampil.
export const HR_METRICS = [
  { kunci: 'totalPegawai', label: 'Total Pegawai', keterangan: 'Jumlah riil pegawai', kelompok: 'Formasi' },
  { kunci: 'kebutuhanAbk', label: 'Kebutuhan ABK', keterangan: 'Standar kebutuhan SDM aparatur', kelompok: 'Formasi' },
  { kunci: 'cutiAktif', label: 'Cuti Aktif', keterangan: 'Sedang menjalani cuti', kelompok: 'Kegiatan' },
  { kunci: 'diklatBerjalan', label: 'Diklat Berjalan', keterangan: 'Sedang mengikuti diklat', kelompok: 'Kegiatan' },
  { kunci: 'pns', label: 'PNS', keterangan: 'Jumlah pegawai negeri sipil', kelompok: 'Komposisi' },
  { kunci: 'ttt', label: 'TTT', keterangan: 'Tenaga tidak tetap', kelompok: 'Komposisi' },
  { kunci: 'ob', label: 'OB', keterangan: 'Office boy dan sejenisnya', kelompok: 'Komposisi' },
  { kunci: 'laki', label: 'Laki-laki', keterangan: 'Jumlah pegawai laki-laki', kelompok: 'Komposisi' },
  { kunci: 'perempuan', label: 'Perempuan', keterangan: 'Jumlah pegawai perempuan', kelompok: 'Komposisi' }
]

export const KELOMPOK_METRIK = ['Formasi', 'Kegiatan', 'Komposisi']

function bacaLokal() {
  try {
    const simpan = JSON.parse(localStorage.getItem(METRIC_KEY) || '{}')
    return simpan && typeof simpan === 'object' ? simpan : {}
  } catch {
    return {}
  }
}

function tulisLokal(semua) {
  try {
    localStorage.setItem(METRIC_KEY, JSON.stringify(semua))
  } catch {
    // Kalau penyimpanan browser penuh, angka tetap tampil pada sesi berjalan.
  }
}

// Mengembalikan { nilai: {kunci: angka}, catatan, diperbaruiOleh, diperbaruiPada }
// atau null bila bidang itu belum pernah mengisi apa pun.
export async function loadMetrics(divisionId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('division_metrics')
      .select('*')
      .eq('division_id', divisionId)
      .maybeSingle()

    if (!error && data) {
      return {
        nilai: data.values || {},
        catatan: data.note || '',
        diperbaruiOleh: data.updated_by_name || '',
        diperbaruiPada: data.updated_at || null
      }
    }
    if (!error) return null
    // Tabelnya opsional: kalau belum dibuat, jatuh ke penyimpanan browser.
  }

  const lokal = bacaLokal()[divisionId]
  return lokal || null
}

export async function saveMetrics(divisionId, { nilai, catatan, namaPengguna, userId }) {
  const bersih = Object.fromEntries(
    Object.entries(nilai || {}).filter(([, angka]) => angka !== null && angka !== undefined && angka !== '')
  )

  const record = {
    nilai: bersih,
    catatan: catatan || '',
    diperbaruiOleh: namaPengguna || '',
    diperbaruiPada: new Date().toISOString()
  }

  // Selalu disimpan di browser juga, supaya tetap terbaca bila Supabase belum
  // disiapkan atau sedang tidak terjangkau.
  const semua = bacaLokal()
  semua[divisionId] = record
  tulisLokal(semua)

  if (isSupabaseConfigured && supabase && userId) {
    const { error } = await supabase.from('division_metrics').upsert(
      {
        division_id: divisionId,
        values: bersih,
        note: record.catatan,
        updated_by: userId,
        updated_by_name: record.diperbaruiOleh,
        updated_at: record.diperbaruiPada
      },
      { onConflict: 'division_id' }
    )
    if (error) return { record, shared: false, message: error.message }
    return { record, shared: true }
  }

  return { record, shared: false }
}

export function formatWaktuMetrik(nilai) {
  if (!nilai) return null
  const tanggal = new Date(nilai)
  if (Number.isNaN(tanggal.getTime())) return null
  return tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
