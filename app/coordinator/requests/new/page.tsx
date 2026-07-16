import { requireProfile } from '@/lib/auth/dal'
import { DashboardShell } from '@/components/dashboard-shell'
import { NewRequestForm } from './new-request-form'

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; jobFunction?: string }>
}) {
  const profile = await requireProfile('coordinator')
  const params = await searchParams

  return (
    <DashboardShell profile={profile} title="섭외 요청 등록">
      <p className="mb-6 max-w-xl text-sm text-neutral-500">
        조건에 맞는 멘토 다수에게 요청이 동시에 전달됩니다. 응답한 멘토 중에서 최종 인원을 선택하게 됩니다.
      </p>
      <NewRequestForm defaultIndustry={params.industry} defaultJobFunction={params.jobFunction} />
    </DashboardShell>
  )
}
