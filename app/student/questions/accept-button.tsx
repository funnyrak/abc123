'use client'

import { useTransition } from 'react'
import { acceptAnswer } from '@/lib/qna/actions'

export function AcceptButton({ answerId }: { answerId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => acceptAnswer(answerId))}
      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700 disabled:opacity-50"
    >
      이 답변 채택
    </button>
  )
}
