# Portal JEMBATAN

Portal internal kesekretariatan BPK Perwakilan Papua Barat Daya.
React + Vite, backend Supabase, deploy di Vercel.

## Jalanin

```bash
npm install
```

Bikin `.env.local` di akar proyek:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Ambil di Supabase → Settings → API, pakai kunci **anon**, jangan service role.

```bash
npm run dev
```

## Catatan

- Dua baris `.env.local` itu yang bikin datanya sama persis kayak punyaku.
  Kalau kosong, aplikasinya tetap jalan tapi pakai data contoh di localStorage.
  Mau lihat-lihat dulu, login `admin` / `admin123`.
- Push ke `main` = langsung rilis ke user. Vercel ngawasin branch itu.
- Ubah struktur tabel masih manual, tempel SQL-nya ke SQL Editor Supabase.
  File-nya di folder `supabase/`, yang paling update `jalankan-semua.sql`.
  Habis ubah kolom, jalanin `notify pgrst, 'reload schema';` — kalau lupa,
  kolom barunya bakal dilaporin nggak ada padahal udah ada.
- Hak akses ditegakkan di Supabase pakai RLS, bukan di kode.
- Penjelasan fitur per fitur ada di [README-proyek.md](README-proyek.md).
