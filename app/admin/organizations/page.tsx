import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { OrganizationForm } from './organization-form'
import { SubscriptionToggle } from './subscription-toggle'

export default async function AdminOrganizationsPage() {
  const profile = await requireProfile('admin')
  const supabase = await createClient()

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, type, org_code, qna_subscription_status')
    .order('name', { ascending: true })

  return (
    <DashboardShell profile={profile} title="학교/기관 코드 관리">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-2">
          {(organizations ?? []).map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {org.name} <span className="text-xs text-neutral-400">({org.type})</span>
                </p>
                <code className="text-xs text-neutral-500">{org.org_code}</code>
              </div>
              <SubscriptionToggle orgId={org.id} active={org.qna_subscription_status === 'active'} />
            </div>
          ))}
          {(!organizations || organizations.length === 0) && (
            <p className="text-sm text-neutral-500">등록된 학교/기관이 없습니다.</p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">새 학교/기관 추가</h2>
          <OrganizationForm />
        </div>
      </div>
    </DashboardShell>
  )
}
