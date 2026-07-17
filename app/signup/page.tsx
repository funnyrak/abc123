import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from './signup-form'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>
}) {
  const { claim } = await searchParams

  let claimedMentor: { name: string; company: string | null } | null = null
  if (claim) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('mentor_profiles')
      .select('unclaimed_name, company')
      .eq('claim_token', claim)
      .eq('claim_status', 'unclaimed')
      .maybeSingle()

    if (data) {
      claimedMentor = { name: data.unclaimed_name ?? '', company: data.company }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">회원가입</h1>
      {claimedMentor ? (
        <p className="mt-1 text-sm text-neutral-500">
          <strong className="text-neutral-900">{claimedMentor.name}</strong>님, 등록된 멘토 프로필을
          이어받아 가입을 완료해주세요. {claimedMentor.company}
        </p>
      ) : (
        <p className="mt-1 text-sm text-neutral-500">역할을 선택하고 가입을 진행해주세요.</p>
      )}
      <SignupForm claimToken={claim} prefilledName={claimedMentor?.name} />
      <p className="mt-6 text-center text-sm text-neutral-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          로그인
        </Link>
      </p>
    </main>
  )
}
