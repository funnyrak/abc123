'use client'

import { useTransition } from 'react'
import { cancelProject } from '@/lib/project/actions'

export function CancelButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm('프로젝트를 취소하시겠습니까? 취소 시점에 따라 위약금이 발생할 수 있습니다.')) return
        startTransition(() => cancelProject(projectId))
      }}
      className="rounded-md border border-red-300 px-4 py-1.5 text-sm text-red-600 disabled:opacity-50"
    >
      {isPending ? '취소 처리 중...' : '프로젝트 취소'}
    </button>
  )
}
