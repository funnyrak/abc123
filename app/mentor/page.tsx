import { requireProfile } from '@/lib/auth/dal'
import { DashboardShell, PlaceholderCard } from '@/components/dashboard-shell'

export default async function MentorDashboard() {
  const profile = await requireProfile('mentor')

  return (
    <DashboardShell profile={profile} title="멘토 대시보드">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="프로필 관리"
          description="소속·경력·학력·직무·산업·멘토링 영역을 등록합니다. (Phase 2)"
        />
        <PlaceholderCard
          title="재직 인증"
          description="건강보험자격득실확인서를 업로드하고 승인 상태를 확인합니다. (Phase 5)"
        />
        <PlaceholderCard
          title="섭외 요청함"
          description="받은 섭외 요청의 일정을 수락/거절합니다. (Phase 2)"
        />
        <PlaceholderCard
          title="확정 프로젝트"
          description="일정, 진행 기록, 강의자료를 확인합니다. (Phase 3)"
        />
        <PlaceholderCard
          title="질문함"
          description="1:1 질문과 산업/직무/기업 브로드캐스트 질문에 답변합니다. (Phase 4)"
        />
        <PlaceholderCard
          title="참여·정산 내역"
          description="참여 횟수, 정산 예정 금액, 질문 채택 보상을 확인합니다. (Phase 3~4)"
        />
      </div>
    </DashboardShell>
  )
}
