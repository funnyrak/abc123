import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { ReviewButtons } from './review-buttons'

export default async function AdminMentorsPage() {
  const profile = await requireProfile('admin')
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('verification_documents')
    .select(
      'id, file_url, status, created_at, mentor_profiles(id, company, position, user_id, display_name)'
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (d) => {
      const { data } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(d.file_url, 60 * 10)
      return { ...d, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <DashboardShell profile={profile} title="멘토 승인 · 재직 인증 검토">
      <div className="flex max-w-2xl flex-col gap-3">
        {documentsWithUrls.map((d) => {
          const mentor = d.mentor_profiles as unknown as {
            id: string
            company: string | null
            position: string | null
            user_id: string
            display_name: string | null
          }
          return (
            <div key={d.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-sm font-medium text-neutral-900">
                {mentor.display_name ?? '이름 미등록'}{' '}
                <span className="text-xs text-neutral-400">
                  {mentor.company} · {mentor.position}
                </span>
              </p>
              {d.signedUrl && (
                <a
                  href={d.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-neutral-600 underline"
                >
                  제출 서류 보기
                </a>
              )}
              <ReviewButtons
                documentId={d.id}
                mentorId={mentor.id}
                mentorUserId={mentor.user_id}
              />
            </div>
          )
        })}
        {documentsWithUrls.length === 0 && (
          <p className="text-sm text-neutral-500">검토 대기 중인 서류가 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
