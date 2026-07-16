'use client'

import { useTransition } from 'react'
import { optInToQnaProject } from '@/lib/qna/subscription'

export function OptInButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => optInToQnaProject(projectId))}
      className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {isPending ? '처리 중...' : '참여하기'}
    </button>
  )
}
