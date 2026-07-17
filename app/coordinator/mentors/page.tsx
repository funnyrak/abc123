import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function MentorSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; jobFunction?: string; company?: string; region?: string }>
}) {
  const profile = await requireProfile('coordinator')
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('mentor_profiles')
    .select(
      'id, company, department, position, job_function, industry, mentoring_fields, region, claim_status, unclaimed_name, profiles(name)'
    )
    .eq('status', 'approved')

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
          <Link
            key={m.id}
            href={`/coordinator/mentors/${m.id}`}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              {(m.profiles as unknown as { name: string } | null)?.name ?? m.unclaimed_name ?? '이름 미등록'}
              {m.claim_status === 'unclaimed' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  가입 대기
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {m.company} · {m.position} {m.department ? `· ${m.department}` : ''}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {m.industry} · {m.job_function} {m.region ? `· ${m.region}` : ''}
            </p>
            {m.mentoring_fields && m.mentoring_fields.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {m.mentoring_fields.map((f: string) => (
                  <span key={f} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </Link>
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
