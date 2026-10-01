// Pembacaan Excel apa adanya, untuk ditampilkan sebagai tabel di aplikasi.
//
// Berbeda dari parseExcelABK yang menebak baris header dan membuang baris judul
// agar cocok dengan format ABK, berkas di sini bisa berbentuk apa saja - daftar
// arsip, misalnya, punya empat baris judul dan header bertingkat. Jadi isinya
// dibawa utuh, termasuk sel gabungan, supaya tampilannya mengikuti berkas asli.

function cellText(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toLocaleDateString('id-ID')
  return String(value).replace(/\r\n/g, '\n').trim()
}

async function toArrayBuffer(source) {
  if (source instanceof ArrayBuffer) return source
  if (typeof source === 'string') {
    const response = await fetch(source)
    if (!response.ok) throw new Error('Berkas tidak dapat diambil.')
    return response.arrayBuffer()
  }
  return source.arrayBuffer()
}

// Sel yang tertutup oleh penggabungan tidak boleh ikut dirender; hanya sel
// kiri-atas dari tiap rentang yang tampil, membawa rowSpan dan colSpan.
function buildSpanMap(merges = []) {
  const anchors = new Map()
  const covered = new Set()

  for (const merge of merges) {
    const { s: start, e: end } = merge
    anchors.set(`${start.r}:${start.c}`, {
      rowSpan: end.r - start.r + 1,
      colSpan: end.c - start.c + 1
    })

    for (let row = start.r; row <= end.r; row += 1) {
      for (let column = start.c; column <= end.c; column += 1) {
        if (row === start.r && column === start.c) continue
        covered.add(`${row}:${column}`)
      }
    }
  }

  return { anchors, covered }
}

export async function readWorkbookGrid(source) {
  if (!source) throw new Error('Berkas Excel belum tersedia.')

  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await toArrayBuffer(source), { type: 'array', cellDates: true, cellStyles: true })

  const sheets = workbook.SheetNames.map((name, sheetIndex) => {
    const sheet = workbook.Sheets[name]
    if (!sheet || !sheet['!ref']) return null

    // Sheet yang disembunyikan penyusunnya di Excel ikut disembunyikan di sini;
    // menampilkannya hanya menambah tab yang membingungkan.
    if (workbook.Workbook?.Sheets?.[sheetIndex]?.Hidden) return null

    // !merges memakai koordinat mutlak sheet. Pembacaan harus dimulai dari A1
    // dan mempertahankan baris kosong, kalau tidak nomor baris dan kolomnya
    // bergeser terhadap peta penggabungan - dan seluruh header bertingkat
    // jatuh di sel yang salah.
    const range = XLSX.utils.decode_range(sheet['!ref'])
    range.s.r = 0
    range.s.c = 0

    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: true,
      range
    })

    const columnCount = range.e.c + 1
    const rows = matrix.map((row) => {
      const lengkap = new Array(columnCount).fill('')
      for (let index = 0; index < columnCount; index += 1) lengkap[index] = cellText(row[index])
      return lengkap
    })

    // Baris kosong di tengah dipertahankan agar sejajar dengan penggabungan;
    // yang di ujung bawah dibuang supaya tabelnya tidak berekor panjang.
    let akhir = rows.length
    while (akhir > 0 && rows[akhir - 1].every((cell) => cell === '')) akhir -= 1

    // Lebar kolom dari berkas dipakai apa adanya. Tanpa ini browser membagi
    // lebar sendiri, sehingga kolom sempit memaksa teks membungkus dan
    // tabelnya terlihat jauh berbeda dari tampilan di Excel.
    const sheetCols = sheet['!cols'] || []
    const columns = Array.from({ length: columnCount }, (_, index) => {
      const meta = sheetCols[index]
      return {
        widthPx: meta?.hidden ? 0 : Math.round(meta?.wpx || 0) || null,
        hidden: Boolean(meta?.hidden)
      }
    })

    const { anchors, covered } = buildSpanMap(sheet['!merges'])
    const isiTerpakai = rows.slice(0, akhir).reduce(
      (total, row) => total + row.filter((cell) => cell !== '').length,
      0
    )

    return {
      name,
      isiTerpakai,
      columns,
      rows: rows.slice(0, akhir),
      columnCount,
      spanAt: (row, column) => anchors.get(`${row}:${column}`) || null,
      isCovered: (row, column) => covered.has(`${row}:${column}`)
    }
  }).filter((sheet) => sheet && sheet.rows.length > 0)
  if (!sheets.length) throw new Error('Berkas Excel ini tidak memiliki isi yang dapat ditampilkan.')

  // Sheet pertama belum tentu sheet utamanya. Berkas bezetting, misalnya,
  // dibuka pada sheet ringkasan yang hampir kosong sementara data pegawainya
  // ada di sheet lain. Yang dipilih adalah sheet dengan isi terbanyak.
  const defaultIndex = sheets.reduce(
    (terpilih, sheet, index) => (sheet.isiTerpakai > sheets[terpilih].isiTerpakai ? index : terpilih),
    0
  )

  return { sheets, defaultIndex }
}
