import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { VerificationUploader } from './verification-uploader'

const STATUS_LABEL: Record<string, string> = {
  pending: '심사 중',
  approved: '승인됨',
  rejected: '반려됨',
}

export default async function MentorVerificationPage() {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id, status')
    .eq('user_id', profile.id)
    .single()

  const { data: documents } = await supabase
    .from('verification_documents')
    .select('id, status, created_at, reviewed_at')
    .eq('mentor_id', mentorProfile?.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="재직 인증">
      <div className="max-w-lg">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          현재 상태: {STATUS_LABEL[mentorProfile?.status ?? 'pending']}
        </p>
        <p className="mb-4 text-sm text-neutral-500">
          정부24에서 발급받은 건강보험자격득실확인서를 업로드해주세요. 관리자 검토 후 결과를 카카오
          알림톡으로 안내해드립니다.
        </p>
        <VerificationUploader mentorProfileId={mentorProfile?.id ?? ''} />

        <h2 className="mt-8 text-sm font-semibold text-neutral-900">제출 이력</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {(documents ?? []).map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 text-sm"
            >
              <span className="text-neutral-600">
                {new Date(d.created_at).toLocaleDateString('ko-KR')} 제출
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                {STATUS_LABEL[d.status]}
              </span>
            </li>
          ))}
          {(!documents || documents.length === 0) && (
            <li className="text-sm text-neutral-400">제출한 서류가 없습니다.</li>
          )}
        </ul>
      </div>
    </DashboardShell>
  )
}
