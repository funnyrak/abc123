import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { subscribeToQna } from '@/lib/qna/subscription'

export default async function CoordinatorQnaPage() {
  const profile = await requireProfile('coordinator')
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('qna_subscription_status')
    .eq('id', profile.org_id)
    .single()

  const { data: project } = await supabase
    .from('projects')
    .select('id, project_code')
    .eq('org_id', profile.org_id)
    .eq('type', 'qna_subscription')
    .maybeSingle()

  const { count: mentorCount } = project
    ? await supabase
        .from('project_members')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('role_in_project', 'mentor')
    : { count: 0 }

  const { count: questionCount } = project
    ? await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
    : { count: 0 }

  const isActive = org?.qna_subscription_status === 'active'

  return (
    <DashboardShell profile={profile} title="Q&A 구독 관리">
      <div className="max-w-xl rounded-lg border border-neutral-200 bg-white p-5">
        {isActive ? (
          <>
            <p className="text-sm font-semibold text-neutral-900">구독 중</p>
            <p className="mt-1 text-sm text-neutral-500">
              소속 학생들이 무제한으로 멘토에게 질문할 수 있습니다.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-neutral-600">
              <dt className="text-neutral-400">참여 멘토 수</dt>
              <dd>{mentorCount ?? 0}명</dd>
              <dt className="text-neutral-400">누적 질문 건수</dt>
              <dd>{questionCount ?? 0}건</dd>
            </dl>
            <p className="mt-3 text-xs text-neutral-400">
              금액 정보(정산·보상)는 멘토와 운영기관만 확인할 수 있습니다.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-900">아직 구독하지 않았습니다</p>
            <p className="mt-1 text-sm text-neutral-500">
              구독하면 소속 학생들이 멘토에게 자유롭게 질문할 수 있습니다. 멘토들은 참여 여부를
              개별적으로 확인해야 질문을 받습니다.
            </p>
            <form action={subscribeToQna}>
              <button className="mt-3 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                Q&amp;A 구독 신청
              </button>
            </form>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
