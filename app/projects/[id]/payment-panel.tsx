'use client'

import { useTransition } from 'react'
import { choosePaymentMethod, markInvoicePaid } from '@/lib/billing/actions'

type Invoice = {
  id: string
  amount: number
  status: string
  payment_method: string | null
} | null

type Settlement = {
  id: string
  session_count: number
  total_amount: number
  status: string
}

const INVOICE_STATUS_LABEL: Record<string, string> = { unpaid: '미결제', paid: '결제완료' }
const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  pending: '정산대기',
  available: '정산가능',
  paid: '정산완료',
}
const METHOD_LABEL: Record<string, string> = {
  card: '카드결제',
  bank_transfer: '계좌이체',
  project_contract: '프로젝트 계약',
}

export function PaymentPanel({
  projectId,
  isAdmin,
  invoice,
  settlements,
}: {
  projectId: string
  isAdmin: boolean
  invoice?: Invoice
  settlements: Settlement[] | null
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <section className="mt-6 flex flex-col gap-4">
      {invoice !== undefined && invoice !== null && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">결제 (기관 청구)</h2>
          <p className="mt-2 text-sm text-neutral-600">
            청구 금액: {Number(invoice.amount).toLocaleString()}원 (수수료 포함) ·{' '}
            {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
          </p>
          {invoice.payment_method ? (
            <p className="mt-1 text-sm text-neutral-500">결제 수단: {METHOD_LABEL[invoice.payment_method]}</p>
          ) : (
            <div className="mt-2 flex gap-2">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() => choosePaymentMethod(projectId, invoice.id, 'card'))
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                카드결제 선택
              </button>
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() => choosePaymentMethod(projectId, invoice.id, 'bank_transfer'))
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                계좌이체 선택
              </button>
            </div>
          )}
          {isAdmin && invoice.status === 'unpaid' && (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => markInvoicePaid(invoice.id, projectId))}
              className="mt-3 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              (관리자) 결제완료 처리
            </button>
          )}
        </div>
      )}

      {settlements !== null && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">정산 (멘토 지급)</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
            {settlements.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span>참여 {s.session_count}회 · {Number(s.total_amount).toLocaleString()}원</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                  {SETTLEMENT_STATUS_LABEL[s.status] ?? s.status}
                </span>
              </li>
            ))}
            {settlements.length === 0 && <li className="text-neutral-400">아직 산정된 정산이 없습니다.</li>}
          </ul>
        </div>
      )}
    </section>
  )
}
