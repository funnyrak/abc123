'use client'

import { useTransition } from 'react'
import { purchaseCredits } from '@/lib/qna/credits'

export function PurchaseCreditsButton({ subtle }: { subtle?: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => purchaseCredits())}
      className={
        subtle
          ? 'mt-2 text-xs text-neutral-500 underline disabled:opacity-50'
          : 'mt-3 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
      }
    >
      {isPending ? '처리 중...' : subtle ? '크레딧 5건 구매 (1만원)' : '크레딧 5건 구매 (1만원)'}
    </button>
  )
}
