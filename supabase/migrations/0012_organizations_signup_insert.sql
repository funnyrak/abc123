-- Signup no longer asks for a pre-registered school/org code — coordinators
-- and students just type their org's name, and the signup Server Action
-- looks up an existing organizations row by name or inserts a new one
-- before auth.signUp() runs, i.e. with no session yet (anon role).
-- organizations rows hold no sensitive data (same reasoning as the
-- pre-existing public select policy), so a public insert policy is safe.
create policy "organizations_signup_insert" on organizations for insert with check (true);
