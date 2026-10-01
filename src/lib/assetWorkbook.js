// Pembacaan daftar Barang Milik Negara dari berkas Excel.
//
// Kolom dicocokkan lewat nama header, bukan nomor kolom, supaya perubahan urutan
// kolom pada berkas berikutnya tidak diam-diam menggeser seluruh data.
//
// Bentuk recordnya sengaja datar dan memakai nama yang langsung memetakan ke
// kolom tabel Supabase (lihat supabase/aset.sql), jadi memindahkannya ke basis
// data nanti tidak perlu mengubah komponen mana pun.

const ASSET_KEY = 'bpk-dashboard-assets'

// Sinonim header: berkas dari aplikasi SIMAK berbeda-beda penulisannya.
const FIELD_ALIASES = {
  jenisBmn: ['jenis bmn', 'jenis', 'kelompok bmn'],
  kodeSatker: ['kode satker'],
  namaSatker: ['nama satker', 'satker'],
  kodeBarang: ['kode barang', 'kode'],
  nup: ['nup'],
  namaBarang: ['nama barang', 'uraian barang', 'nama'],
  statusBmn: ['status bmn', 'status'],
  merk: ['merk', 'merek'],
  tipe: ['tipe', 'type'],
  kondisi: ['kondisi'],
  umurAset: ['umur aset', 'umur'],
  intraExtra: ['intra / extra', 'intra/extra', 'intra extra'],
  tanggalPerolehan: ['tanggal perolehan', 'tgl perolehan'],
  nilaiPerolehan: ['nilai perolehan'],
  nilaiPenyusutan: ['nilai penyusutan', 'penyusutan', 'akumulasi penyusutan'],
  nilaiBuku: ['nilai buku'],
  statusPenggunaan: ['status penggunaan', 'penggunaan'],
  noPsp: ['no psp', 'nomor psp'],
  tanggalPsp: ['tanggal psp', 'tgl psp']
}

// Kondisi yang menurut SIMAK bukan "Baik" perlu ditindaklanjuti.
const KONDISI_PERLU_PERHATIAN = ['rusak ringan', 'rusak berat', 'rusak']

function normalizeHeader(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function teks(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return formatTanggal(value)
  return String(value).trim()
}

// Angka pada berkas SIMAK kerap tersimpan sebagai teks berformat "Rp1.234,00".
export function angka(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const bersih = String(value ?? '').replace(/[^0-9,.-]/g, '')
  if (!bersih) return 0
  // Titik sebagai pemisah ribuan, koma sebagai desimal.
  const normal = bersih.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
  const hasil = Number(normal)
  return Number.isFinite(hasil) ? hasil : 0
}

export function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value || 0))}`
}

export function formatRupiahRingkas(value) {
  const n = Math.abs(value || 0)
  if (n >= 1e12) return `Rp ${(value / 1e12).toFixed(1)} T`
  if (n >= 1e9) return `Rp ${(value / 1e9).toFixed(1)} M`
  if (n >= 1e6) return `Rp ${(value / 1e6).toFixed(1)} Jt`
  return formatRupiah(value)
}

function formatTanggal(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

// Tanggal pada berkas bercampur: ada Date asli, ada teks "9/29/23" atau "Nov-16".
function bacaTanggal(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatTanggal(value)

  const t = String(value ?? '').trim()
  if (!t) return ''

  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slash) {
    const [, bulan, hari, tahunRaw] = slash
    const tahun = Number(tahunRaw) < 100 ? 2000 + Number(tahunRaw) : Number(tahunRaw)
    const d = new Date(tahun, Number(bulan) - 1, Number(hari))
    return Number.isNaN(d.getTime()) ? '' : formatTanggal(d)
  }

  const parsed = new Date(t)
  return Number.isNaN(parsed.getTime()) ? '' : formatTanggal(parsed)
}

export function tahunDari(tanggal) {
  const tahun = Number(String(tanggal || '').slice(0, 4))
  return Number.isFinite(tahun) && tahun > 1900 ? tahun : null
}

export function formatTanggalIndo(tanggal) {
  if (!tanggal) return '-'
  const d = new Date(tanggal)
  if (Number.isNaN(d.getTime())) return String(tanggal)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function cariBarisHeader(rows) {
  const wajib = ['nama barang', 'kode barang']
  for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
    const header = rows[i].map(normalizeHeader)
    if (wajib.every((k) => header.some((h) => h.includes(k)))) return i
  }
  return -1
}

// Kolom dipetakan dua tahap, dan ini bukan kerumitan yang bisa dilewati:
// alias pendek seperti "kode" dan "nama" akan mencaplok "Kode Satker" dan
// "Nama Satker" bila pencocokan awalan dijalankan lebih dulu. Karena itu
// seluruh kecocokan persis diselesaikan dulu, baru sisanya dicocokkan sebagai
// awalan - dan kolom yang sudah terpakai tidak boleh diklaim dua kali.
function petakanKolom(headerRow) {
  const header = headerRow.map(normalizeHeader)
  const peta = {}
  const terpakai = new Set()

  const klaim = (field, index) => {
    if (index === -1 || terpakai.has(index)) return false
    peta[field] = index
    terpakai.add(index)
    return true
  }

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (klaim(field, header.findIndex((h, i) => h === alias && !terpakai.has(i)))) break
    }
  }

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (peta[field] !== undefined) continue
    for (const alias of aliases) {
      if (klaim(field, header.findIndex((h, i) => h && h.startsWith(alias) && !terpakai.has(i)))) break
    }
  }

  return peta
}

async function toArrayBuffer(source) {
  if (source instanceof ArrayBuffer) return source
  if (typeof source === 'string') {
    const response = await fetch(source)
    if (!response.ok) throw new Error('Berkas aset tidak dapat diambil.')
    return response.arrayBuffer()
  }
  return source.arrayBuffer()
}

export async function parseAssetWorkbook(source) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await toArrayBuffer(source), { type: 'array', cellDates: true })

  // Sheet dengan header BMN yang dipakai, bukan sekadar sheet pertama.
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    if (!sheet || !sheet['!ref']) continue

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true, blankrows: true })
    const headerIndex = cariBarisHeader(rows)
    if (headerIndex === -1) continue

    const peta = petakanKolom(rows[headerIndex])
    if (peta.namaBarang === undefined) continue

    const ambil = (row, field) => (peta[field] === undefined ? null : row[peta[field]])

    const assets = rows
      .slice(headerIndex + 1)
      .filter((row) => row && teks(ambil(row, 'namaBarang')))
      .map((row, index) => {
        const nilaiPerolehan = angka(ambil(row, 'nilaiPerolehan'))
        const nilaiPenyusutan = angka(ambil(row, 'nilaiPenyusutan'))
        const nilaiBukuKolom = ambil(row, 'nilaiBuku')
        const kodeBarang = teks(ambil(row, 'kodeBarang'))
        const nup = teks(ambil(row, 'nup'))

        return {
          // Kode barang + NUP adalah identitas resmi BMN; dipakai sebagai kunci
          // agar unggahan ulang memperbarui aset yang sama, bukan menggandakannya.
          id: `${kodeBarang || 'x'}-${nup || index + 1}`,
          kodeBarang,
          nup,
          namaBarang: teks(ambil(row, 'namaBarang')),
          jenisBmn: teks(ambil(row, 'jenisBmn')) || 'LAINNYA',
          kodeSatker: teks(ambil(row, 'kodeSatker')),
          namaSatker: teks(ambil(row, 'namaSatker')),
          statusBmn: teks(ambil(row, 'statusBmn')),
          merk: teks(ambil(row, 'merk')),
          tipe: teks(ambil(row, 'tipe')),
          kondisi: teks(ambil(row, 'kondisi')),
          umurAset: angka(ambil(row, 'umurAset')),
          intraExtra: teks(ambil(row, 'intraExtra')),
          tanggalPerolehan: bacaTanggal(ambil(row, 'tanggalPerolehan')),
          nilaiPerolehan,
          nilaiPenyusutan,
          // Nilai buku dihitung bila kolomnya tidak ada, tetapi angka dari berkas
          // selalu menang - itu yang dipakai pada laporan resmi.
          nilaiBuku: nilaiBukuKolom === null ? Math.max(nilaiPerolehan - nilaiPenyusutan, 0) : angka(nilaiBukuKolom),
          statusPenggunaan: teks(ambil(row, 'statusPenggunaan')),
          noPsp: teks(ambil(row, 'noPsp')),
          tanggalPsp: bacaTanggal(ambil(row, 'tanggalPsp'))
        }
      })

    if (!assets.length) continue
    return { sheetName: name, assets }
  }

  throw new Error('Tidak ditemukan tabel BMN pada berkas ini. Pastikan ada kolom Kode Barang dan Nama Barang.')
}

export function punyaPsp(asset) {
  return Boolean(asset.noPsp)
}

export function kondisiPerluPerhatian(asset) {
  return KONDISI_PERLU_PERHATIAN.includes(String(asset.kondisi || '').toLowerCase())
}

export function dataTidakLengkap(asset) {
  const wajib = ['kodeBarang', 'nup', 'jenisBmn', 'tanggalPerolehan', 'statusPenggunaan']
  return wajib.filter((field) => !String(asset[field] ?? '').trim())
}

export function ringkasAset(assets) {
  const total = assets.length
  const nilaiPerolehan = assets.reduce((t, a) => t + a.nilaiPerolehan, 0)
  const penyusutan = assets.reduce((t, a) => t + a.nilaiPenyusutan, 0)
  const nilaiBuku = assets.reduce((t, a) => t + a.nilaiBuku, 0)

  return {
    total,
    nilaiPerolehan,
    penyusutan,
    nilaiBuku,
    aktif: assets.filter((a) => String(a.statusBmn || '').toLowerCase() === 'aktif').length,
    belumPsp: assets.filter((a) => !punyaPsp(a)).length
  }
}

export const UMUR_BUCKETS = [
  { id: '0-5', label: '0 - 5 tahun', uji: (u) => u <= 5 },
  { id: '6-10', label: '6 - 10 tahun', uji: (u) => u > 5 && u <= 10 },
  { id: '11-15', label: '11 - 15 tahun', uji: (u) => u > 10 && u <= 15 },
  { id: '16+', label: 'Lebih dari 15 tahun', uji: (u) => u > 15 }
]

export function kelompokkan(assets, ambilKunci) {
  const peta = new Map()
  for (const asset of assets) {
    const kunci = ambilKunci(asset) || 'Tidak diisi'
    const entri = peta.get(kunci) || { kunci, jumlah: 0, nilaiPerolehan: 0, nilaiBuku: 0 }
    entri.jumlah += 1
    entri.nilaiPerolehan += asset.nilaiPerolehan
    entri.nilaiBuku += asset.nilaiBuku
    peta.set(kunci, entri)
  }
  return [...peta.values()].sort((a, b) => b.jumlah - a.jumlah)
}

// ------------------------------------------------------------ penyimpanan

export function loadStoredAssets() {
  try {
    const saved = localStorage.getItem(ASSET_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredAssets(assets) {
  try {
    localStorage.setItem(ASSET_KEY, JSON.stringify(assets))
  } catch {
    // Kuota penuh atau diblokir: data tetap hidup di memori sesi ini.
  }
}

export function mapRemoteAsset(row) {
  return {
    id: row.id,
    kodeBarang: row.kode_barang || '',
    nup: row.nup || '',
    namaBarang: row.nama_barang || '',
    jenisBmn: row.jenis_bmn || 'LAINNYA',
    kodeSatker: row.kode_satker || '',
    namaSatker: row.nama_satker || '',
    statusBmn: row.status_bmn || '',
    merk: row.merk || '',
    tipe: row.tipe || '',
    kondisi: row.kondisi || '',
    umurAset: Number(row.umur_aset) || 0,
    intraExtra: row.intra_extra || '',
    tanggalPerolehan: row.tanggal_perolehan || '',
    nilaiPerolehan: Number(row.nilai_perolehan) || 0,
    nilaiPenyusutan: Number(row.nilai_penyusutan) || 0,
    nilaiBuku: Number(row.nilai_buku) || 0,
    statusPenggunaan: row.status_penggunaan || '',
    noPsp: row.no_psp || '',
    tanggalPsp: row.tanggal_psp || ''
  }
}

export function toRemoteAsset(asset, divisionId = 'it') {
  return {
    id: asset.id,
    division_id: divisionId,
    kode_barang: asset.kodeBarang || null,
    nup: asset.nup || null,
    nama_barang: asset.namaBarang,
    jenis_bmn: asset.jenisBmn || null,
    kode_satker: asset.kodeSatker || null,
    nama_satker: asset.namaSatker || null,
    status_bmn: asset.statusBmn || null,
    merk: asset.merk || null,
    tipe: asset.tipe || null,
    kondisi: asset.kondisi || null,
    umur_aset: asset.umurAset || 0,
    intra_extra: asset.intraExtra || null,
    tanggal_perolehan: asset.tanggalPerolehan || null,
    nilai_perolehan: asset.nilaiPerolehan || 0,
    nilai_penyusutan: asset.nilaiPenyusutan || 0,
    nilai_buku: asset.nilaiBuku || 0,
    status_penggunaan: asset.statusPenggunaan || null,
    no_psp: asset.noPsp || null,
    tanggal_psp: asset.tanggalPsp || null
  }
}
