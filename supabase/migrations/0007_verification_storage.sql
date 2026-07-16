-- Verification document storage (Phase 5). Files live at
-- "<mentor_profile_id>/<filename>" in a private bucket — only the
-- owning mentor and admins can read them (재직 인증 서류, sensitive).

insert into storage.buckets (id, name, public)
values ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

create policy "verification_documents_owner_insert" on storage.objects
for insert
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] in (
    select id::text from mentor_profiles where user_id = auth.uid()
  )
);

create policy "verification_documents_owner_select" on storage.objects
for select
using (
  bucket_id = 'verification-documents'
  and (
    (storage.foldername(name))[1] in (
      select id::text from mentor_profiles where user_id = auth.uid()
    )
    or is_admin()
  )
);
