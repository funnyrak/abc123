import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { CandidateSelector } from './candidate-selector'

const STATUS_LABEL: Record<string, string> = {
  recruiting: '모집 중',
  mentor_selected: '선택 완료',
  confirmed: '확정됨',
  cancelled: '취소됨',
}

const CANDIDATE_STATUS_LABEL: Record<string, string> = {
  invited: '응답 대기',
  accepted: '수락함',
  declined: '거절함',
  selected: '선택됨',
  not_selected: '미선택',
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile('coordinator')
  const { id } = await params
  const supabase = await createClient()

  const { data: request } = await supabase
    .from('match_requests')
    .select('*')
    .eq('id', id)
    .eq('requested_by', profile.id)
    .single()

  if (!request) notFound()

  const { data: candidates } = await supabase
    .from('match_candidates')
    .select('id, status, mentor_profiles(id, company, position, industry, job_function, display_name)')
    .eq('match_request_id', id)

  const { data: project } = await supabase
    .from('projects')
    .select('id, project_code, scale_tier')
    .eq('match_request_id', id)
    .maybeSingle()

  return (
    <DashboardShell profile={profile} title="섭외 요청 상세">
      <div className="max-w-2xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">
              {request.industry} {request.job_function ? `· ${request.job_function}` : ''}
            </p>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {STATUS_LABEL[request.status] ?? request.status}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-neutral-600">
            <dt className="text-neutral-400">희망 일정</dt>
            <dd>{request.requested_schedule}</dd>
            <dt className="text-neutral-400">진행 방식</dt>
            <dd>{request.format === 'online' ? '온라인' : '오프라인'}</dd>
            <dt className="text-neutral-400">제안 강사료</dt>
            <dd>{Number(request.proposed_fee).toLocaleString()}원</dd>
            <dt className="text-neutral-400">내용 유형</dt>
            <dd>{request.content_type}</dd>
          </dl>
        </div>

        {project && (
          <p className="mt-4 rounded-md bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
            확정된 프로젝트: <code className="text-xs">{project.project_code}</code> (
            {project.scale_tier === 'managed' ? '10명 이상 · 로스터 페이지 대상' : '1~2명'}) —{' '}
            <Link href={`/projects/${project.id}`} className="underline">
              프로젝트 룸 바로가기
            </Link>
          </p>
        )}

        <h2 className="mt-6 text-sm font-semibold text-neutral-900">응답 현황</h2>
        <CandidateSelector
          matchRequestId={id}
          candidates={(candidates ?? []).map((c) => ({
            id: c.id,
            status: c.status,
            statusLabel: CANDIDATE_STATUS_LABEL[c.status] ?? c.status,
            mentor: c.mentor_profiles as unknown as {
              company: string
              position: string
              industry: string
              job_function: string
              display_name: string | null
            },
          }))}
          disabled={request.status !== 'recruiting'}
        />
      </div>
    </DashboardShell>
  )
}
