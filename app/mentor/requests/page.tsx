import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { RespondButtons } from './respond-buttons'

const STATUS_LABEL: Record<string, string> = {
  invited: '응답 대기',
  accepted: '수락함',
  declined: '거절함',
  selected: '선택됨 · 확정',
  not_selected: '미선택',
}

export default async function MentorRequestsPage() {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  const { data: candidates } = await supabase
    .from('match_candidates')
    .select('id, status, match_requests(industry, job_function, requested_schedule, format, proposed_fee, content_type)')
    .eq('mentor_id', mentorProfile?.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="섭외 요청함">
      <div className="flex max-w-2xl flex-col gap-3">
        {(candidates ?? []).map((c) => {
          const req = c.match_requests as unknown as {
            industry: string
            job_function: string | null
            requested_schedule: string
            format: string
            proposed_fee: number
            content_type: string
          }
          return (
            <div key={c.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">
                  {req.industry} {req.job_function ? `· ${req.job_function}` : ''}
                </p>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-sm text-neutral-600">
                <dt className="text-neutral-400">희망 일정</dt>
                <dd>{req.requested_schedule}</dd>
                <dt className="text-neutral-400">진행 방식</dt>
                <dd>{req.format === 'online' ? '온라인' : '오프라인'}</dd>
                <dt className="text-neutral-400">제안 강사료</dt>
                <dd>{Number(req.proposed_fee).toLocaleString()}원</dd>
                <dt className="text-neutral-400">내용 유형</dt>
                <dd>{req.content_type}</dd>
              </dl>
              {c.status === 'invited' && <RespondButtons candidateId={c.id} />}
            </div>
          )
        })}
        {(!candidates || candidates.length === 0) && (
          <p className="text-sm text-neutral-500">받은 섭외 요청이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
