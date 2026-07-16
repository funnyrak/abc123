import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell, LinkCard } from '@/components/dashboard-shell'
import { getEligibility } from '@/lib/qna/eligibility'
import { PurchaseCreditsButton } from './purchase-credits-button'

const ELIGIBILITY_LABEL: Record<string, string> = {
  subscription: '학교 구독 중 · 무제한 이용 가능',
  free: '무료 질문 이용 가능',
  credit: '구매 크레딧 이용 가능',
  none: '이용 가능한 질문이 없습니다',
}

export default async function StudentDashboard() {
  const profile = await requireProfile('student')
  const supabase = await createClient()
  const eligibility = await getEligibility(supabase, profile)

  return (
    <DashboardShell profile={profile} title="학생 대시보드">
      <div className="mb-6 max-w-md rounded-lg border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold text-neutral-900">{ELIGIBILITY_LABEL[eligibility.method]}</p>
        {'remaining' in eligibility && (
          <p className="mt-1 text-sm text-neutral-500">남은 횟수: {eligibility.remaining}건</p>
        )}
        {eligibility.method === 'none' && <PurchaseCreditsButton />}
        {eligibility.method === 'credit' && (
          <p className="mt-2 text-xs text-neutral-400">부족하면 아래에서 추가로 구매할 수 있습니다.</p>
        )}
        {(eligibility.method === 'credit' || eligibility.method === 'free') && <PurchaseCreditsButton subtle />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinkCard
          title="질문하기"
          description="멘토 개인에게 직접, 또는 산업/직무/기업 단위로 질문합니다."
          href="/student/ask"
        />
        <LinkCard
          title="내 질문·답변"
          description="본인이 작성한 질문과 그에 대한 답변만 조회합니다."
          href="/student/questions"
        />
      </div>
    </DashboardShell>
  )
}
