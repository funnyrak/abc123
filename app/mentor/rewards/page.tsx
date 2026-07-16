import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

const STATUS_LABEL: Record<string, string> = { pending: '정산대기', paid: '정산완료' }

export default async function MentorRewardsPage() {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  const { data: rewards } = await supabase
    .from('answer_rewards')
    .select('id, amount, status, created_at, answers(content, questions(content))')
    .eq('mentor_id', mentorProfile?.id)
    .order('created_at', { ascending: false })

  const total = (rewards ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

  return (
    <DashboardShell profile={profile} title="질문 채택 보상">
      <p className="mb-4 text-sm text-neutral-600">누적 보상: {total.toLocaleString()}원</p>
      <div className="flex max-w-2xl flex-col gap-2">
        {(rewards ?? []).map((r) => {
          const answer = r.answers as unknown as { content: string; questions: { content: string } | null }
          return (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900">
                  {Number(r.amount).toLocaleString()}원
                </p>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">Q. {answer?.questions?.content}</p>
            </div>
          )
        })}
        {(!rewards || rewards.length === 0) && (
          <p className="text-sm text-neutral-500">채택된 답변이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
