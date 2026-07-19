import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        멘토링 매칭 &amp; 질문 플랫폼
      </p>
      <h1 className="mt-3 max-w-lg text-3xl font-semibold text-neutral-900">
        멘토 추천/섭외와 멘토 질문(Q&amp;A) 서비스
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-500">
        학교·기관 담당자, 멘토, 학생 각자의 역할에 맞는 대시보드로 이동해보세요.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/mentors"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          멘토 풀 둘러보기
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
        >
          회원가입
        </Link>
      </div>
    </div>
  )
}
