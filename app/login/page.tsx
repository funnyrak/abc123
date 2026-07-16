import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">로그인</h1>
      <p className="mt-1 text-sm text-neutral-500">멘토링 플랫폼에 오신 것을 환영합니다.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-neutral-900 underline">
          회원가입
        </Link>
      </p>
    </main>
  )
}
