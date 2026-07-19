import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { AnswerForm } from './answer-form'

const SCOPE_LABEL: Record<string, string> = {
  individual: '멘토 직접',
  industry: '산업',
  job_function: '직무',
  company: '기업',
}

export default async function MentorQuestionsPage() {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  const { data: targets } = await supabase
    .from('question_targets')
    .select('id, responded_at, questions(id, scope_type, content, created_at)')
    .eq('mentor_id', mentorProfile?.id)
    .order('id', { ascending: false })

  const { data: myAnswers } = await supabase
    .from('answers')
    .select('question_id, content')
    .eq('mentor_id', mentorProfile?.id)

  const answeredIds = new Set((myAnswers ?? []).map((a) => a.question_id))

  return (
    <DashboardShell profile={profile} title="질문함">
      <div className="flex max-w-2xl flex-col gap-3">
        {(targets ?? []).map((t) => {
          const q = t.questions as unknown as {
            id: string
            scope_type: string
            content: string
            created_at: string
          }
          const answered = answeredIds.has(q.id)
          return (
            <div key={t.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">{SCOPE_LABEL[q.scope_type]}</span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  {answered ? '답변함' : '답변 대기'}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-neutral-900">{q.content}</p>
              {!answered && <AnswerForm questionId={q.id} />}
            </div>
          )
        })}
        {(!targets || targets.length === 0) && (
          <p className="text-sm text-neutral-500">받은 질문이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
