import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

const STATUS_LABEL: Record<string, string> = {
  confirmed: '확정됨',
  in_progress: '진행 중',
  completed: '완료됨',
  cancelled: '취소됨',
}

export default async function MyProjectsPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const query =
    profile.role === 'admin'
      ? supabase.from('projects').select('id, project_code, status, scale_tier, type')
      : supabase
          .from('projects')
          .select('id, project_code, status, scale_tier, type, project_members!inner(user_id)')
          .eq('project_members.user_id', profile.id)

  const { data: projects } = await query.order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="확정 프로젝트">
      <div className="flex flex-col gap-3">
        {(projects ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
          >
            <div>
              <code className="text-sm text-neutral-700">{p.project_code}</code>
              <p className="mt-1 text-xs text-neutral-400">
                {p.type === 'qna_subscription' ? 'Q&A 구독' : '멘토 추천'} ·{' '}
                {p.scale_tier === 'managed' ? '10명 이상' : '1~2명'}
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </Link>
        ))}
        {(!projects || projects.length === 0) && (
          <p className="text-sm text-neutral-500">확정된 프로젝트가 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
