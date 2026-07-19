'use client'

import { useState, useTransition } from 'react'
import { confirmSelection } from '@/lib/matching/actions'

type Candidate = {
  id: string
  status: string
  statusLabel: string
  mentor: {
    company: string
    position: string
    industry: string[] | null
    job_function: string[] | null
    display_name: string | null
  }
}

export function CandidateSelector({
  matchRequestId,
  candidates,
  disabled,
}: {
  matchRequestId: string
  candidates: Candidate[]
  disabled: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    startTransition(() => {
      confirmSelection(matchRequestId, Array.from(selected))
    })
  }

  if (candidates.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500">조건에 맞는 멘토가 없어 아직 전달된 요청이 없습니다.</p>
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {candidates.map((c) => (
        <label
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3"
        >
          <div className="flex items-center gap-3">
            {!disabled && c.status === 'accepted' && (
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="h-4 w-4"
              />
            )}
            <div>
              <p className="text-sm font-medium text-neutral-900">{c.mentor?.display_name ?? '이름 미등록'}</p>
              <p className="text-xs text-neutral-500">
                {c.mentor?.company} · {c.mentor?.position}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            {c.statusLabel}
          </span>
        </label>
      ))}

      {!disabled && (
        <button
          type="button"
          disabled={selected.size === 0 || isPending}
          onClick={handleConfirm}
          className="mt-3 self-start rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? '확정 중...' : `선택한 ${selected.size}명으로 확정`}
        </button>
      )}
    </div>
  )
}
