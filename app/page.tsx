import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STEPS = [
  {
    title: '1. 멘토 조건 등록',
    description: '산업·직무·희망 일정·진행 방식 등 필요한 멘토 조건을 입력해 섭외 요청을 등록합니다.',
  },
  {
    title: '2. 조건에 맞는 멘토에게 전달',
    description: '등록한 조건과 일치하는 멘토들에게 카카오톡으로 요청 내용이 실시간으로 전달됩니다.',
  },
  {
    title: '3. 멘토가 확인 후 응답',
    description: '멘토는 카톡에서 요청 내용을 확인하고 수락 또는 거절로 응답합니다.',
  },
  {
    title: '4. 최종 인원 확정',
    description: '수락한 멘토 중 담당자가 최종 인원을 선택하면 전용 프로젝트 공간이 자동으로 만들어집니다.',
  },
] as const

export default async function Home() {
  const supabase = await createClient()
  const { count: mentorCount } = await supabase
    .from('mentor_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-neutral-900">
            멘토링 매칭 &amp; 질문 플랫폼
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/mentors" className="text-sm text-neutral-600">
              멘토 풀 둘러보기
            </Link>
            <Link href="/login" className="text-sm text-neutral-600">
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              학교·기관 진로 컨설턴트를 위한 멘토 섭외 플랫폼
            </p>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold text-neutral-900 sm:text-4xl">
              필요한 멘토 조건만 입력하면,
              <br />
              맞는 멘토를 카톡으로 섭외합니다
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-500">
              학생을 지도하는 학교·기관 담당자가 산업·직무 조건으로 요청을 등록하면, 조건에 맞는
              멘토들에게 카카오톡으로 전달되고 수락한 멘토 중에서 최종 인원을 선택할 수 있습니다.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup?role=coordinator"
                className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                담당자로 시작하기
              </Link>
              <Link
                href="/mentors"
                className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
              >
                멘토 풀 둘러보기 ({mentorCount ?? 0}명)
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-xl font-semibold text-neutral-900">이렇게 진행됩니다</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.title} className="rounded-lg border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                <p className="mt-2 text-sm text-neutral-500">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center text-xl font-semibold text-neutral-900">
              학생 질문도 멘토에게 바로 전달할 수 있어요
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
              소속 기관이 Q&amp;A 서비스를 구독하면, 학생은 멘토 개인 지정은 물론 산업·직무·기업 단위로도
              질문을 등록할 수 있고 멘토의 답변을 받을 수 있습니다.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-neutral-900">지금 바로 시작해보세요</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?role=coordinator"
              className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              학교·기관 담당자로 가입
            </Link>
            <Link
              href="/signup?role=mentor"
              className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
            >
              멘토로 가입
            </Link>
            <Link
              href="/signup?role=student"
              className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
            >
              학생으로 가입
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
