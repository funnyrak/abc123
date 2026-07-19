import { requireProfile } from '@/lib/auth/dal'
import { DashboardShell, LinkCard } from '@/components/dashboard-shell'

export default async function MentorDashboard() {
  const profile = await requireProfile('mentor')

  return (
    <DashboardShell profile={profile} title="멘토 대시보드">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinkCard
          title="프로필 관리"
          description="소속·경력·학력·직무·산업·멘토링 영역을 등록합니다."
          href="/mentor/profile"
        />
        <LinkCard
          title="섭외 요청함"
          description="받은 섭외 요청의 일정을 수락/거절합니다."
          href="/mentor/requests"
        />
        <LinkCard
          title="재직 인증"
          description="건강보험자격득실확인서를 업로드하고 승인 상태를 확인합니다."
          href="/mentor/verification"
        />
        <LinkCard
          title="확정 프로젝트"
          description="일정 등록, 참석 확인, 강의자료 공유, 정산 현황을 확인합니다."
          href="/projects"
        />
        <LinkCard
          title="질문 서비스 참여 프로젝트"
          description="학교/기관별 Q&A 참여 여부를 확인하고 참여를 신청합니다."
          href="/mentor/qna-projects"
        />
        <LinkCard
          title="질문함"
          description="1:1 질문과 산업/직무/기업 브로드캐스트 질문에 답변합니다."
          href="/mentor/questions"
        />
        <LinkCard
          title="질문 채택 보상"
          description="채택된 답변에 대한 보상 내역을 확인합니다."
          href="/mentor/rewards"
        />
      </div>
    </DashboardShell>
  )
}
