import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function MentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile('coordinator')
  const { id } = await params
  const supabase = await createClient()

  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('*, profiles(name)')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!mentor) notFound()

  const { data: careers } = await supabase
    .from('mentor_careers')
    .select('*')
    .eq('mentor_id', id)
    .order('start_year', { ascending: false })

  const { data: educations } = await supabase.from('mentor_educations').select('*').eq('mentor_id', id)

  const name = (mentor.profiles as unknown as { name: string } | null)?.name ?? '이름 미등록'

  return (
    <DashboardShell profile={profile} title={`${name} 멘토`}>
      <div className="max-w-2xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">
            {mentor.company} · {mentor.position} {mentor.department ? `· ${mentor.department}` : ''}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {mentor.industry} · {mentor.job_function} {mentor.region ? `· ${mentor.region}` : ''}
          </p>
          {mentor.mentoring_fields?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {mentor.mentoring_fields.map((f: string) => (
                <span key={f} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                  {f}
                </span>
              ))}
            </div>
          )}
          {mentor.bio && <p className="mt-3 text-sm text-neutral-700">{mentor.bio}</p>}
        </div>

        <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900">주요 경력</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
            {(careers ?? []).map((c) => (
              <li key={c.id}>
                {c.start_year} – {c.end_year ?? '현재'} · {c.organization}
                {c.description ? ` (${c.description})` : ''}
              </li>
            ))}
            {(!careers || careers.length === 0) && <li className="text-neutral-400">등록된 경력이 없습니다.</li>}
          </ul>
        </div>

        <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900">출신 학교</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
            {(educations ?? []).map((e) => (
              <li key={e.id}>
                {e.degree_type} · {e.school_name} {e.major ? `(${e.major})` : ''}
              </li>
            ))}
            {(!educations || educations.length === 0) && (
              <li className="text-neutral-400">등록된 학력이 없습니다.</li>
            )}
          </ul>
        </div>

        <Link
          href={`/coordinator/requests/new?industry=${encodeURIComponent(mentor.industry ?? '')}&jobFunction=${encodeURIComponent(mentor.job_function ?? '')}`}
          className="mt-6 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          이 조건으로 섭외 요청 만들기
        </Link>
      </div>
    </DashboardShell>
  )
}
