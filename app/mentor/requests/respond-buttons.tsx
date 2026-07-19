'use client'

import { useTransition } from 'react'
import { respondToCandidate } from '@/lib/matching/actions'

export function RespondButtons({ candidateId }: { candidateId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => respondToCandidate(candidateId, 'accepted'))}
        className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        일정 수락
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => respondToCandidate(candidateId, 'declined'))}
        className="rounded-md border border-neutral-300 px-4 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
      >
        거절
      </button>
    </div>
  )
}
