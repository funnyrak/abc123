import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { CopyLinkButton } from './copy-link-button'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function UnclaimedMentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const profile = await requireProfile('admin')
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('mentor_profiles')
    .select('id, unclaimed_name, company, claim_token')
    .eq('claim_status', 'unclaimed')

  if (q) {
    query = query.or(`unclaimed_name.ilike.%${q}%,company.ilike.%${q}%`)
  }

  const { data: mentors } = await query.order('unclaimed_name', { ascending: true }).limit(100)

  const { count: totalUnclaimed } = await supabase
    .from('mentor_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('claim_status', 'unclaimed')

  const { count: totalClaimed } = await supabase
    .from('mentor_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('claim_status', 'claimed')

  return (
    <DashboardShell profile={profile} title="가입 대기 멘토 (초대 링크)">
      <p className="mb-4 text-sm text-neutral-500">
        가입 대기 {totalUnclaimed ?? 0}명 · 가입 완료 {totalClaimed ?? 0}명. 아래 링크를 해당 멘토에게
        직접 전달하면, 그 링크로 가입할 때 자동으로 본인 프로필과 연결됩니다.
      </p>

      <form className="mb-4">
        <input
          name="q"
          placeholder="이름 또는 회사로 검색"
          defaultValue={q}
          className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </form>

      <div className="flex flex-col gap-2">
        {(mentors ?? []).map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{m.unclaimed_name}</p>
              <p className="text-xs text-neutral-400">{m.company}</p>
            </div>
            <CopyLinkButton url={`${SITE_URL}/signup?claim=${m.claim_token}`} />
          </div>
        ))}
        {(!mentors || mentors.length === 0) && (
          <p className="text-sm text-neutral-500">검색 결과가 없습니다.</p>
        )}
        {mentors && mentors.length === 100 && (
          <p className="text-xs text-neutral-400">100건까지만 표시됩니다. 이름으로 검색해 좁혀보세요.</p>
        )}
      </div>
    </DashboardShell>
  )
}
