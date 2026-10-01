-- =====================================================================
-- Memberi peran dan bidang pada akun yang SUDAH ADA di Supabase Auth.
--
-- Berbeda dari users.sql yang sekaligus membuat akunnya, berkas ini hanya
-- mengisi public.profiles - tabel yang dibaca aplikasi untuk menentukan
-- siapa boleh apa. Pakai ini bila akunnya Anda buat lewat Dashboard
-- (Authentication > Users > Add user).
--
-- Aman dijalankan berulang: menjalankan ulang hanya menyegarkan perannya.
-- Akun yang emailnya tidak ditemukan dilewati dengan peringatan, bukan
-- membatalkan seluruh skrip.
-- =====================================================================


-- =====================================================================
-- DAFTAR AKUN - ubah bagian ini saja
--
-- Kolom: email, nama lengkap, role, division_id, jabatan
--
-- role:        admin | employee | viewer
-- division_id: finance | hr | legal | pr | it, atau null untuk admin
--              (harus cocok dengan public.divisions)
--
-- Username pada profil diambil otomatis dari bagian depan email, jadi
-- akunkeuangan@test.com menjadi username "akunkeuangan".
-- =====================================================================

do $do$
declare
  akun            record;
  uid             uuid;
  nama_pengguna   text;
  -- Akun yang dibuat lewat Dashboard tanpa "Auto Confirm User" tidak bisa
  -- login. Biarkan true agar sekalian dikonfirmasi.
  konfirmasi_email constant boolean := true;
begin
  for akun in
    select *
    from (values
      ('akunkeuangan@test.com', 'Staf Subbagian Keuangan',    'employee', 'finance', 'Staf Subbagian Keuangan'),
      ('akunsdm@test.com',      'Staf Subbagian SDM',         'employee', 'hr',      'Staf Subbagian SDM'),
      ('akunhukum@test.com',    'Staf Subbagian Hukum',       'employee', 'legal',   'Staf Subbagian Hukum'),
      ('akunhumas@test.com',    'Staf Humas dan TU Kalan',    'employee', 'pr',      'Staf Humas dan TU Kalan'),
      ('akunumumti@test.com',   'Staf Subbagian Umum dan TI', 'employee', 'it',      'Staf Subbagian Umum dan TI')
      -- Tambahkan baris lain di sini. Untuk super admin:
      -- ,('akunadmin@test.com', 'Administrator Portal', 'admin', null::text, 'Administrator Portal')
    ) as t(email, nama, role, division_id, jabatan)
  loop
    select id into uid from auth.users where lower(email) = lower(akun.email);

    if uid is null then
      raise warning 'DILEWATI: akun Auth dengan email % tidak ditemukan.', akun.email;
      continue;
    end if;

    if konfirmasi_email then
      update auth.users
      set email_confirmed_at = now(), updated_at = now()
      where id = uid and email_confirmed_at is null;
    end if;

    nama_pengguna := split_part(akun.email, '@', 1);

    begin
      insert into public.profiles (id, name, username, email, role, division_id, position)
      values (uid, akun.nama, nama_pengguna, akun.email, akun.role, akun.division_id, akun.jabatan)
      on conflict (id) do update set
        name        = excluded.name,
        username    = excluded.username,
        email       = excluded.email,
        role        = excluded.role,
        division_id = excluded.division_id,
        position    = excluded.position,
        updated_at  = now();

      raise notice 'OK: % -> % / %', akun.email, akun.role, coalesce(akun.division_id, 'seluruh bidang');
    exception
      -- profiles.username bersifat unik; bentrok berarti ada profil lain yang
      -- sudah memakainya. Hapus atau ubah profil itu dulu.
      when unique_violation then
        raise warning 'GAGAL %: username "%" sudah dipakai profil lain.', akun.email, nama_pengguna;
    end;
  end loop;
end
$do$;


-- =====================================================================
-- Periksa hasilnya. Inilah sumber kebenarannya, bukan pesan notice di
-- atas - sebagian editor SQL tidak menampilkan notice.
--
-- Baris dengan punya_profil = false berarti akunnya ada di Auth tapi
-- belum berperan, sehingga di aplikasi ia tidak bisa apa-apa.
-- =====================================================================
select
  u.email,
  p.id is not null                  as punya_profil,
  p.role,
  coalesce(d.name, '(seluruh bidang)') as bidang,
  u.email_confirmed_at is not null  as bisa_login
from auth.users u
left join public.profiles p on p.id = u.id
left join public.divisions d on d.id = p.division_id
order by p.role nulls last, u.email;


-- =====================================================================
-- CATATAN LOGIN
--
-- Aplikasi mengubah isian Username menjadi <isian>@jembatan.local bila
-- tidak memuat tanda @. Karena akun-akun di atas memakai domain
-- @test.com, penggunanya harus mengetik email lengkapnya di kolom
-- Username - misalnya akunkeuangan@test.com, bukan akunkeuangan saja.
--
-- Bila ingin cukup mengetik username, buat akunnya dengan domain
-- @jembatan.local seperti pola pada users.sql.
-- =====================================================================


-- =====================================================================
-- MENGUBAH PERAN SESEORANG KEMUDIAN
--
-- Mencabut akses: turunkan perannya, jangan hapus barisnya, supaya
-- dokumen dan agenda yang pernah ia unggah tidak kehilangan pemilik.
--   update public.profiles set role = 'viewer' where email = 'akunsdm@test.com';
--
-- Memindahkan bidang:
--   update public.profiles set division_id = 'legal' where email = 'akunsdm@test.com';
-- =====================================================================
