'use client'

import { useActionState, useState, useTransition } from 'react'
import { createQuestion, searchSimilarQuestions, type SimilarQuestion } from '@/lib/qna/actions'
import { QuestionFormState } from '@/lib/validation/question'
import type { Eligibility } from '@/lib/qna/eligibility'

type MentorOption = {
  id: string
  name: string
  company: string | null
  industry: string | null
  jobFunction: string | null
}

const ELIGIBILITY_LABEL: Record<string, string> = {
  subscription: '학교 구독 중 (무제한)',
  free: '무료 질문',
  credit: '구매 크레딧',
}

export function AskQuestionForm({
  mentorOptions,
  eligibility,
}: {
  mentorOptions: MentorOption[]
  eligibility: Eligibility
}) {
  const [state, action, pending] = useActionState<QuestionFormState, FormData>(
    createQuestion,
    undefined
  )
  const [scopeType, setScopeType] = useState<'individual' | 'industry' | 'job_function' | 'company'>(
    'individual'
  )
  const [content, setContent] = useState('')
  const [similar, setSimilar] = useState<SimilarQuestion[]>([])
  const [isSearching, startSearch] = useTransition()

  return (
    <div className="max-w-xl">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
        {ELIGIBILITY_LABEL[eligibility.method]}
        {'remaining' in eligibility ? ` · 남은 횟수 ${eligibility.remaining}` : ''}
      </p>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">질문 방식</span>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {(
              [
                ['individual', '멘토 직접'],
                ['industry', '산업'],
                ['job_function', '직무'],
                ['company', '기업'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-md border px-2 py-2 text-center ${
                  scopeType === value ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="scopeType"
                  value={value}
                  checked={scopeType === value}
                  onChange={() => setScopeType(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {scopeType === 'individual' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="scopeValue" className="text-sm font-medium text-neutral-700">
              멘토 선택
            </label>
            <select
              id="scopeValue"
              name="scopeValue"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {mentorOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.company}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="scopeValue" className="text-sm font-medium text-neutral-700">
              {scopeType === 'industry' ? '산업' : scopeType === 'job_function' ? '직무' : '기업'} 키워드
            </label>
            <input
              id="scopeValue"
              name="scopeValue"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        {state?.errors?.scopeValue && (
          <p className="-mt-2 text-sm text-red-600">{state.errors.scopeValue[0]}</p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="content" className="text-sm font-medium text-neutral-700">
            질문 내용
          </label>
          <textarea
            id="content"
            name="content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {state?.errors?.content && <p className="text-sm text-red-600">{state.errors.content[0]}</p>}
          <button
            type="button"
            disabled={isSearching || content.trim().length < 3}
            onClick={() =>
              startSearch(async () => setSimilar(await searchSimilarQuestions(content)))
            }
            className="mt-1 self-start text-xs text-neutral-500 underline disabled:opacity-50"
          >
            비슷한 질문의 답변 먼저 찾아보기
          </button>
        </div>

        {similar.length > 0 && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">비슷한 질문의 기존 답변</p>
            <ul className="mt-2 flex flex-col gap-3">
              {similar.map((q) => (
                <li key={q.id} className="text-sm">
                  <p className="font-medium text-neutral-800">Q. {q.content}</p>
                  {q.answers.map((a, i) => (
                    <p key={i} className="mt-1 text-neutral-600">
                      A. {a.content}{' '}
                      <span className="text-xs text-neutral-400">
                        — {a.mentor_profiles?.display_name ?? '멘토'}
                      </span>
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <button
          disabled={pending}
          type="submit"
          className="mt-2 self-start rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? '등록 중...' : '질문 등록'}
        </button>
      </form>
    </div>
  )
}
