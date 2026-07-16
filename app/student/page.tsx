import { requireProfile } from '@/lib/auth/dal'
import { DashboardShell, PlaceholderCard } from '@/components/dashboard-shell'

export default async function StudentDashboard() {
  const profile = await requireProfile('student')

  return (
    <DashboardShell profile={profile} title="학생 대시보드">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="질문하기"
          description="멘토 개인에게 직접, 또는 산업/직무/기업 단위로 질문합니다. (Phase 4)"
        />
        <PlaceholderCard
          title="크레딧/구독 상태"
          description="무료 3건, 5건 1만원 크레딧, 학교 구독 상태를 확인합니다. (Phase 4)"
        />
        <PlaceholderCard
          title="내 질문·답변"
          description="본인이 작성한 질문과 그에 대한 답변만 조회합니다. (Phase 4)"
        />
      </div>
    </DashboardShell>
  )
}
