'use client'

import { useActionState } from 'react'
import { login } from '@/lib/auth/actions'
import { LoginFormState } from '@/lib/validation/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginFormState, FormData>(login, undefined)

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
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
        {state?.errors?.email && (
          <p className="text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

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

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
