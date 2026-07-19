'use client'

import { useActionState } from 'react'
import { createMatchRequest } from '@/lib/matching/actions'
import { MatchRequestFormState } from '@/lib/validation/match-request'
import { INDUSTRY_OPTIONS, JOB_FUNCTION_OPTIONS } from '@/lib/constants/categories'

export function NewRequestForm({
  defaultIndustry,
  defaultJobFunction,
}: {
  defaultIndustry?: string
  defaultJobFunction?: string
}) {
  const [state, action, pending] = useActionState<MatchRequestFormState, FormData>(
    createMatchRequest,
    undefined
  )

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="industry" className="text-sm font-medium text-neutral-700">
          산업
        </label>
        <select
          id="industry"
          name="industry"
          defaultValue={defaultIndustry ?? ''}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            선택해주세요
          </option>
          {INDUSTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {state?.errors?.industry && <p className="text-sm text-red-600">{state.errors.industry[0]}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="jobFunction" className="text-sm font-medium text-neutral-700">
          직무 (선택)
        </label>
        <select
          id="jobFunction"
          name="jobFunction"
          defaultValue={defaultJobFunction ?? ''}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {JOB_FUNCTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <Field label="기업 (선택)" name="companyFilter" />
      <Field
        label="희망 일정"
        name="requestedSchedule"
        placeholder="예: 2026년 8월 셋째 주 평일 오후"
        error={state?.errors?.requestedSchedule}
      />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">진행 방식</span>
        <div className="flex gap-4 text-sm text-neutral-700">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="format" value="online" defaultChecked /> 온라인
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="format" value="offline" /> 오프라인
          </label>
        </div>
        {state?.errors?.format && <p className="text-sm text-red-600">{state.errors.format[0]}</p>}
      </div>

      <Field
        label="제안 강사료 (원)"
        name="proposedFee"
        type="number"
        error={state?.errors?.proposedFee}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="contentType" className="text-sm font-medium text-neutral-700">
          내용 유형
        </label>
        <select
          id="contentType"
          name="contentType"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="단순멘토링">단순 멘토링</option>
          <option value="직무교육">직무 교육</option>
          <option value="실습">실습</option>
          <option value="특강">특강</option>
        </select>
        {state?.errors?.contentType && (
          <p className="text-sm text-red-600">{state.errors.contentType[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 self-start rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '등록 중...' : '섭외 요청 등록'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  error,
  placeholder,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string
  error?: string[]
  placeholder?: string
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error[0]}</p>}
    </div>
  )
}
