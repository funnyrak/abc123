import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { OptInButton } from './opt-in-button'

export default async function MentorQnaProjectsPage() {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_code, organizations(name), project_members(user_id)')
    .eq('type', 'qna_subscription')
    .eq('status', 'confirmed')

  return (
    <DashboardShell profile={profile} title="질문 서비스 참여 프로젝트">
      <p className="mb-6 max-w-xl text-sm text-neutral-500">
        참여를 확인한 프로젝트에서만 학생 질문을 받고, 해당 학교 페이지에도 노출됩니다.
      </p>
      <div className="flex flex-col gap-3">
        {(projects ?? []).map((p) => {
          const org = p.organizations as unknown as { name: string } | null
          const members = (p.project_members as unknown as { user_id: string }[]) ?? []
          const joined = members.some((m) => m.user_id === profile.id)
          return (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{org?.name ?? '기관 미상'}</p>
                <code className="text-xs text-neutral-400">{p.project_code}</code>
              </div>
              {joined ? (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  참여 중
                </span>
              ) : (
                <OptInButton projectId={p.id} />
              )}
            </div>
          )
        })}
        {(!projects || projects.length === 0) && (
          <p className="text-sm text-neutral-500">등록된 Q&amp;A 구독 프로젝트가 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
