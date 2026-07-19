'use client'

import { useTransition } from 'react'
import { toggleQnaSubscription } from '@/lib/admin/organizations'

export function SubscriptionToggle({ orgId, active }: { orgId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleQnaSubscription(orgId, !active))}
      className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
        active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      Q&amp;A 구독 {active ? '중' : '안 함'}
    </button>
  )
}
