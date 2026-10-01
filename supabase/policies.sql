-- Production-oriented write policies. Run after schema.sql and seed.sql.
-- The script creates the private Storage bucket named "documents".

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload documents" on public.documents;
drop policy if exists "Users can update permitted documents" on public.documents;
drop policy if exists "Users can delete permitted documents" on public.documents;
drop policy if exists "Admins can review documents" on public.documents;
drop policy if exists "Users can create content" on public.content;
drop policy if exists "Authors and admins can update content" on public.content;
drop policy if exists "Authors and admins can delete content" on public.content;
drop policy if exists "Authenticated users can read document files" on storage.objects;
drop policy if exists "Users can upload document files" on storage.objects;
drop policy if exists "Owners and admins can update document files" on storage.objects;
drop policy if exists "Owners and admins can delete document files" on storage.objects;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_division()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select division_id from public.profiles where id = auth.uid();
$$;

create policy "Users can upload documents"
  on public.documents for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and (
      public.current_profile_role() = 'admin'
      or (division_id = public.current_profile_division() and status = 'approved')
    )
  );

create policy "Users can update permitted documents"
  on public.documents for update to authenticated
  using (
    public.current_profile_role() = 'admin'
    or (uploaded_by = auth.uid() and division_id = public.current_profile_division())
  )
  with check (
    public.current_profile_role() = 'admin'
    or (uploaded_by = auth.uid() and division_id = public.current_profile_division() and status = 'approved')
  );

create policy "Users can delete permitted documents"
  on public.documents for delete to authenticated
  using (
    public.current_profile_role() = 'admin'
    or (uploaded_by = auth.uid() and division_id = public.current_profile_division())
  );

create policy "Admins can review documents"
  on public.documents for update to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "Users can create content"
  on public.content for insert to authenticated
  with check (author_id = auth.uid());

create policy "Authors and admins can update content"
  on public.content for update to authenticated
  using (author_id = auth.uid() or public.current_profile_role() = 'admin')
  with check (author_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "Authors and admins can delete content"
  on public.content for delete to authenticated
  using (author_id = auth.uid() or public.current_profile_role() = 'admin');

-- Storage policies for the private documents bucket.
create policy "Authenticated users can read document files"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "Users can upload document files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (
      public.current_profile_role() = 'admin'
      or (storage.foldername(name))[1] = public.current_profile_division()
    )
  );

create policy "Owners and admins can update document files"
  on storage.objects for update to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = public.current_profile_division() or public.current_profile_role() = 'admin'))
  with check (bucket_id = 'documents');

create policy "Owners and admins can delete document files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = public.current_profile_division() or public.current_profile_role() = 'admin'));
