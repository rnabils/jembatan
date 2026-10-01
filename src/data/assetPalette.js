import { AlertTriangle, CheckCircle2, CircleSlash, HelpCircle } from 'lucide-react'

// Warna untuk analitik BMN.
//
// Lima hex kategorikal di bawah sama persis dengan yang dipakai palet divisi,
// dan itu disengaja: kombinasi tersebut sudah divalidasi pada latar putih untuk
// seluruh pasangan - worst CVD dE 13.0, normal-vision dE 16.3. Memilih warna
// baru berarti mengulang validasi itu dari nol tanpa alasan.
//
// Jenis BMN pada berkas perwakilan ada lima, jadi kelimanya pas satu slot.
// Jenis keenam dan seterusnya dilipat ke abu-abu netral, bukan diberi hue baru.
const KATEGORI = ['#2a78d6', '#eda100', '#e87ba4', '#008300', '#4a3aa7']
const NETRAL = '#64748b'

export function warnaKategori(index) {
  return KATEGORI[index] ?? NETRAL
}

// Kondisi memakai palet status, bukan kategorikal. Status punya makna baik/buruk
// yang melekat, jadi warnanya tidak boleh dipakai ulang sebagai "kategori ke-4".
// Ikon dan label selalu menyertainya - warna tidak pernah jadi penanda tunggal.
export const KONDISI_META = {
  baik: { label: 'Baik', color: '#16a34a', badge: 'success', icon: CheckCircle2 },
  'rusak ringan': { label: 'Rusak Ringan', color: '#f59e0b', badge: 'warning', icon: AlertTriangle },
  'rusak berat': { label: 'Rusak Berat', color: '#dc2626', badge: 'destructive', icon: CircleSlash },
  rusak: { label: 'Rusak', color: '#dc2626', badge: 'destructive', icon: CircleSlash }
}

export function kondisiMeta(kondisi) {
  const kunci = String(kondisi || '').toLowerCase().trim()
  return (
    KONDISI_META[kunci] || {
      label: kondisi || 'Tidak diisi',
      color: NETRAL,
      badge: 'outline',
      icon: HelpCircle
    }
  )
}

// Umur aset bersifat berurut, bukan kategori, jadi satu hue dari muda ke tua.
export const UMUR_RAMP = ['#9ec5f4', '#5598e7', '#2a78d6', '#184f95']

export function warnaUmur(index) {
  return UMUR_RAMP[index] ?? UMUR_RAMP.at(-1)
}
