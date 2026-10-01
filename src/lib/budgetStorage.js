const BUDGET_FILE_URL = '/data/anggaran.xlsx'
const BUDGET_KEY = 'bpk-dashboard-budget'

function parseAmount(value) {
  const digits = String(value ?? '').replace(/[^0-9-]/g, '')
  return Number(digits) || 0
}

async function toArrayBuffer(source) {
  if (source instanceof ArrayBuffer) return source
  if (typeof source === 'string') {
    const response = await fetch(source)
    if (!response.ok) throw new Error(`Gagal memuat ${source}`)
    return response.arrayBuffer()
  }
  return source.arrayBuffer()
}

// Menerima File, ArrayBuffer, atau URL - sehingga berkas anggaran yang diunggah
// pengguna dibaca dengan aturan yang sama persis seperti berkas bawaan.
export async function parseBudgetWorkbook(source) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await toArrayBuffer(source), { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('Berkas Excel tidak memiliki sheet yang dapat dibaca.')

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  if (!rows.length) throw new Error('Berkas anggaran kosong.')

  const headers = rows[0].map((header) => String(header).trim())
  const totalIndex = headers.findIndex((header) => header.toLowerCase() === 'total')
  const percentageIndex = headers.findIndex((header) => header.toLowerCase() === 'persentase')

  if (totalIndex === -1) {
    throw new Error('Kolom "Total" tidak ditemukan. Pastikan berkasnya berformat daftar anggaran.')
  }

  const dataRows = new Map(rows.slice(1).map((row) => [String(row[0]).trim().toLowerCase(), row]))
  const paguRow = dataRows.get('pagu') || []
  const realisasiRow = dataRows.get('realisasi') || []
  const sisaRow = dataRows.get('sisa') || []

  const totalPagu = parseAmount(paguRow[totalIndex])
  const totalRealisasi = parseAmount(realisasiRow[totalIndex])
  const totalSisa = parseAmount(sisaRow[totalIndex]) || Math.max(totalPagu - totalRealisasi, 0)

  // Tanpa pemeriksaan ini, berkas yang salah format akan diterima dan seluruh
  // angka anggaran berubah menjadi nol tanpa peringatan apa pun.
  if (!totalPagu) {
    throw new Error('Baris "Pagu" tidak ditemukan atau nilainya kosong. Periksa kembali berkasnya.')
  }

  return {
    fiscalYear: new Date().getFullYear(),
    totalPagu,
    totalRealisasi,
    totalSisa,
    realisasiPercent: parseAmount(realisasiRow[percentageIndex]) || (totalPagu ? (totalRealisasi / totalPagu) * 100 : 0),
    sisaPercent: parseAmount(sisaRow[percentageIndex]) || (totalPagu ? (totalSisa / totalPagu) * 100 : 0),
    updatedAt: new Date().toISOString().slice(0, 10),
    breakdown: headers
      .map((code, index) => ({
        code,
        pagu: parseAmount(paguRow[index]),
        realisasi: parseAmount(realisasiRow[index]),
        sisa: parseAmount(sisaRow[index])
      }))
      .filter((item) => /^\d+$/.test(item.code))
  }
}

export async function loadBudgetData() {
  return parseBudgetWorkbook(BUDGET_FILE_URL)
}

export function loadStoredBudget() {
  try {
    const saved = localStorage.getItem(BUDGET_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed?.totalPagu ? parsed : null
  } catch {
    return null
  }
}

export function saveStoredBudget(budget) {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget))
  } catch {
    // Kuota penuh atau diblokir: angka tetap hidup di memori sesi ini.
  }
}

export function mapRemoteBudget(snapshot) {
  return {
    fiscalYear: snapshot.fiscal_year,
    totalPagu: Number(snapshot.total_pagu),
    totalRealisasi: Number(snapshot.total_realisasi),
    totalSisa: Number(snapshot.total_sisa),
    realisasiPercent: Number(snapshot.realisasi_percent),
    sisaPercent: Number(snapshot.sisa_percent),
    updatedAt: snapshot.updated_at || snapshot.created_at || null,
    breakdown: Array.isArray(snapshot.breakdown) ? snapshot.breakdown : []
  }
}

export function toRemoteBudget(budget) {
  return {
    fiscal_year: budget.fiscalYear,
    total_pagu: budget.totalPagu,
    total_realisasi: budget.totalRealisasi,
    total_sisa: budget.totalSisa,
    realisasi_percent: budget.realisasiPercent,
    sisa_percent: budget.sisaPercent,
    breakdown: budget.breakdown || []
  }
}
