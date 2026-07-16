-- Lecture material storage (Phase 3)
-- Files are stored at "<project_id>/<filename>" inside a private bucket.
-- Access is scoped to project_members of that project (+ admins).

insert into storage.buckets (id, name, public)
values ('lecture-materials', 'lecture-materials', false)
on conflict (id) do nothing;

create policy "lecture_materials_member_insert" on storage.objects
for insert
with check (
  bucket_id = 'lecture-materials'
  and (storage.foldername(name))[1] in (
    select project_id::text from project_members where user_id = auth.uid()
  )
);

create policy "lecture_materials_member_select" on storage.objects
for select
using (
  bucket_id = 'lecture-materials'
  and (
    (storage.foldername(name))[1] in (
      select project_id::text from project_members where user_id = auth.uid()
    )
    or is_admin()
  )
);

create policy "lecture_materials_member_delete" on storage.objects
for delete
using (
  bucket_id = 'lecture-materials'
  and (
    owner = auth.uid()
    or is_admin()
  )
);
