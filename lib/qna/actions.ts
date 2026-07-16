'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'
import { getEligibility } from '@/lib/qna/eligibility'
import { QuestionFormState, QuestionSchema } from '@/lib/validation/question'

async function findQnaProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string | null
) {
  if (!orgId) return null
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('org_id', orgId)
    .eq('type', 'qna_subscription')
    .eq('status', 'confirmed')
    .maybeSingle()
  return data
}

export type SimilarQuestion = {
  id: string
  content: string
  answers: { content: string; mentor_profiles: { profiles: { name: string } | null } | null }[]
}

export async function searchSimilarQuestions(keyword: string): Promise<SimilarQuestion[]> {
  if (keyword.trim().length < 3) return []

  const profile = await requireProfile('student')
  const supabase = await createClient()
  const qnaProject = await findQnaProject(supabase, profile.org_id)
  if (!qnaProject) return []

  const { data } = await supabase
    .from('questions')
    .select('id, content, answers(content, mentor_profiles(profiles(name)))')
    .eq('project_id', qnaProject.id)
    .eq('status', 'answered')
    .ilike('content', `%${keyword.trim()}%`)
    .limit(5)

  return (data ?? []) as unknown as SimilarQuestion[]
}

export async function createQuestion(
  _state: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const profile = await requireProfile('student')

  const validated = QuestionSchema.safeParse({
    scopeType: formData.get('scopeType'),
    scopeValue: formData.get('scopeValue'),
    content: formData.get('content'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { scopeType, scopeValue, content } = validated.data
  const supabase = await createClient()

  const qnaProject = await findQnaProject(supabase, profile.org_id)
  if (!qnaProject) {
    return { message: '소속 학교가 Q&A 서비스를 구독하고 있지 않습니다.' }
  }

  const eligibility = await getEligibility(supabase, profile)
  if (eligibility.method === 'none') {
    return { message: '무료 질문과 크레딧을 모두 사용했습니다. 크레딧을 구매해주세요.' }
  }

  const { data: qnaMentors } = await supabase
    .from('project_members')
    .select('user_id, mentor_profiles!inner(id, user_id, industry, job_function, company)')
    .eq('project_id', qnaProject.id)
    .eq('role_in_project', 'mentor')

  type QnaMentor = { id: string; user_id: string; industry: string | null; job_function: string | null; company: string | null }
  const mentors = (qnaMentors ?? []).map((m) => m.mentor_profiles as unknown as QnaMentor)

  let targetMentors: QnaMentor[] = []
  if (scopeType === 'individual') {
    targetMentors = mentors.filter((m) => m.id === scopeValue)
  } else if (scopeType === 'industry') {
    targetMentors = mentors.filter((m) => m.industry?.includes(scopeValue))
  } else if (scopeType === 'job_function') {
    targetMentors = mentors.filter((m) => m.job_function?.includes(scopeValue))
  } else {
    targetMentors = mentors.filter((m) => m.company?.includes(scopeValue))
  }

  if (targetMentors.length === 0) {
    return { message: '조건에 맞는 멘토가 없습니다. 다른 조건으로 시도해주세요.' }
  }

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({
      student_id: profile.id,
      project_id: qnaProject.id,
      scope_type: scopeType,
      scope_value: scopeValue,
      content,
      funded_by: eligibility.method,
    })
    .select('id')
    .single()

  if (questionError || !question) {
    return { message: questionError?.message ?? '질문 등록에 실패했습니다.' }
  }

  await supabase.from('question_targets').insert(
    targetMentors.map((m) => ({
      question_id: question.id,
      mentor_id: m.id,
      notified_at: new Date().toISOString(),
    }))
  )

  await supabase.from('kakao_notifications').insert(
    targetMentors.map((m) => ({ user_id: m.user_id, type: 'new_question', status: 'pending' }))
  )

  if (eligibility.method === 'free') {
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('free_questions_used')
      .eq('user_id', profile.id)
      .single()

    await supabase
      .from('student_profiles')
      .update({ free_questions_used: (studentProfile?.free_questions_used ?? 0) + 1 })
      .eq('user_id', profile.id)
  }

  revalidatePath('/student/questions')
  redirect('/student/questions')
}

export async function answerQuestion(questionId: string, formData: FormData) {
  const profile = await requireProfile('mentor')
  const content = (formData.get('content') as string)?.trim()
  if (!content) return

  const supabase = await createClient()
  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()
  if (!mentorProfile) return

  const { data: question } = await supabase
    .from('questions')
    .select('id, scope_type, student_id')
    .eq('id', questionId)
    .single()
  if (!question) return

  await supabase.from('answers').insert({
    question_id: questionId,
    mentor_id: mentorProfile.id,
    content,
  })

  await supabase
    .from('question_targets')
    .update({ responded_at: new Date().toISOString() })
    .eq('question_id', questionId)
    .eq('mentor_id', mentorProfile.id)

  if (question.scope_type === 'individual') {
    await supabase.from('questions').update({ status: 'answered' }).eq('id', questionId)
  }

  await supabase
    .from('kakao_notifications')
    .insert({ user_id: question.student_id, type: 'answer_ready', status: 'pending' })

  revalidatePath('/mentor/questions')
  revalidatePath('/student/questions')
}

// Reward amount for an accepted broadcast answer is not finalized in
// the business spec yet — using a flat placeholder until that's set.
const ACCEPTED_ANSWER_REWARD = 5000

export async function acceptAnswer(answerId: string) {
  const profile = await requireProfile('student')
  const supabase = await createClient()

  const { data: answer } = await supabase
    .from('answers')
    .select('id, question_id, mentor_id, questions!inner(student_id)')
    .eq('id', answerId)
    .single()

  if (!answer) return
  const question = answer.questions as unknown as { student_id: string }
  if (question.student_id !== profile.id) return

  await supabase
    .from('answers')
    .update({ is_accepted: true, accepted_at: new Date().toISOString() })
    .eq('id', answerId)

  await supabase.from('questions').update({ status: 'answered' }).eq('id', answer.question_id)

  await supabase.from('answer_rewards').insert({
    answer_id: answerId,
    mentor_id: answer.mentor_id,
    amount: ACCEPTED_ANSWER_REWARD,
  })

  revalidatePath('/student/questions')
}
