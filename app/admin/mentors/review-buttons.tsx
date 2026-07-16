'use client'

import { useTransition } from 'react'
import { reviewVerificationDocument } from '@/lib/admin/mentors'

export function ReviewButtons({
  documentId,
  mentorId,
  mentorUserId,
}: {
  documentId: string
  mentorId: string
  mentorUserId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            reviewVerificationDocument(documentId, mentorId, mentorUserId, 'approved')
          )
        }
        className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        승인
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            reviewVerificationDocument(documentId, mentorId, mentorUserId, 'rejected')
          )
        }
        className="rounded-md border border-neutral-300 px-4 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
      >
        반려
      </button>
    </div>
  )
}
