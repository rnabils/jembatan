import { INITIAL_DOCUMENTS } from '../data/seed'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const DOCUMENTS_KEY = 'bpk-dashboard-documents'

export const ACCEPTED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png'
]

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

export function getDocumentFileExtension(fileName = '') {
  const parts = fileName.split('.')
  if (parts.length < 2) return ''
  return parts.at(-1).toLowerCase()
}

export function isDocumentFileAllowed(file) {
  if (!file) return false
  const extension = getDocumentFileExtension(file.name)
  return ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.type) || ACCEPTED_DOCUMENT_EXTENSIONS.includes(extension)
}

export function getAcceptedDocumentFileHint() {
  return '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .jpg, .jpeg, .png'
}

// Kategori yang tidak lagi menampung dokumen, beserta tujuan pindahnya.
// Tanpa ini dokumen lama jadi tidak terlihat di UI mana pun.
const CATEGORY_MIGRATIONS = {
  'agenda-kalan': 'tata-usaha-kalan'
}

// crypto.randomUUID hanya tersedia di secure context. Mode lokal bisa saja
// dibuka lewat http di alamat LAN, jadi selalu disediakan cadangan.
export function newDocumentId() {
  if (globalThis.crypto?.randomUUID) return `doc-${globalThis.crypto.randomUUID()}`
  return `doc-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

// Dokumen tanpa id pernah tersimpan karena id yang dibuat saat unggah
// tertimpa properti id kosong dari modal. Dokumen seperti itu tidak bisa
// disunting maupun dihapus - keduanya mencocokkan lewat id - dan membuat
// React kehilangan key. Diperbaiki saat dimuat supaya data lama ikut pulih.
function repairMissingIds(documents) {
  let changed = false
  const repaired = documents.map((document) => {
    if (document.id) return document
    changed = true
    return { ...document, id: newDocumentId() }
  })
  return changed ? repaired : documents
}

function migrateDocumentCategories(documents) {
  let changed = false
  const migrated = documents.map((document) => {
    const target = CATEGORY_MIGRATIONS[document.categoryId]
    if (!target) return document
    changed = true
    return { ...document, categoryId: target }
  })
  return changed ? migrated : documents
}

export function loadStoredDocuments() {
  const saved = localStorage.getItem(DOCUMENTS_KEY)
  if (!saved) return INITIAL_DOCUMENTS

  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return INITIAL_DOCUMENTS
    return migrateDocumentCategories(repairMissingIds(parsed))
  } catch {
    return INITIAL_DOCUMENTS
  }
}

export function saveStoredDocuments(documents) {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents))
}

export async function buildUploadedDocument({ file, ...metadata }) {
  const fileDataUrl = file ? await readFileAsDataUrl(file) : metadata.fileDataUrl || null
  return {
    ...metadata,
    fileName: file?.name || metadata.fileName,
    fileType: file?.type || metadata.fileType || '',
    fileSize: file?.size || metadata.fileSize || 0,
    fileDataUrl
  }
}

export function hasDocumentFile(document) {
  return Boolean(document?.fileDataUrl || document?.filePath)
}

// Satu-satunya cara benar mendapatkan berkas sebuah dokumen.
// Mode lokal menyimpannya sebagai data URL; mode Supabase menyimpannya di
// Storage bucket privat, sehingga perlu signed URL berumur pendek.
export async function resolveDocumentFileUrl(document) {
  if (!document) return null
  if (document.fileDataUrl) return document.fileDataUrl
  if (!document.filePath || !isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.filePath, 3600)

  if (error) return null
  return data?.signedUrl || null
}

// Dipakai hanya bila dokumen memang tidak punya berkas. Dulu fungsi ini juga
// menangani dokumen Supabase, sehingga yang terunduh adalah teks ini dengan
// nama .xlsx - dan Excel melaporkannya rusak.
export function createPlaceholderUrl(document) {
  const fallback = [
    `Dokumen: ${document.title}`,
    `Nomor: ${document.documentNumber || '-'}`,
    `Divisi: ${document.divisionId}`,
    `Kategori: ${document.categoryId}`,
    `Status: ${document.status}`,
    '',
    document.description || ''
  ].join('\n')

  return `data:text/plain;charset=utf-8,${encodeURIComponent(fallback)}`
}
