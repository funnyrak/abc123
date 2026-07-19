import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MentorProfileBody } from '@/components/mentor-card'

export default async function PublicMentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!mentor) notFound()

  const { data: careers } = await supabase
    .from('mentor_careers')
    .select('*')
    .eq('mentor_id', id)
    .order('start_year', { ascending: false })

  const { data: educations } = await supabase.from('mentor_educations').select('*').eq('mentor_id', id)

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-neutral-900">
            멘토링 매칭 &amp; 질문 플랫폼
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/mentors" className="text-sm text-neutral-500 underline">
          ← 멘토 풀로 돌아가기
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900">
          {mentor.display_name ?? '이름 미등록'} 멘토
        </h1>

        <div className="mt-4">
          <MentorProfileBody mentor={mentor} careers={careers ?? []} educations={educations ?? []} />
        </div>

        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
          이 멘토에게 섭외를 요청하려면 담당자 계정으로 가입해주세요.
          <Link href="/signup" className="ml-2 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
            담당자로 회원가입
          </Link>
        </div>
      </main>
    </div>
  )
}
