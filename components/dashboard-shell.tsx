import Link from 'next/link'
import { logout } from '@/lib/auth/actions'
import type { Profile } from '@/lib/auth/dal'

const ROLE_LABEL: Record<Profile['role'], string> = {
  mentor: '멘토',
  coordinator: '담당자',
  student: '학생',
  admin: '관리자',
}

export function DashboardShell({
  profile,
  title,
  children,
}: {
  profile: Profile
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {ROLE_LABEL[profile.role]}
            </p>
            <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600">{profile.name}님</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}

export function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
          다음 단계
        </span>
      </div>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </div>
  )
}

export function LinkCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400"
    >
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </Link>
  )
}
