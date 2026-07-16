'use client'

import { useRef, useTransition } from 'react'
import { addSchedule } from '@/lib/project/actions'

export function ScheduleForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await addSchedule(projectId, formData)
          formRef.current?.reset()
        })
      }
      className="mt-3 grid grid-cols-[80px_1fr_2fr_auto] items-center gap-2"
    >
      <input
        name="sessionNo"
        type="number"
        placeholder="회차"
        required
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />
      <input
        name="scheduledAt"
        type="datetime-local"
        required
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />
      <input
        name="topic"
        placeholder="주제 (선택)"
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />
      <button
        disabled={isPending}
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
      >
        추가
      </button>
    </form>
  )
}
