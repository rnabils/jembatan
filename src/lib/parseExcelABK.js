const BREAKDOWN_GROUPS = [
  'SDM & Keuangan',
  'Humas Hukum & TU Kalan',
  'Umum & TI'
]

function clean(value) {
  return String(value ?? '').trim()
}

function normalizeHeader(value) {
  return clean(value).toLowerCase().replace(/[()]/g, '').replace(/[/_-]+/g, ' ').replace(/\s+/g, ' ')
}

function numberValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const rawText = clean(value)
  if (!rawText || rawText === '-') return null
  const isParenthesized = rawText.startsWith('(') && rawText.endsWith(')')
  const text = rawText.replace(/[()]/g, '').replace(/\./g, '').replace(',', '.')
  if (!text) return null
  const parsed = Number(text.replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(parsed)) return null
  return isParenthesized ? -Math.abs(parsed) : parsed
}

function firstValue(values, keys) {
  return keys.map((key) => values[key]).find((value) => clean(value) !== '')
}

function isTotalRow(row) {
  return /jumlah\s*a/i.test(row.unitKerja)
}

function findBreakdownGroup(value) {
  const text = clean(value).toLowerCase()
  return BREAKDOWN_GROUPS.find((group) => text.includes(group.toLowerCase())) || null
}

function isHeaderRow(row) {
  const labels = row.map(normalizeHeader)
  const hasNumberColumn = labels.some((label) => label === 'no' || label === 'no.')
  const textColumns = labels.filter((label) => label && !/^\d+$/.test(label))
  return hasNumberColumn && textColumns.length >= 2
}

function isSequenceRow(row) {
  const values = row.map(clean).filter(Boolean)
  if (values.length < 2 || !values.every((value) => /^\d+$/.test(value))) return false
  return values.every((value, index) => Number(value) === index + 1)
}

function mapRow(row, index) {
  const values = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  )

  // Judul kolomnya di berkas sebenarnya berbunyi "Standar Kebutuhan SDM
  // Aparatur (ABK)", sehingga pencocokan persis tidak pernah kena dan seluruh
  // nilai standar terbaca kosong. Dicocokkan lewat awalan kata.
  const kunciStandar = Object.keys(values).find((kunci) => kunci.startsWith('standar') || kunci === 'abk')
  const standar = numberValue(firstValue(values, ['standar', 'standar abk', 'abk'])) ??
    (kunciStandar ? numberValue(values[kunciStandar]) : null)
  const riil = numberValue(firstValue(values, ['riil', 'jumlah riil', 'jumlah riil pegawai', 'realisasi']))
  const parsedSelisih = numberValue(values.selisih)

  return {
    index,
    no: clean(values.no),
    unitKerja: clean(firstValue(values, ['unit kerja', 'unit kerja jabatan', 'unit', 'unit kerja/jabatan'])),
    standar,
    riil,
    selisih: parsedSelisih ?? (standar !== null && riil !== null ? riil - standar : null)
  }
}

export function parseABKRows(rows) {
  const parsedRows = rows.map(mapRow).filter((row) => row.unitKerja || row.no)
  const total = parsedRows.find(isTotalRow) || parsedRows.at(-1) || { standar: 0, riil: 0, selisih: 0 }
  const dataRows = parsedRows.filter((row) => row !== total)
  const categories = dataRows.filter((row) => Boolean(row.no))
  const items = dataRows.filter((row) => !row.no)

  const breakdown = Object.fromEntries(BREAKDOWN_GROUPS.map((group) => [group, []]))
  let currentGroup = null
  items.forEach((row) => {
    const nextGroup = findBreakdownGroup(row.unitKerja)
    if (nextGroup) {
      currentGroup = nextGroup
      if (row.standar === null && row.riil === null && row.selisih === null) return
    }
    if (currentGroup && !nextGroup) breakdown[currentGroup].push(row)
  })

  return { rows: parsedRows, total, categories, items, breakdown }
}

// Berkas bezetting memuat sheet "Rekap Jenis Klmn" berisi dua tabel
// bersebelahan pada baris yang sama: jumlah pegawai per jenis kelamin, dan
// per jenjang pendidikan.
//
// Angkanya dibaca dari baris TOTAL yang sudah tersedia di sheet itu, bukan
// dijumlahkan sendiri dari rinciannya. Sheet ini memuat baris kelompok
// (STRUKTURAL, PEMERIKSA), baris rincian, dan baris TOTAL sekaligus pada satu
// kolom yang sama - menjumlahkan semuanya menghitung ganda. Pada berkas Juni
// 2026 hasil penjumlahan naif 98 orang, padahal pegawainya 49.
//
// Tabel jenjang pendidikan di sebelahnya sengaja tidak dibaca: pada berkas yang
// ada, baris TOTAL PNS berisi rincian berjumlah 4 tetapi kolom jumlahnya
// tertulis 16, dan TOTAL OB seluruhnya nol tetapi jumlahnya 12. Menampilkan
// angka yang tidak berjumlah benar lebih menyesatkan daripada tidak
// menampilkannya.
const GOLONGAN_PEGAWAI = [
  { nama: 'PNS', pola: /total\s*pns/i },
  { nama: 'TTT', pola: /total\s*ttt/i },
  { nama: 'OB', pola: /total\s*ob/i }
]

function parseRekapPegawai(matrix) {
  if (!Array.isArray(matrix) || !matrix.length) return null

  const headerIndex = matrix.findIndex((row) => {
    const labels = row.map(normalizeHeader)
    return labels.includes('laki laki') && labels.includes('perempuan')
  })
  if (headerIndex < 0) return null

  const labels = matrix[headerIndex].map(normalizeHeader)
  const kolomLaki = labels.indexOf('laki laki')
  const kolomPerempuan = labels.indexOf('perempuan')
  const kolomJumlah = labels.indexOf('jumlah')

  const isi = matrix.slice(headerIndex + 1)
  // Label baris bisa jatuh di kolom mana pun di antara tiga kolom pertama,
  // tergantung tingkatannya.
  const labelBaris = (row) => [row[0], row[1], row[2]].map(clean).filter(Boolean).join(' ')

  const golongan = GOLONGAN_PEGAWAI.map(({ nama, pola }) => {
    const row = isi.find((item) => pola.test(labelBaris(item)))
    if (!row) return null
    const laki = numberValue(row[kolomLaki]) || 0
    const perempuan = numberValue(row[kolomPerempuan]) || 0
    return { nama, laki, perempuan, jumlah: numberValue(row[kolomJumlah]) ?? laki + perempuan }
  }).filter(Boolean)

  if (!golongan.length) return null

  const laki = golongan.reduce((jumlah, item) => jumlah + item.laki, 0)
  const perempuan = golongan.reduce((jumlah, item) => jumlah + item.perempuan, 0)

  // Baris "TOTAL PEGAWAI" dipakai bila ada, supaya angkanya persis seperti yang
  // tertulis di berkas.
  const barisTotal = isi.find((item) => /^total\s*pegawai$/i.test(labelBaris(item)))
  const totalTertulis = barisTotal ? numberValue(barisTotal[kolomJumlah]) : null

  return {
    golongan,
    laki,
    perempuan,
    total: totalTertulis ?? golongan.reduce((jumlah, item) => jumlah + item.jumlah, 0)
  }
}

// Sheet "JUMLAH SDM" berisi angka yang diisi manual, berupa pasangan label dan
// nilai: "Penempatan Pwk. Papbar | 45 | orang", "CPNS Diklat | 5 | orang", dan
// seterusnya. Isinya dibaca apa adanya menjadi daftar, lalu komponen yang
// memakainya mencari label yang dibutuhkan.
//
// Dibuat begini supaya menambah angka baru di dashboard cukup dengan menambah
// satu baris di berkasnya, tanpa menyentuh kode. Baris tanpa angka - judul
// kelompok seperti "Jumlah SDM PNS" - dilewati.
// numberValue() tidak bisa dipakai untuk membedakan label dari angka di sini:
// untuk teks tanpa digit ia mengembalikan 0, bukan null, karena Number('')
// bernilai 0. Jadi pemeriksaannya dibuat sendiri - sel dianggap angka hanya
// bila memang memuat digit, dan dianggap label bila memuat huruf.
function selAngka(sel) {
  if (typeof sel === 'number') return Number.isFinite(sel) ? sel : null
  const teks = clean(sel)
  if (!teks || !/\d/.test(teks)) return null
  return numberValue(teks)
}

function parseDaftarAngka(matrix) {
  if (!Array.isArray(matrix)) return []

  const hasil = []
  for (const row of matrix) {
    if (!Array.isArray(row)) continue

    const indexLabel = row.findIndex((sel) => /[a-z]/i.test(clean(sel)))
    if (indexLabel < 0) continue

    const nilai = row.slice(indexLabel + 1).map(selAngka).find((angka) => angka !== null && angka !== undefined)
    if (nilai === null || nilai === undefined) continue

    hasil.push({ label: clean(row[indexLabel]), nilai })
  }
  return hasil
}

export async function parseExcelABK(source) {
  const XLSX = await import('xlsx')
  if (!source) throw new Error('File Excel ABK belum dipilih.')

  const input = source instanceof ArrayBuffer
    ? source
    : typeof source === 'string'
      ? await fetch(source).then((response) => response.arrayBuffer())
      : await source.arrayBuffer()
  const workbook = XLSX.read(input, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets.ABK
  if (!sheet) throw new Error('Sheet "ABK" tidak ditemukan.')

  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true })
  const headerIndex = matrix.findIndex((row) => {
    const labels = row.map(normalizeHeader)
    return labels.includes('no') && labels.some((label) => label.includes('unit kerja')) && labels.some((label) => label.includes('standar')) && labels.some((label) => label.includes('riil'))
  })
  if (headerIndex < 0) throw new Error('Header ABK tidak ditemukan. Pastikan kolom NO, Unit Kerja, Standar, dan Jumlah Riil tersedia.')

  const sheetTitle = matrix
    .slice(0, headerIndex)
    .map((row) => row.map(clean).filter(Boolean).join(' '))
    .find(Boolean) || 'Analisis Data ABK'

  const headers = matrix[headerIndex].map((header, index) => normalizeHeader(header) || `kolom ${index}`)
  const rows = matrix.slice(headerIndex + 1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
  const result = parseABKRows(rows)
  if (!result.rows.length) throw new Error('Data pada sheet "ABK" tidak ditemukan setelah header.')

  // Sheet rekapnya tidak wajib ada: berkas yang hanya memuat ABK tetap terbaca,
  // rekapnya saja yang bernilai null.
  const sheetRekap = workbook.Sheets['Rekap Jenis Klmn']
  const rekap = sheetRekap
    ? parseRekapPegawai(XLSX.utils.sheet_to_json(sheetRekap, { header: 1, defval: '', raw: true }))
    : null

  const sheetJumlah = workbook.Sheets['JUMLAH SDM']
  const daftarAngka = sheetJumlah
    ? parseDaftarAngka(XLSX.utils.sheet_to_json(sheetJumlah, { header: 1, defval: '', raw: true }))
    : []

  return { ...result, sheetTitle, rekap, daftarAngka }
}

export async function parseExcelWorkbook(source) {
  const XLSX = await import('xlsx')
  if (!source) throw new Error('File Excel belum dipilih.')

  const input = source instanceof ArrayBuffer
    ? source
    : typeof source === 'string'
      ? await fetch(source).then((response) => response.arrayBuffer())
      : await source.arrayBuffer()
  const workbook = XLSX.read(input, { type: 'array', cellDates: true })
  const sheets = workbook.SheetNames.map((name) => {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: false })
    const rows = matrix
      .map((row) => row.map((cell) => clean(cell)))
      .filter((row) => row.some(Boolean))
    const headerIndex = rows.findIndex(isHeaderRow)
    const header = headerIndex >= 0 ? rows[headerIndex] : rows[0] || []
    const bodyStart = headerIndex >= 0 ? headerIndex + 1 : 1
    const body = rows.slice(bodyStart).filter((row, index) => index !== 0 || !isSequenceRow(row))
    const title = rows.slice(0, Math.max(headerIndex, 0)).find((row) => row.length === 1 && row[0])?.[0] || ''
    return { name, title, header, rows: body }
  })

  if (!sheets.some((sheet) => sheet.rows.length)) throw new Error('Workbook Excel tidak memiliki data.')
  return { sheets }
}

export { BREAKDOWN_GROUPS }
