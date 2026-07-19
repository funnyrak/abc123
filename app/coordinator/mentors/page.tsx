import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { MENTOR_LIST_SELECT, MentorCard } from '@/components/mentor-card'

export default async function MentorSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; jobFunction?: string; company?: string; region?: string }>
}) {
  const profile = await requireProfile('coordinator')
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('mentor_profiles').select(MENTOR_LIST_SELECT).eq('status', 'approved')

  if (params.industry) query = query.ilike('industry', `%${params.industry}%`)
  if (params.jobFunction) query = query.ilike('job_function', `%${params.jobFunction}%`)
  if (params.company) query = query.ilike('company', `%${params.company}%`)
  if (params.region) query = query.ilike('region', `%${params.region}%`)

  const { data: mentors } = await query.order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="멘토 검색">
      <form className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SearchField name="industry" placeholder="산업" defaultValue={params.industry} />
        <SearchField name="jobFunction" placeholder="직무" defaultValue={params.jobFunction} />
        <SearchField name="company" placeholder="기업" defaultValue={params.company} />
        <SearchField name="region" placeholder="지역" defaultValue={params.region} />
        <button
          type="submit"
          className="col-span-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white sm:col-span-4"
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
