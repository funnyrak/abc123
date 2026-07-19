import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { AcceptButton } from './accept-button'

const SCOPE_LABEL: Record<string, string> = {
  individual: '멘토 직접',
  industry: '산업',
  job_function: '직무',
  company: '기업',
}

export default async function StudentQuestionsPage() {
  const profile = await requireProfile('student')
  const supabase = await createClient()

  const { data: questions } = await supabase
    .from('questions')
    .select(
      'id, scope_type, scope_value, content, status, created_at, answers(id, content, is_accepted, mentor_profiles(display_name))'
    )
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="내 질문 · 답변">
      <Link
        href="/student/ask"
        className="mb-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        + 질문하기
      </Link>

      <div className="flex flex-col gap-3">
        {(questions ?? []).map((q) => {
          const answers = (q.answers ?? []) as unknown as {
            id: string
            content: string
            is_accepted: boolean
            mentor_profiles: { display_name: string | null } | null
          }[]
          const hasAccepted = answers.some((a) => a.is_accepted)
          return (
            <div key={q.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">{SCOPE_LABEL[q.scope_type]}</span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  {q.status === 'answered' ? '답변완료' : '답변대기'}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-neutral-900">Q. {q.content}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {answers.map((a) => (
                  <li key={a.id} className="rounded-md bg-neutral-50 p-2 text-sm">
                    <p className="text-neutral-700">
                      A. {a.content}{' '}
                      <span className="text-xs text-neutral-400">
                        — {a.mentor_profiles?.display_name ?? '멘토'}
                      </span>
                    </p>
                    {q.scope_type !== 'individual' && (
                      <div className="mt-1">
                        {a.is_accepted ? (
                          <span className="text-xs font-medium text-neutral-900">채택된 답변</span>
                        ) : (
                          !hasAccepted && <AcceptButton answerId={a.id} />
                        )}
                      </div>
                    )}
                  </li>
                ))}
                {answers.length === 0 && (
                  <li className="text-sm text-neutral-400">아직 답변이 없습니다.</li>
                )}
              </ul>
            </div>
          )
        })}
        {(!questions || questions.length === 0) && (
          <p className="text-sm text-neutral-500">등록한 질문이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
