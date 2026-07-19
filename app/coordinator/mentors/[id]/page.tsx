import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { MentorProfileBody } from '@/components/mentor-card'

export default async function MentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile('coordinator')
  const { id } = await params
  const supabase = await createClient()

  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('*')
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

  return (
    <DashboardShell profile={profile} title={`${mentor.display_name ?? '이름 미등록'} 멘토`}>
      <div className="max-w-2xl">
        <MentorProfileBody
          mentor={mentor}
          careers={careers ?? []}
          educations={educations ?? []}
          showClaimNotice
        />

        <Link
          href={`/coordinator/requests/new?industry=${encodeURIComponent(mentor.industry?.[0] ?? '')}&jobFunction=${encodeURIComponent(mentor.job_function?.[0] ?? '')}`}
          className="mt-6 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          이 조건으로 섭외 요청 만들기
        </Link>
      </div>
    </DashboardShell>
  )
}
