-- Phase 4: mentors need to discover Q&A subscription projects they
-- haven't opted into yet (org name + project code only, nothing
-- sensitive), and to insert their own opt-in membership row.

create policy "projects_qna_discoverable" on projects for select using (
  type = 'qna_subscription' and status = 'confirmed'
);

create policy "project_members_mentor_opt_in" on project_members for insert with check (
  role_in_project = 'mentor'
  and user_id = auth.uid()
  and project_id in (select id from projects where type = 'qna_subscription' and status = 'confirmed')
);

-- Bugfix (Phase 2/3): confirmSelection() and subscribeToQna() insert
-- project_members rows from the coordinator's own session, but no
-- policy allowed that insert yet — every confirmed match silently
-- failed to create memberships, which made /projects/[id] 404 for
-- everyone. This covers both: the coordinator adding themselves to a
-- project in their own org, and the coordinator (as the original
-- match_requests.requested_by) adding the mentors they selected.
create policy "project_members_coordinator_insert" on project_members for insert with check (
  (
    role_in_project = 'coordinator'
    and user_id = auth.uid()
    and project_id in (select id from projects where org_id in (select org_id from profiles where id = auth.uid()))
  )
  or project_id in (
    select p.id from projects p
    join match_requests mr on mr.id = p.match_request_id
    where mr.requested_by = auth.uid()
  )
);

-- Same bug, the `projects` row itself: confirmSelection() and
-- subscribeToQna() insert into projects as the coordinator, and
-- cancelProject()/markProjectCompleted() update it — neither had a
-- non-admin policy.
create policy "projects_coordinator_insert" on projects for insert with check (
  org_id in (select org_id from profiles where id = auth.uid())
);

create policy "projects_member_update" on projects for update using (
  id in (select project_id from project_members where user_id = auth.uid())
) with check (
  id in (select project_id from project_members where user_id = auth.uid())
);

-- addSchedule()/cancelProject() let any project member (not just
-- mentors) write project_schedules; the original policy only covered
-- the mentor role.
create policy "project_schedules_coordinator_write" on project_schedules for all using (
  project_id in (select project_id from project_members where user_id = auth.uid() and role_in_project = 'coordinator')
) with check (
  project_id in (select project_id from project_members where user_id = auth.uid() and role_in_project = 'coordinator')
);

-- confirmSelection() inserts the Invoice as the coordinator.
create policy "invoices_coordinator_insert" on invoices for insert with check (
  org_id in (select org_id from profiles where id = auth.uid())
);

-- markProjectCompleted() can be run by a coordinator, and upserts
-- mentor_settlements — insert/update only, deliberately no select
-- policy here so coordinators still can't read settlement amounts
-- (docs/SPEC.md §6.5: amounts are mentor + admin only).
create policy "mentor_settlements_coordinator_insert" on mentor_settlements for insert with check (
  project_id in (select project_id from project_members where user_id = auth.uid() and role_in_project = 'coordinator')
);
create policy "mentor_settlements_coordinator_update" on mentor_settlements for update using (
  project_id in (select project_id from project_members where user_id = auth.uid() and role_in_project = 'coordinator')
);

-- queueKakaoNotification() is called from coordinator/mentor/student
-- sessions for other users (e.g. a coordinator queuing a mentor's
-- notification) — only admins could insert before. It's a write-only
-- queue (selects stay owner+admin only), so any authenticated caller
-- inserting is safe.
create policy "kakao_notifications_insert" on kakao_notifications for insert with check (
  auth.role() = 'authenticated'
);

-- createMatchRequest() inserts match_candidates rows (one per matching
-- mentor) and an operations_alerts row (when no mentor matches) from
-- the coordinator's session — both were admin-only before.
create policy "match_candidates_coordinator_insert" on match_candidates for insert with check (
  match_request_id in (select id from match_requests where requested_by = auth.uid())
);

create policy "operations_alerts_insert" on operations_alerts for insert with check (
  auth.role() = 'authenticated'
);
