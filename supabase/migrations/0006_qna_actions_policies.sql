-- RLS policies needed by the Q&A action flow (createQuestion,
-- answerQuestion, acceptAnswer) that weren't covered by existing
-- owner-only policies, since these actions write rows on behalf of
-- other users (a student targeting a mentor, a mentor updating a
-- question owned by a student, etc).

-- createQuestion(): student inserts question_targets rows naming
-- mentors who are not themselves.
create policy "question_targets_student_insert" on question_targets for insert with check (
  question_id in (select id from questions where student_id = auth.uid())
);

-- answerQuestion(): mentor updates question_targets.responded_at.
create policy "question_targets_mentor_update" on question_targets for update using (
  mentor_id in (select id from mentor_profiles where user_id = auth.uid())
);

-- answerQuestion(): for individual-scope questions, the mentor (not
-- the student) flips questions.status to 'answered'.
create policy "questions_mentor_update" on questions for update using (
  id in (
    select qt.question_id from question_targets qt
    join mentor_profiles mp on mp.id = qt.mentor_id
    where mp.user_id = auth.uid()
  )
);

-- searchSimilarQuestions(): intentionally cross-student — answered
-- Q&A within the same org's Q&A project functions as a shared FAQ.
-- Open (unanswered) questions stay restricted to their author via the
-- existing questions_student policy.
create policy "questions_org_select_answered" on questions for select using (
  status = 'answered'
  and project_id in (select id from projects where org_id in (select org_id from profiles where id = auth.uid()))
);

-- acceptAnswer(): student updates an answer authored by a mentor.
create policy "answers_student_accept" on answers for update using (
  question_id in (select id from questions where student_id = auth.uid())
);

-- acceptAnswer(): student creates the reward row paid to the mentor.
create policy "answer_rewards_student_insert" on answer_rewards for insert with check (
  answer_id in (
    select a.id from answers a
    join questions q on q.id = a.question_id
    where q.student_id = auth.uid()
  )
);

-- Every screen that lists another user (coordinator searching mentors,
-- a student seeing who answered, a mentor seeing who requested a
-- match) embeds `profiles(name)` and was silently getting null back —
-- profiles.select was owner+admin only. Broadening to any
-- authenticated user is a deliberate MVP simplification: it also
-- exposes phone/email to any logged-in user via a direct table query,
-- which is fine for an internal small-team platform but should be
-- tightened later (e.g. a security-definer view exposing only
-- id/name/role) before this handles a larger, less-trusted user base.
create policy "profiles_authenticated_select" on profiles for select using (
  auth.role() = 'authenticated'
);
