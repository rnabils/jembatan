-- Create the profile after creating the Auth user in Supabase Dashboard.
-- 1. Authentication > Users > Add user > Create new user
-- 2. Copy the new user's UUID into USER_UUID below.
-- 3. Run this query in SQL Editor.

insert into public.profiles (
  id,
  name,
  username,
  email,
  role,
  division_id,
  position
)
values (
  'USER_UUID',
  'Pegawai Keuangan',
  'finance.employee',
  'finance.employee@jembatan.local',
  'employee',
  'finance',
  'Staff Keuangan'
)
on conflict (id) do update set
  name = excluded.name,
  username = excluded.username,
  email = excluded.email,
  role = excluded.role,
  division_id = excluded.division_id,
  position = excluded.position,
  updated_at = now();

-- Verify the profile mapping.
select id, name, username, email, role, division_id, position
from public.profiles
where username = 'finance.employee';
