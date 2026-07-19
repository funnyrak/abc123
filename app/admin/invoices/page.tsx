import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

const STATUS_LABEL: Record<string, string> = { unpaid: '미결제', paid: '결제완료' }
const METHOD_LABEL: Record<string, string> = {
  card: '카드결제',
  bank_transfer: '계좌이체',
  project_contract: '프로젝트 계약',
}

export default async function AdminInvoicesPage() {
  const profile = await requireProfile('admin')
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, payment_type, payment_method, projects(id, project_code)')
    .order('invoiced_at', { ascending: false })

  return (
    <DashboardShell profile={profile} title="결제(Invoice) 관리">
      <div className="flex flex-col gap-2">
        {(invoices ?? []).map((inv) => {
          const project = inv.projects as unknown as { id: string; project_code: string } | null
          return (
            <Link
              key={inv.id}
              href={project ? `/projects/${project.id}` : '#'}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
            >
              <div>
                <code className="text-sm text-neutral-700">{project?.project_code}</code>
                <p className="mt-1 text-xs text-neutral-400">
                  {inv.payment_type === 'prepaid' ? '선결제' : '후결제'} ·{' '}
                  {inv.payment_method ? METHOD_LABEL[inv.payment_method] : '수단 미선택'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">
                  {Number(inv.amount).toLocaleString()}원
                </p>
                <span className="text-xs text-neutral-500">{STATUS_LABEL[inv.status] ?? inv.status}</span>
              </div>
            </Link>
          )
        })}
        {(!invoices || invoices.length === 0) && (
          <p className="text-sm text-neutral-500">등록된 결제 건이 없습니다.</p>
        )}
      </div>
    </DashboardShell>
  )
}
