import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { MENTOR_LIST_SELECT, MentorCard } from '@/components/mentor-card'
import { INDUSTRY_OPTIONS, JOB_FUNCTION_OPTIONS } from '@/lib/constants/categories'
import { CategoryCheckboxFilter } from '@/components/category-checkbox-filter'
import { toArray } from '@/lib/utils/search-params'

export default async function MentorSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    industry?: string | string[]
    jobFunction?: string | string[]
    company?: string
    region?: string
  }>
}) {
  const profile = await requireProfile('coordinator')
  const params = await searchParams
  const industryValues = toArray(params.industry)
  const jobFunctionValues = toArray(params.jobFunction)
  const supabase = await createClient()

  let query = supabase.from('mentor_profiles').select(MENTOR_LIST_SELECT).eq('status', 'approved')

  if (industryValues.length > 0) query = query.overlaps('industry', industryValues)
  if (jobFunctionValues.length > 0) query = query.overlaps('job_function', jobFunctionValues)
  if (params.company) query = query.ilike('company', `%${params.company}%`)
  if (params.region) query = query.ilike('region', `%${params.region}%`)

  const { data: mentors } = await query.order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="멘토 검색">
      <form className="mb-6 flex flex-col gap-4">
        <CategoryCheckboxFilter label="산업 (중복 선택 가능)" name="industry" options={INDUSTRY_OPTIONS} selected={industryValues} />
        <CategoryCheckboxFilter
          label="직무 (중복 선택 가능)"
          name="jobFunction"
          options={JOB_FUNCTION_OPTIONS}
          selected={jobFunctionValues}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SearchField name="company" placeholder="기업" defaultValue={params.company} />
          <SearchField name="region" placeholder="지역" defaultValue={params.region} />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
        >
          검색
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(mentors ?? []).map((m) => (
          <MentorCard key={m.id} mentor={m} href={`/coordinator/mentors/${m.id}`} showClaimBadge />
        ))}
        {(!mentors || mentors.length === 0) && (
          <p className="text-sm text-neutral-500">조건에 맞는 멘토가 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}

function SearchField({
  name,
  placeholder,
  defaultValue,
}: {
  name: string
  placeholder: string
  defaultValue?: string
}) {
  return (
    <input
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
    />
  )
}
