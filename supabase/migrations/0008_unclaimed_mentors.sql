-- Support importing a real mentor roster as browsable directory
-- entries before those mentors ever create an account ("unclaimed").
-- We never fabricate login credentials for a real person who hasn't
-- signed up — instead each imported row gets a claim_token used in a
-- personal invite link; when the real mentor signs up through that
-- link, handle_new_user() links their new auth user to this existing
-- row instead of creating a duplicate.

alter table mentor_profiles alter column user_id drop not null;
alter table mentor_profiles add column unclaimed_name text;
alter table mentor_profiles add column claim_token text unique;
alter table mentor_profiles add column claim_status text not null default 'claimed'
  check (claim_status in ('claimed', 'unclaimed'));

-- A claimed row must have a real owner; an unclaimed one must not yet.
alter table mentor_profiles add constraint mentor_profiles_claim_consistency check (
  (claim_status = 'claimed' and user_id is not null)
  or (claim_status = 'unclaimed' and user_id is null)
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role user_role := coalesce(new.raw_user_meta_data ->> 'role', 'student')::user_role;
  claim_token_input text := new.raw_user_meta_data ->> 'claim_token';
  claimed_mentor_id uuid;
begin
  insert into profiles (id, role, name, email, phone, org_id)
  values (
    new.id,
    new_role,
    new.raw_user_meta_data ->> 'name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    nullif(new.raw_user_meta_data ->> 'org_id', '')::uuid
  );

  if new_role = 'mentor' then
    if claim_token_input is not null then
      update mentor_profiles
      set user_id = new.id, claim_status = 'claimed', unclaimed_name = null
      where claim_token = claim_token_input and claim_status = 'unclaimed'
      returning id into claimed_mentor_id;
    end if;

    if claimed_mentor_id is null then
      insert into mentor_profiles (user_id) values (new.id);
    end if;
  elsif new_role = 'student' then
    insert into student_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

-- Directory browsing (mentor search) already covers unclaimed rows
-- via the existing "status = 'approved'" policy. Excluded on purpose:
-- unclaimed mentors must never be picked as match_candidates or
-- question_targets — nobody is logged in to accept/answer on their
-- behalf, which would leave those rows permanently stuck pending.
-- Enforced in application code (lib/matching/actions.ts,
-- lib/qna/actions.ts) by filtering user_id is not null.
