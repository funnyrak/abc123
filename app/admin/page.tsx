import { requireProfile } from '@/lib/auth/dal'
import { DashboardShell, PlaceholderCard } from '@/components/dashboard-shell'

export default async function AdminDashboard() {
  const profile = await requireProfile('admin')

  return (
    <DashboardShell profile={profile} title="관리자 대시보드">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="멘토 승인 · 재직 인증 검토"
          description="신규 멘토 프로필과 재직 인증 서류를 검토합니다. (Phase 5)"
        />
        <PlaceholderCard
          title="학교 코드 · 구독 관리"
          description="학교/기관 코드를 발급하고 Q&A 구독 상태를 관리합니다. (Phase 3)"
        />
        <PlaceholderCard
          title="정산 · 결제 관리"
          description="멘토 정산, 질문 채택 보상, 기관 결제(Invoice)를 관리합니다. (Phase 3~4)"
        />
        <PlaceholderCard
          title="운영 관제 대시보드"
          description="섭외 접수 현황, 경고, 스케줄, 결제 현황, 질문 지체를 실시간으로 확인합니다. (Phase 5)"
        />
      </div>
    </DashboardShell>
  )
}
