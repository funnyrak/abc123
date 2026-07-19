-- mentor_profiles.display_name: a single, always-populated name field
-- for mentor listings, independent of claim status.
--
-- Previously, mentor display name came from either `unclaimed_name`
-- (seeded, not-yet-claimed rows) or a join to `profiles.name` (claimed
-- rows with a real account) — but profiles is only readable by the
-- account owner + admin + (as of 0006) any *authenticated* user, so an
-- anonymous visitor to a public mentor directory would see null for
-- every claimed mentor's name. Keeping the name directly on
-- mentor_profiles (which is already publicly readable when
-- status = 'approved') sidesteps that entirely.

alter table mentor_profiles add column display_name text;

-- Backfill: unclaimed rows already have unclaimed_name; claimed rows
-- pull from their linked profile.
update mentor_profiles mp
set display_name = coalesce(
  mp.unclaimed_name,
  (select p.name from profiles p where p.id = mp.user_id)
)
where mp.display_name is null;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role user_role := coalesce(new.raw_user_meta_data ->> 'role', 'student')::user_role;
  claim_token_input text := new.raw_user_meta_data ->> 'claim_token';
  new_name text := new.raw_user_meta_data ->> 'name';
  claimed_mentor_id uuid;
begin
  insert into profiles (id, role, name, email, phone, org_id)
  values (
    new.id,
    new_role,
    new_name,
    new.email,
    new.raw_user_meta_data ->> 'phone',
    nullif(new.raw_user_meta_data ->> 'org_id', '')::uuid
  );

  if new_role = 'mentor' then
    if claim_token_input is not null then
      update mentor_profiles
      set user_id = new.id, claim_status = 'claimed', unclaimed_name = null,
          display_name = coalesce(new_name, display_name)
      where claim_token = claim_token_input and claim_status = 'unclaimed'
      returning id into claimed_mentor_id;
    end if;

    if claimed_mentor_id is null then
      insert into mentor_profiles (user_id, display_name) values (new.id, new_name);
    end if;
  elsif new_role = 'student' then
    insert into student_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;
