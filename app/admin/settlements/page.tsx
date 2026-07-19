import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

const STATUS_LABEL: Record<string, string> = {
  pending: '정산대기',
  available: '정산가능',
  paid: '정산완료',
}

export default async function AdminSettlementsPage() {
  const profile = await requireProfile('admin')
  const supabase = await createClient()

  const { data: settlements } = await supabase
    .from('mentor_settlements')
    .select(
      'id, session_count, total_amount, status, projects(id, project_code), mentor_profiles(display_name)'
    )
    .order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="멘토 정산 관리">
      <div className="flex flex-col gap-2">
        {(settlements ?? []).map((s) => {
          const project = s.projects as unknown as { id: string; project_code: string } | null
          const mentorName = (s.mentor_profiles as unknown as { display_name: string | null } | null)
            ?.display_name
          return (
            <Link
              key={s.id}
              href={project ? `/projects/${project.id}` : '#'}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{mentorName ?? '이름 미등록'}</p>
                <code className="text-xs text-neutral-400">{project?.project_code}</code>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-700">
                  {s.session_count}회 · {Number(s.total_amount).toLocaleString()}원
                </p>
                <span className="text-xs text-neutral-500">{STATUS_LABEL[s.status] ?? s.status}</span>
              </div>
            </Link>
          )
        })}
        {(!settlements || settlements.length === 0) && (
          <p className="text-sm text-neutral-500">산정된 정산이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
