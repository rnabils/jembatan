// Palet kategorikal per divisi untuk kalender bersama.
//
// Divalidasi dengan validator palet kategorikal pada surface putih (#ffffff),
// mode --pairs all. Yang berlaku di sini memang seluruh pasangan, bukan hanya
// pasangan bersebelahan: dua chip divisi mana pun bisa muncul berdampingan di
// satu sel tanggal, dalam kombinasi apa pun.
//
//   lightness band  PASS  - kelima warna di dalam L 0.43-0.77
//   chroma floor    PASS  - kelimanya >= 0.1
//   CVD separation  PASS  - worst all-pairs dE 13.0 (#e87ba4 <-> #2a78d6, protan)
//   normal-vision   PASS  - worst all-pairs dE 16.3 (#4a3aa7 <-> #2a78d6)
//   contrast        WARN  - #eda100 (2.17:1) dan #e87ba4 (2.69:1) di bawah 3:1
//                           pada latar putih. Karena itu setiap chip WAJIB
//                           membawa singkatan divisi sebagai teks; warna tidak
//                           pernah menjadi satu-satunya penanda.
//
// Lima slot adalah batas amannya. Menambah slot keenam (aqua #1baf7a)
// menjatuhkan worst CVD dari dE 13.0 ke 6.1 - masih legal karena ada label
// teks, tapi jauh lebih tipis. Jadi divisi di luar kelima ini sengaja dilipat
// ke abu-abu netral, bukan diberi hue baru. Kalau nanti benar-benar perlu slot
// keenam, aqua #1baf7a adalah kandidatnya dan palet wajib divalidasi ulang.
//
// Urutan slot mengikuti entitas, bukan peringkat: mematikan satu divisi di
// panel filter tidak boleh mengecat ulang divisi yang tersisa.

export const DIVISION_VISUALS = {
  finance: { color: '#2a78d6', abbr: 'KEU' },
  hr: { color: '#eda100', abbr: 'SDM' },
  legal: { color: '#e87ba4', abbr: 'HKM' },
  pr: { color: '#008300', abbr: 'HUMAS' },
  it: { color: '#4a3aa7', abbr: 'TI' }
}

export const DIVISION_FALLBACK_VISUAL = { color: '#64748b', abbr: 'LAIN' }

// Divisi yang punya slot warna sendiri, dalam urutan tetap.
export const COLORED_DIVISION_IDS = Object.keys(DIVISION_VISUALS)

export function getDivisionVisual(divisionId) {
  return DIVISION_VISUALS[divisionId] || DIVISION_FALLBACK_VISUAL
}
