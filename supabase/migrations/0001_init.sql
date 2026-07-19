-- Mentoring platform initial schema (Phase 1)
-- Mirrors docs/SPEC.md section 8 (data model v2).
-- Status/type columns use text + check constraints instead of native enums
-- so they stay easy to extend while the spec is still evolving.

create extension if not exists pgcrypto;

-- =========================================================
-- 8.1 Accounts & organizations
-- =========================================================

create type user_role as enum ('mentor', 'coordinator', 'student', 'admin');

-- One row per auth.users entry. Created by the signup Server Action
-- right after supabase.auth.signUp() succeeds.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  name text not null,
  phone text,
  email text not null,
  org_id uuid, -- set for coordinator/student once org is known; FK added below
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text, -- 학교/기관
  address text,
  org_code text not null unique, -- 학생 가입용 학교 코드
  qna_subscription_status text not null default 'inactive'
    check (qna_subscription_status in ('inactive', 'active')),
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_org_id_fkey foreign key (org_id) references organizations (id);

create table mentor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  company text,
  department text,
  position text, -- 직책/직급
  job_function text, -- 직무
  industry text, -- 산업
  main_duties text,
  mentoring_fields text[] not null default '{}',
  bio text,
  available_times jsonb,
  region text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  avg_rating numeric(3, 2),
  no_response_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table mentor_careers (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentor_profiles (id) on delete cascade,
  start_year integer not null,
  end_year integer,
  organization text not null,
  description text
);

create table mentor_educations (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentor_profiles (id) on delete cascade,
  degree_type text not null check (degree_type in ('학사', '석사')),
  school_name text not null,
  major text,
  graduation_year integer
);

create table verification_documents (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentor_profiles (id) on delete cascade,
  file_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  student_no text,
  major text,
  gender text,
  interest_fields text[] not null default '{}',
  free_questions_used integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 8.2 Sourcing, matching & projects
-- =========================================================

create table match_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id),
  requested_by uuid not null references profiles (id),
  industry text,
  job_function text,
  company_filter text,
  requested_schedule text,
  format text check (format in ('online', 'offline')),
  proposed_fee numeric(12, 2),
  content_type text check (content_type in ('단순멘토링', '직무교육', '실습', '특강')),
  status text not null default 'recruiting'
    check (status in ('recruiting', 'mentor_selected', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table match_candidates (
  id uuid primary key default gen_random_uuid(),
  match_request_id uuid not null references match_requests (id) on delete cascade,
  mentor_id uuid not null references mentor_profiles (id),
  status text not null default 'invited'
    check (status in ('invited', 'accepted', 'declined', 'selected', 'not_selected')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (match_request_id, mentor_id)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  match_request_id uuid references match_requests (id),
  org_id uuid not null references organizations (id),
  type text not null check (type in ('recommendation', 'qna_subscription')),
  scale_tier text check (scale_tier in ('individual', 'managed')),
  commission_rate numeric(4, 3) not null default 0.20,
  payment_type text check (payment_type in ('prepaid', 'postpaid')),
  payment_method text check (payment_method in ('card', 'bank_transfer', 'project_contract')),
  session_fee numeric(12, 2),
  project_code text not null unique,
  detail_info jsonb,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'in_progress', 'completed', 'cancelled')),
  cancelled_at timestamptz,
  cancellation_fee_rate numeric(4, 3), -- 0 / 0.5 / 1.0
  created_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id),
  role_in_project text not null check (role_in_project in ('mentor', 'coordinator')),
  unique (project_id, user_id)
);

create table lecture_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  uploaded_by uuid not null references profiles (id),
  file_url text not null,
  title text,
  created_at timestamptz not null default now()
);

create table project_schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  session_no integer not null,
  scheduled_at timestamptz not null,
  topic text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  attended boolean,
  reminder_7d_sent boolean not null default false,
  reminder_1d_sent boolean not null default false,
  reminder_2h_sent boolean not null default false
);

create table progress_logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references project_schedules (id) on delete cascade,
  content text,
  attachments jsonb,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  content text,
  submitted_by uuid references profiles (id),
  submitted_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at timestamptz not null default now()
);

create table student_enrollments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  student_id uuid not null references profiles (id),
  org_code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references profiles (id),
  approved_at timestamptz,
  result_summary text,
  created_at timestamptz not null default now(),
  unique (project_id, student_id)
);

-- =========================================================
-- 8.3 Questions (Q&A), settlement & billing
-- =========================================================

create table questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id),
  project_id uuid references projects (id),
  scope_type text not null check (scope_type in ('individual', 'industry', 'job_function', 'company')),
  scope_value text,
  content text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create table question_targets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  mentor_id uuid not null references mentor_profiles (id),
  notified_at timestamptz,
  responded_at timestamptz,
  unique (question_id, mentor_id)
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  mentor_id uuid not null references mentor_profiles (id),
  content text not null,
  is_accepted boolean not null default false,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table answer_rewards (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null unique references answers (id) on delete cascade,
  mentor_id uuid not null references mentor_profiles (id),
  amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table question_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id),
  credits_purchased integer not null default 5,
  amount numeric(12, 2) not null default 10000,
  purchased_at timestamptz not null default now()
);

create table mentor_settlements (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentor_profiles (id),
  project_id uuid not null references projects (id),
  period_start date,
  period_end date,
  session_count integer not null default 0,
  total_amount numeric(12, 2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'available', 'paid')), -- 정산대기/정산가능/정산완료
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id),
  org_id uuid not null references organizations (id),
  payment_type text check (payment_type in ('prepaid', 'postpaid')),
  payment_method text check (payment_method in ('card', 'bank_transfer', 'project_contract')),
  amount numeric(12, 2) not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  invoiced_at timestamptz not null default now(),
  paid_at timestamptz
);

create table operations_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('no_mentor_match', 'question_delay', 'mentor_no_response')),
  ref_table text not null,
  ref_id uuid not null,
  triggered_at timestamptz not null default now(),
  resolved_at timestamptz,
  status text not null default 'open' check (status in ('open', 'resolved'))
);

create table kakao_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id),
  type text not null check (type in (
    'match_request', 'candidate_accept', 'final_confirm', 'schedule_reminder',
    'new_question', 'answer_ready', 'verification_result', 'project_addition_confirm'
  )),
  template_code text,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  action_token text
);

-- =========================================================
-- Indexes for common lookups
-- =========================================================

create index on mentor_profiles (status);
create index on match_candidates (mentor_id, status);
create index on projects (org_id);
create index on project_schedules (project_id, scheduled_at);
create index on questions (student_id);
create index on question_targets (mentor_id);
create index on student_enrollments (project_id, status);

-- =========================================================
-- Row Level Security
--
-- Baseline for Phase 1: owners manage their own rows, admins manage
-- everything. Nuanced rules from the spec (e.g. coordinators see
-- question *counts* but never settlement/reward *amounts*) are better
-- served by dedicated read-only views/RPCs once those features are
-- built (Phase 3/4) rather than table-level policies here — flagged
-- with TODO comments below where relevant.
-- =========================================================

create or replace function current_role_is(check_role user_role)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = check_role
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select current_role_is('admin');
$$;

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table mentor_profiles enable row level security;
alter table mentor_careers enable row level security;
alter table mentor_educations enable row level security;
alter table verification_documents enable row level security;
alter table student_profiles enable row level security;
alter table match_requests enable row level security;
alter table match_candidates enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table lecture_materials enable row level security;
alter table project_schedules enable row level security;
alter table progress_logs enable row level security;
alter table reports enable row level security;
alter table student_enrollments enable row level security;
alter table questions enable row level security;
alter table question_targets enable row level security;
alter table answers enable row level security;
alter table answer_rewards enable row level security;
alter table question_credit_purchases enable row level security;
alter table mentor_settlements enable row level security;
alter table invoices enable row level security;
alter table operations_alerts enable row level security;
alter table kakao_notifications enable row level security;

-- profiles: self read/update/insert, admin full access
create policy "profiles_self_select" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_self_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_self_update" on profiles for update using (id = auth.uid() or is_admin());
create policy "profiles_admin_all" on profiles for all using (is_admin());

-- organizations: name/org_code are not sensitive, so allow public read
-- (needed for the org_code lookup on the signup form, before login exists).
create policy "organizations_select" on organizations for select using (true);
create policy "organizations_admin_write" on organizations for all using (is_admin());

-- mentor_profiles: public read when approved, owner full access, admin full access
create policy "mentor_profiles_select_approved" on mentor_profiles for select using (status = 'approved' or is_admin());
create policy "mentor_profiles_owner_select" on mentor_profiles for select using (user_id = auth.uid());
create policy "mentor_profiles_owner_write" on mentor_profiles for all using (user_id = auth.uid() or is_admin());

create policy "mentor_careers_owner" on mentor_careers for all using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);
create policy "mentor_careers_select_approved" on mentor_careers for select using (
  mentor_id in (select id from mentor_profiles where status = 'approved')
);

create policy "mentor_educations_owner" on mentor_educations for all using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);
create policy "mentor_educations_select_approved" on mentor_educations for select using (
  mentor_id in (select id from mentor_profiles where status = 'approved')
);

create policy "verification_documents_owner" on verification_documents for all using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);

create policy "student_profiles_owner" on student_profiles for all using (user_id = auth.uid() or is_admin());

-- match_requests: coordinator who created it, admin, and invited mentors can see it
create policy "match_requests_coordinator" on match_requests for all using (
  requested_by = auth.uid() or is_admin()
);
create policy "match_requests_candidate_select" on match_requests for select using (
  id in (
    select match_request_id from match_candidates mc
    join mentor_profiles mp on mp.id = mc.mentor_id
    where mp.user_id = auth.uid()
  )
);

create policy "match_candidates_mentor" on match_candidates for all using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);
create policy "match_candidates_coordinator_select" on match_candidates for select using (
  match_request_id in (select id from match_requests where requested_by = auth.uid())
);

create policy "projects_member" on projects for select using (
  id in (select project_id from project_members where user_id = auth.uid())
  or org_id in (select org_id from profiles where id = auth.uid())
  or is_admin()
);
create policy "projects_admin_write" on projects for all using (is_admin());

create policy "project_members_select" on project_members for select using (
  user_id = auth.uid()
  or project_id in (select id from projects where org_id in (select org_id from profiles where id = auth.uid()))
  or is_admin()
);
create policy "project_members_admin_write" on project_members for all using (is_admin());

create policy "lecture_materials_project" on lecture_materials for all using (
  project_id in (select project_id from project_members where user_id = auth.uid()) or is_admin()
);

create policy "project_schedules_project" on project_schedules for select using (
  project_id in (select project_id from project_members where user_id = auth.uid())
  or project_id in (select id from projects where org_id in (select org_id from profiles where id = auth.uid()))
  or is_admin()
);
create policy "project_schedules_mentor_write" on project_schedules for all using (
  project_id in (select project_id from project_members where user_id = auth.uid() and role_in_project = 'mentor')
  or is_admin()
);

create policy "progress_logs_project" on progress_logs for all using (
  schedule_id in (
    select id from project_schedules where project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  ) or is_admin()
);

create policy "reports_project" on reports for all using (
  project_id in (select project_id from project_members where user_id = auth.uid()) or is_admin()
);

create policy "student_enrollments_student" on student_enrollments for all using (
  student_id = auth.uid() or is_admin()
);
create policy "student_enrollments_coordinator" on student_enrollments for select using (
  project_id in (select id from projects where org_id in (select org_id from profiles where id = auth.uid()))
);
create policy "student_enrollments_coordinator_update" on student_enrollments for update using (
  project_id in (select id from projects where org_id in (select org_id from profiles where id = auth.uid()))
);

-- questions/answers: student who asked, targeted mentors, admin
create policy "questions_student" on questions for all using (student_id = auth.uid() or is_admin());
create policy "questions_targeted_mentor_select" on questions for select using (
  id in (
    select question_id from question_targets qt
    join mentor_profiles mp on mp.id = qt.mentor_id
    where mp.user_id = auth.uid()
  )
);

create policy "question_targets_mentor" on question_targets for select using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);

create policy "answers_mentor_write" on answers for all using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);
create policy "answers_student_select" on answers for select using (
  question_id in (select id from questions where student_id = auth.uid())
);

-- TODO(Phase 4): replace with a view that hides `amount` from coordinators.
create policy "answer_rewards_owner" on answer_rewards for select using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);

create policy "question_credit_purchases_owner" on question_credit_purchases for all using (
  student_id = auth.uid() or is_admin()
);

-- TODO(Phase 3): settlement amounts must stay invisible to coordinators —
-- enforce via a dedicated view/RPC that exposes counts only.
create policy "mentor_settlements_owner" on mentor_settlements for select using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid()) or is_admin()
);
create policy "mentor_settlements_admin_write" on mentor_settlements for all using (is_admin());

create policy "invoices_admin" on invoices for all using (is_admin());
create policy "invoices_coordinator_select" on invoices for select using (
  org_id in (select org_id from profiles where id = auth.uid())
);

create policy "operations_alerts_admin" on operations_alerts for all using (is_admin());

create policy "kakao_notifications_owner" on kakao_notifications for select using (
  user_id = auth.uid() or is_admin()
);
create policy "kakao_notifications_admin_write" on kakao_notifications for all using (is_admin());

-- =========================================================
-- New-user provisioning
--
-- The signup Server Action passes role/name/phone/org_id as
-- raw_user_meta_data on supabase.auth.signUp(). This trigger runs as
-- SECURITY DEFINER so it can create the profile row (and the
-- role-specific mentor_profiles/student_profiles row) regardless of
-- whether email confirmation is pending, sidestepping the RLS timing
-- issue of inserting from a not-yet-authenticated client session.
-- =========================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role user_role := coalesce(new.raw_user_meta_data ->> 'role', 'student')::user_role;
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
    insert into mentor_profiles (user_id) values (new.id);
  elsif new_role = 'student' then
    insert into student_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
