import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

const STATUS_LABEL: Record<string, string> = {
  recruiting: '모집 중',
  mentor_selected: '선택 완료',
  confirmed: '확정됨',
  cancelled: '취소됨',
}

export default async function RequestsListPage() {
  const profile = await requireProfile('coordinator')
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('match_requests')
    .select('id, industry, job_function, requested_schedule, status, created_at')
    .eq('requested_by', profile.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="섭외 요청 현황">
      <Link
        href="/coordinator/requests/new"
        className="mb-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        + 새 섭외 요청
      </Link>

      <div className="flex flex-col gap-3">
        {(requests ?? []).map((r) => (
          <Link
            key={r.id}
            href={`/coordinator/requests/${r.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {r.industry} {r.job_function ? `· ${r.job_function}` : ''}
              </p>
              <p className="mt-1 text-sm text-neutral-500">{r.requested_schedule}</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          </Link>
        ))}
        {(!requests || requests.length === 0) && (
          <p className="text-sm text-neutral-500">등록된 섭외 요청이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
