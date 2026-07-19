import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MENTOR_LIST_SELECT, MentorCard } from '@/components/mentor-card'

export const metadata = {
  title: '멘토 풀 둘러보기 | 멘토링 매칭 & 질문 플랫폼',
}

export default async function PublicMentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; jobFunction?: string; company?: string; region?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('mentor_profiles').select(MENTOR_LIST_SELECT).eq('status', 'approved')

  if (params.industry) query = query.ilike('industry', `%${params.industry}%`)
  if (params.jobFunction) query = query.ilike('job_function', `%${params.jobFunction}%`)
  if (params.company) query = query.ilike('company', `%${params.company}%`)
  if (params.region) query = query.ilike('region', `%${params.region}%`)

  const { data: mentors } = await query.order('created_at', { ascending: false }).limit(60)

  const { count: totalCount } = await supabase
    .from('mentor_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-neutral-900">
            멘토링 매칭 &amp; 질문 플랫폼
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-neutral-600">
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">멘토 풀</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          현재 {totalCount ?? 0}명의 멘토가 함께하고 있습니다
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          섭외를 원하시면 담당자 계정으로 가입 후 조건에 맞는 멘토에게 요청을 보낼 수 있습니다.
        </p>

        <form className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(mentors ?? []).map((m) => (
            <MentorCard key={m.id} mentor={m} href={`/mentors/${m.id}`} />
          ))}
          {(!mentors || mentors.length === 0) && (
            <p className="text-sm text-neutral-500">조건에 맞는 멘토가 없습니다.</p>
          )}
        </div>
        {mentors && mentors.length === 60 && (
          <p className="mt-4 text-xs text-neutral-400">
            60명까지만 표시됩니다. 조건을 좁혀서 검색해보세요.
          </p>
        )}
      </main>
    </div>
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
      className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
    />
  )
}
