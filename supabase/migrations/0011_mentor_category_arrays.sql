-- Mentor search/browse should filter on the same fixed category taxonomy
-- used at mentor registration (lib/constants/categories.ts), with support
-- for selecting multiple categories at once. Converts the previous
-- single-value free-text columns to arrays.
--
-- Seeded mentors (0009) all have industry/job_function = null, and no real
-- mentor has claimed + filled in a profile yet, so this is a safe in-place
-- type change with no data to migrate.

alter table mentor_profiles
  alter column industry type text[] using case when industry is null then null else array[industry] end;

alter table mentor_profiles
  alter column job_function type text[] using case when job_function is null then null else array[job_function] end;

create index mentor_profiles_industry_gin on mentor_profiles using gin (industry);
create index mentor_profiles_job_function_gin on mentor_profiles using gin (job_function);
