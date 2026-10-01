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

  const standar = numberValue(firstValue(values, ['standar', 'standar abk', 'abk']))
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
  return { ...result, sheetTitle }
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
