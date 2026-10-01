import { isSupabaseConfigured, supabase } from './supabaseClient'

// Panduan sistem berlaku untuk seluruh bidang, jadi tidak disimpan sebagai
// dokumen milik salah satu bidang. Berkasnya diletakkan pada satu jalur tetap
// di bucket yang sama dengan dokumen lain, sehingga tidak perlu tabel maupun
// migrasi baru.
//
// Izinnya ikut kebijakan storage yang sudah ada: "sistem" bukan id bidang mana
// pun, jadi syarat foldername = bidang pengguna tidak pernah terpenuhi dan
// hanya admin yang bisa mengunggah. Membacanya terbuka untuk semua pengguna
// yang sudah masuk. Tidak ada kebijakan baru yang perlu ditambahkan.
const GUIDE_FOLDER = 'sistem'
const GUIDE_FILE = 'panduan-sistem.pdf'
const GUIDE_PATH = `${GUIDE_FOLDER}/${GUIDE_FILE}`
const GUIDE_KEY = 'bpk-dashboard-panduan'

const SIGNED_URL_TTL = 3600

export function isGuideFileAllowed(file) {
  if (!file) return false
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Berkas gagal dibaca.'))
    reader.readAsDataURL(file)
  })
}

function loadLocalGuide() {
  try {
    const saved = localStorage.getItem(GUIDE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed?.url ? parsed : null
  } catch {
    return null
  }
}

export async function loadGuide() {
  if (isSupabaseConfigured && supabase) {
    // list() dipakai lebih dulu, bukan langsung createSignedUrl, supaya
    // "belum ada panduan" bisa dibedakan dari "gagal diambil" - dan sekalian
    // memberi tanggal unggah terakhirnya.
    const { data, error } = await supabase.storage
      .from('documents')
      .list(GUIDE_FOLDER, { limit: 100, search: GUIDE_FILE })

    if (!error) {
      const berkas = (data || []).find((item) => item.name === GUIDE_FILE)
      if (!berkas) return null

      const { data: signed, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(GUIDE_PATH, SIGNED_URL_TTL)

      if (signedError || !signed?.signedUrl) {
        throw new Error('Berkas panduan gagal diambil dari penyimpanan.')
      }

      return {
        url: signed.signedUrl,
        name: GUIDE_FILE,
        updatedAt: berkas.updated_at || berkas.created_at || null,
        size: berkas.metadata?.size || 0,
        shared: true
      }
    }
    // Bila storage tidak terjangkau, jatuh ke salinan lokal di bawah.
  }

  return loadLocalGuide()
}

export async function saveGuide(file) {
  if (!isGuideFileAllowed(file)) {
    throw new Error('Panduan harus berupa berkas PDF.')
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage
      .from('documents')
      .upload(GUIDE_PATH, file, { upsert: true, contentType: 'application/pdf' })

    if (error) throw new Error(error.message)

    const tersimpan = await loadGuide()
    if (tersimpan) return tersimpan
  }

  // Mode lokal: berkasnya disimpan sebagai data URL. localStorage hanya
  // menampung beberapa megabyte, jadi kegagalannya dijelaskan apa adanya
  // alih-alih gagal diam-diam.
  const dataUrl = await readFileAsDataUrl(file)
  const record = {
    url: dataUrl,
    name: file.name,
    updatedAt: new Date().toISOString(),
    size: file.size,
    shared: false
  }

  try {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(record))
  } catch {
    throw new Error(
      'Berkas terlalu besar untuk disimpan di browser ini. Sambungkan Supabase, atau pakai PDF yang lebih kecil.'
    )
  }

  return record
}

export async function removeGuide() {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage.from('documents').remove([GUIDE_PATH])
    if (error) throw new Error(error.message)
  }

  try {
    localStorage.removeItem(GUIDE_KEY)
  } catch {
    // Tidak ada yang bisa dilakukan, dan bukan kegagalan yang perlu dilaporkan.
  }
}

export function formatGuideUpdatedAt(value) {
  if (!value) return null
  const tanggal = new Date(value)
  if (Number.isNaN(tanggal.getTime())) return null
  return tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}
