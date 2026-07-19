'use client'

import { useActionState } from 'react'
import { createOrganization } from '@/lib/admin/organizations'
import { OrganizationFormState } from '@/lib/validation/organization'

export function OrganizationForm() {
  const [state, action, pending] = useActionState<OrganizationFormState, FormData>(
    createOrganization,
    undefined
  )

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          이름
        </label>
        <input id="name" name="name" required className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-neutral-700">
          구분
        </label>
        <select id="type" name="type" className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="학교">학교</option>
          <option value="기관">기관</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-neutral-700">
          주소 (선택)
        </label>
        <input id="address" name="address" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="orgCode" className="text-sm font-medium text-neutral-700">
          학교/기관 코드
        </label>
        <input
          id="orgCode"
          name="orgCode"
          placeholder="예: seoul-univ"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {state?.errors?.orgCode && <p className="text-sm text-red-600">{state.errors.orgCode[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-neutral-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '추가 중...' : '추가'}
      </button>
    </form>
  )
}
