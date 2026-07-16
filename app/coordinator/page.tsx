import { requireProfile } from '@/lib/auth/dal'
import { DashboardShell, PlaceholderCard } from '@/components/dashboard-shell'

export default async function CoordinatorDashboard() {
  const profile = await requireProfile('coordinator')

  return (
    <DashboardShell profile={profile} title="담당자 대시보드">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="멘토 검색"
          description="산업·직무·기업 조건으로 멘토를 검색합니다. (Phase 2)"
        />
        <PlaceholderCard
          title="섭외 요청"
          description="일정/방식/강사료/내용유형을 담아 요청을 등록합니다. (Phase 2)"
        />
        <PlaceholderCard
          title="수락한 멘토 중 선택"
          description="응답한 멘토 목록에서 최종 인원을 선택합니다. (Phase 2)"
        />
        <PlaceholderCard
          title="학생 참여 승인"
          description="학교 코드로 신청한 학생의 참여를 승인/반려합니다. (Phase 3)"
        />
        <PlaceholderCard
          title="참여 현황 대시보드"
          description="분야·직무·기업·개인별, 기간별 현황을 확인하고 CSV로 내려받습니다. (Phase 3)"
        />
        <PlaceholderCard
          title="Q&A 구독 신청"
          description="학교/기관 단위 질문 서비스 구독을 신청합니다. (Phase 4)"
        />
      </div>
    </DashboardShell>
  )
}
