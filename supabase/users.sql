-- =====================================================================
-- Pengguna awal portal JEMBATAN
-- 1 super admin + 1 penanggung jawab untuk tiap bidang.
--
-- Jalankan di SQL Editor Supabase, SETELAH schema.sql, seed.sql, dan
-- policies.sql. Aman dijalankan berulang: akun yang sudah ada tidak
-- dibuat ulang, profilnya saja yang disegarkan.
--
-- ---------------------------------------------------------------------
-- BACA DULU
--
-- Supabase tidak menyediakan cara resmi membuat akun lewat SQL; tabel
-- auth.users dikelola oleh layanan Auth (GoTrue), bukan oleh skema
-- aplikasi. Skrip ini menyisipkan langsung ke auth.users dan
-- auth.identities. Cara ini berjalan pada Supabase versi sekarang dan
-- lazim dipakai untuk bootstrap, tapi statusnya tidak didukung resmi
-- dan bisa berubah bila Supabase mengubah struktur internalnya.
--
-- Jalur resmi ada di BAGIAN C di bawah: buat akunnya lewat Dashboard,
-- lalu jalankan BAGIAN C saja untuk mengisi profilnya. Kalau BAGIAN B
-- gagal karena perbedaan versi, pakai jalur itu.
--
-- ---------------------------------------------------------------------
-- CARA LOGIN
--
-- Aplikasi mengubah username menjadi email: "keuangan" dikirim sebagai
-- keuangan@jembatan.local (lihat src/context/AuthContext.jsx). Karena
-- itu email di sini mengikuti pola <username>@jembatan.local. Pengguna
-- cukup mengetik username-nya saja di halaman login.
--
-- ---------------------------------------------------------------------
-- KATA SANDI
--
-- Berkas ini TIDAK memuat kata sandi. Anda wajib mengisinya sendiri
-- pada variabel kata_sandi di BAGIAN A; skrip menolak berjalan selama
-- nilainya masih GANTI_SAYA.
--
-- Jangan simpan kata sandi asli di berkas ini lalu di-commit - repo
-- ini terhubung ke GitHub. Isi nilainya di editor SQL Supabase saat
-- hendak dijalankan, dan biarkan berkas di repo tetap GANTI_SAYA.
-- =====================================================================


-- =====================================================================
-- BAGIAN A - daftar akun
--
-- Ubah daftar ini bila nama atau jabatannya berbeda. Kolomnya:
--   username, nama lengkap, division_id, role, jabatan
--
-- role yang dikenal aplikasi hanya tiga:
--   admin    - kuasa penuh: menyetujui dokumen, mengelola seluruh
--              bidang, melihat semua agenda termasuk yang terbatas.
--              Inilah "super admin" pada model akses aplikasi ini;
--              tidak ada peran di atasnya.
--   employee - mengunggah dan mengelola dokumen bidangnya sendiri,
--              mencatat agenda bidangnya.
--   viewer   - hanya membaca.
--
-- division_id harus cocok dengan public.divisions. Super admin sengaja
-- tidak diberi bidang (null) supaya tidak terikat pada salah satu.
-- =====================================================================

create extension if not exists pgcrypto;

do $do$
declare
  akun            record;
  user_id         uuid;
  user_email      text;
  ada_provider_id boolean;
  -- Isi di SQL Editor sesaat sebelum dijalankan. Jangan di-commit.
  kata_sandi      constant text := 'GANTI_SAYA';
begin
  if kata_sandi = 'GANTI_SAYA' then
    raise exception
      'Isi dulu variabel kata_sandi di BAGIAN A dengan kata sandi sementara yang kuat, baru jalankan skrip ini.';
  end if;

  -- Kolom provider_id baru ada pada Supabase versi belakangan.
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'provider_id'
  ) into ada_provider_id;

  for akun in
    select *
    from (values
      ('superadmin', 'Super Administrator',          null::text, 'admin',    'Administrator Portal'),
      ('keuangan',   'Penanggung Jawab Keuangan',    'finance',  'employee', 'Staf Subbagian Keuangan'),
      ('sdm',        'Penanggung Jawab SDM',         'hr',       'employee', 'Staf Subbagian SDM'),
      ('hukum',      'Penanggung Jawab Hukum',       'legal',    'employee', 'Staf Subbagian Hukum'),
      ('humas',      'Penanggung Jawab Humas',       'pr',       'employee', 'Staf Humas dan TU Kalan'),
      ('umumti',     'Penanggung Jawab Umum dan TI', 'it',       'employee', 'Staf Subbagian Umum dan TI')
    ) as t(username, nama, division_id, role, jabatan)
  loop
    user_email := akun.username || '@jembatan.local';

    -- ---------------------------------------------------------------
    -- BAGIAN B - akun Auth
    -- ---------------------------------------------------------------
    select id into user_id from auth.users where email = user_email;

    if user_id is null then
      user_id := gen_random_uuid();

      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
      ) values (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        'authenticated',
        'authenticated',
        user_email,
        crypt(kata_sandi, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', akun.nama),
        now(),
        now(),
        '', '', '', ''
      );

      -- Tanpa baris identities, login email/password akan ditolak.
      if ada_provider_id then
        execute
          'insert into auth.identities
             (id, user_id, identity_data, provider, provider_id,
              last_sign_in_at, created_at, updated_at)
           values ($1, $2, $3, ''email'', $4, now(), now(), now())'
        using
          gen_random_uuid(),
          user_id,
          jsonb_build_object(
            'sub', user_id::text,
            'email', user_email,
            'email_verified', true,
            'phone_verified', false
          ),
          user_id::text;
      else
        execute
          'insert into auth.identities
             (id, user_id, identity_data, provider,
              last_sign_in_at, created_at, updated_at)
           values ($1, $2, $3, ''email'', now(), now(), now())'
        using
          gen_random_uuid(),
          user_id,
          jsonb_build_object(
            'sub', user_id::text,
            'email', user_email,
            'email_verified', true,
            'phone_verified', false
          );
      end if;

      raise notice 'Akun dibuat: % (%)', akun.username, akun.role;
    else
      raise notice 'Akun sudah ada, dilewati: %', akun.username;
    end if;

    -- ---------------------------------------------------------------
    -- BAGIAN C - profil aplikasi
    --
    -- Bagian inilah yang dibaca aplikasi untuk menentukan peran dan
    -- bidang. Kalau akun dibuat lewat Dashboard, jalankan bagian ini
    -- saja (lihat catatan di bawah berkas).
    -- ---------------------------------------------------------------
    insert into public.profiles (id, name, username, email, role, division_id, position)
    values (user_id, akun.nama, akun.username, user_email, akun.role, akun.division_id, akun.jabatan)
    on conflict (id) do update set
      name        = excluded.name,
      username    = excluded.username,
      email       = excluded.email,
      role        = excluded.role,
      division_id = excluded.division_id,
      position    = excluded.position,
      updated_at  = now();
  end loop;
end
$do$;


-- =====================================================================
-- Periksa hasilnya
-- =====================================================================
select
  p.username,
  p.name,
  p.role,
  coalesce(d.name, '(seluruh bidang)') as bidang,
  u.email,
  u.email_confirmed_at is not null as email_terkonfirmasi
from public.profiles p
join auth.users u on u.id = p.id
left join public.divisions d on d.id = p.division_id
order by
  case p.role when 'admin' then 0 when 'employee' then 1 else 2 end,
  p.username;


-- =====================================================================
-- BAGIAN D - ganti kata sandi
--
-- Wajib dilakukan sebelum akun dibagikan. Jalankan satu per akun,
-- ganti nilainya lebih dulu.
-- =====================================================================
-- update auth.users
-- set encrypted_password = crypt('KataSandiBaruYangKuat', gen_salt('bf')),
--     updated_at = now()
-- where email = 'keuangan@jembatan.local';


-- =====================================================================
-- Menambah pengguna lain di bidang yang sama
--
-- Tambahkan barisnya pada daftar di BAGIAN A lalu jalankan ulang berkas
-- ini. Akun yang sudah ada tidak akan dibuat ulang.
--
-- Mencabut akses seseorang: turunkan perannya, jangan hapus barisnya,
-- supaya dokumen dan agenda yang pernah ia unggah tidak kehilangan
-- pemilik.
--   update public.profiles set role = 'viewer' where username = 'sdm';
--
-- Menghapus akun sepenuhnya (dokumen dan agendanya jadi tanpa pemilik):
--   delete from auth.users where email = 'sdm@jembatan.local';
-- =====================================================================


-- =====================================================================
-- Catatan
--
-- public.profiles.username bersifat unik. Bila sebelumnya sudah ada
-- baris profil dengan username yang sama tapi id berbeda, skrip akan
-- berhenti dengan pelanggaran constraint. Hapus baris lama itu lebih
-- dulu, lalu jalankan ulang.
--
-- Pola <username>@jembatan.local dipakai supaya pengguna cukup
-- mengetik username. Bila lebih suka email asli (mis. @bpk.go.id),
-- ganti saja nilainya - aplikasi menerima email utuh selama pengguna
-- mengetiknya lengkap dengan tanda @ di halaman login.
-- =====================================================================


-- =====================================================================
-- Kalau BAGIAN B gagal: jalur resmi
--
-- 1. Dashboard Supabase > Authentication > Users > Add user.
-- 2. Isi email <username>@jembatan.local, isi kata sandi, dan centang
--    "Auto Confirm User".
-- 3. Ulangi untuk setiap akun pada daftar di BAGIAN A.
-- 4. Jalankan berkas ini lagi. Karena akunnya sudah ada, BAGIAN B akan
--    dilewati dan hanya profilnya yang diisi.
-- =====================================================================
