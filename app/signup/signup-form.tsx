'use client'

import { useActionState, useState } from 'react'
import { signup } from '@/lib/auth/actions'
import { SignupFormState } from '@/lib/validation/auth'

const ROLES = [
  { value: 'mentor', label: '멘토' },
  { value: 'coordinator', label: '담당자' },
  { value: 'student', label: '학생' },
] as const

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupFormState, FormData>(signup, undefined)
  const [role, setRole] = useState<(typeof ROLES)[number]['value']>('mentor')

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">역할</span>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                role === r.value
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              {r.label}
            </label>
          ))}
        </div>
        {state?.errors?.role && <p className="text-sm text-red-600">{state.errors.role[0]}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          이름
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        {state?.errors?.email && <p className="text-sm text-red-600">{state.errors.email[0]}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
          연락처
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="카카오 알림톡 수신용"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        {state?.errors?.phone && <p className="text-sm text-red-600">{state.errors.phone[0]}</p>}
      </div>

      {role !== 'mentor' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="orgCode" className="text-sm font-medium text-neutral-700">
            학교/기관 코드
          </label>
          <input
            id="orgCode"
            name="orgCode"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
          {state?.errors?.orgCode && (
            <p className="text-sm text-red-600">{state.errors.orgCode[0]}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-neutral-700">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        {state?.errors?.password && (
          <p className="text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-neutral-700">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '가입 중...' : '회원가입'}
      </button>
    </form>
  )
}
