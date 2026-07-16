import Link from 'next/link'
import { SignupForm } from './signup-form'

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">회원가입</h1>
      <p className="mt-1 text-sm text-neutral-500">역할을 선택하고 가입을 진행해주세요.</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          로그인
        </Link>
      </p>
    </main>
  )
}
