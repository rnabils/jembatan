const SPREADSHEET_PATTERN = /\.(xlsx|xlsm|xls)$/i

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Urutan pemeriksaan penting: "Arsip Inaktif" memuat kata "aktif" sebagai
// bagian dari "inaktif", jadi pola inaktif harus diuji lebih dulu.
const SHEET_PATTERNS = [
  { status: 'musnah', pattern: /musnah/ },
  { status: 'inaktif', pattern: /in\s*-?\s*aktif/ },
  { status: 'aktif', pattern: /aktif/ }
]

export function isSpreadsheetFile(file) {
  return SPREADSHEET_PATTERN.test(file?.name || '')
}

export function matchArchiveStatus(sheetName) {
  const normalized = String(sheetName || '').toLowerCase()
  const match = SHEET_PATTERNS.find((item) => item.pattern.test(normalized))
  return match ? match.status : null
}

// Bagian murni, tanpa File atau browser, supaya bisa diuji langsung.
// Sheet pertama untuk sebuah status yang dipakai; sheet berikutnya dengan
// status sama diabaikan agar tidak menghasilkan dokumen kembar.
export function findArchiveSheets(workbook) {
  const used = new Set()

  return workbook.SheetNames.reduce((result, sheetName) => {
    const status = matchArchiveStatus(sheetName)
    if (!status || used.has(status)) return result
    used.add(status)
    result.push({ status, sheetName })
    return result
  }, [])
}

export function splitWorkbookByStatus(XLSX, workbook) {
  return findArchiveSheets(workbook).map(({ status, sheetName }) => {
    const single = XLSX.utils.book_new()
    // Objek sheet dibawa apa adanya, sehingga sel gabungan (!merges) dan
    // lebar kolom (!cols) ikut terbawa ke berkas hasil pecahan.
    XLSX.utils.book_append_sheet(single, workbook.Sheets[sheetName], sheetName.slice(0, 31))

    return {
      status,
      sheetName,
      buffer: XLSX.write(single, { bookType: 'xlsx', type: 'array' })
    }
  })
}

async function readWorkbook(file) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  return { XLSX, workbook }
}

export async function detectArchiveSheets(file) {
  if (!isSpreadsheetFile(file)) return []

  try {
    const { workbook } = await readWorkbook(file)
    return findArchiveSheets(workbook)
  } catch {
    // Berkas rusak atau bukan spreadsheet sungguhan: perlakukan sebagai
    // unggahan biasa, jangan menggagalkan formnya.
    return []
  }
}

export async function splitArchiveFile(file) {
  const { XLSX, workbook } = await readWorkbook(file)
  const baseName = file.name.replace(/\.[^.]+$/, '')

  return splitWorkbookByStatus(XLSX, workbook).map(({ status, sheetName, buffer }) => ({
    status,
    sheetName,
    file: new File([buffer], `${baseName} - ${sheetName}.xlsx`, { type: XLSX_MIME })
  }))
}
