import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { getEligibility } from '@/lib/qna/eligibility'
import { AskQuestionForm } from './ask-question-form'

export default async function AskQuestionPage() {
  const profile = await requireProfile('student')
  const supabase = await createClient()

  const eligibility = await getEligibility(supabase, profile)

  const { data: qnaProject } = profile.org_id
    ? await supabase
        .from('projects')
        .select('id')
        .eq('org_id', profile.org_id)
        .eq('type', 'qna_subscription')
        .eq('status', 'confirmed')
        .maybeSingle()
    : { data: null }

  const { data: mentors } = qnaProject
    ? await supabase
        .from('project_members')
        .select('mentor_profiles!inner(id, company, industry, job_function, display_name)')
        .eq('project_id', qnaProject.id)
        .eq('role_in_project', 'mentor')
    : { data: [] }

  const mentorOptions = (mentors ?? []).map((m) => {
    const mp = m.mentor_profiles as unknown as {
      id: string
      company: string | null
      industry: string[] | null
      job_function: string[] | null
      display_name: string | null
    }
    return {
      id: mp.id,
      name: mp.display_name ?? '이름 미등록',
      company: mp.company,
      industry: mp.industry,
      jobFunction: mp.job_function,
    }
  })

  return (
    <DashboardShell profile={profile} title="질문하기">
      {!qnaProject ? (
        <p className="text-sm text-neutral-500">
          소속 학교가 Q&amp;A 서비스를 구독하고 있지 않습니다. 담당자에게 문의해주세요.
        </p>
      ) : eligibility.method === 'none' ? (
        <p className="max-w-md text-sm text-neutral-600">
          무료 질문과 크레딧을 모두 사용했습니다. 대시보드에서 크레딧을 구매해주세요.
        </p>
      ) : (
        <AskQuestionForm mentorOptions={mentorOptions} eligibility={eligibility} />
      )}
    </DashboardShell>
  )
}
