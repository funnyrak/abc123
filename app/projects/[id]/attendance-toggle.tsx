'use client'

import { useTransition } from 'react'
import { markAttendance } from '@/lib/project/actions'

export function AttendanceToggle({ projectId, scheduleId }: { projectId: string; scheduleId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => markAttendance(projectId, scheduleId, true))}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:opacity-50"
      >
        참석 확인
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => markAttendance(projectId, scheduleId, false))}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:opacity-50"
      >
        불참 처리
      </button>
    </div>
  )
}
