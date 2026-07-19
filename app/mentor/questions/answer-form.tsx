'use client'

import { useRef, useTransition } from 'react'
import { answerQuestion } from '@/lib/qna/actions'

export function AnswerForm({ questionId }: { questionId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await answerQuestion(questionId, formData)
          formRef.current?.reset()
        })
      }
      className="mt-3 flex flex-col gap-2"
    >
      <textarea
        name="content"
        rows={3}
        placeholder="답변을 입력하세요"
        required
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        disabled={isPending}
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? '전송 중...' : '답변 등록'}
      </button>
    </form>
  )
}
