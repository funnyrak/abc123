'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'
import { MatchRequestFormState, MatchRequestSchema } from '@/lib/validation/match-request'
import { generateProjectCode } from '@/lib/project/code'

// Kakao AlimTalk sending is not wired up yet (needs a business channel +
// vendor contract, see docs/SPEC.md §7.1). For now we just log a
// kakao_notifications row with status 'pending' so the send can be
// picked up by a worker once that integration exists.
async function queueKakaoNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: string
) {
  await supabase.from('kakao_notifications').insert({ user_id: userId, type, status: 'pending' })
}

export async function createMatchRequest(
  _state: MatchRequestFormState,
  formData: FormData
): Promise<MatchRequestFormState> {
  const profile = await requireProfile('coordinator')

  if (!profile.org_id) {
    return { message: '소속 기관 정보가 없습니다. 관리자에게 문의해주세요.' }
  }

  const validated = MatchRequestSchema.safeParse({
    industry: formData.get('industry'),
    jobFunction: formData.get('jobFunction') || undefined,
    companyFilter: formData.get('companyFilter') || undefined,
    requestedSchedule: formData.get('requestedSchedule'),
    format: formData.get('format'),
    proposedFee: formData.get('proposedFee'),
    contentType: formData.get('contentType'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { industry, jobFunction, companyFilter, requestedSchedule, format, proposedFee, contentType } =
    validated.data

  const supabase = await createClient()

  const { data: matchRequest, error: insertError } = await supabase
    .from('match_requests')
    .insert({
      org_id: profile.org_id,
      requested_by: profile.id,
      industry,
      job_function: jobFunction || null,
      company_filter: companyFilter || null,
      requested_schedule: requestedSchedule,
      format,
      proposed_fee: proposedFee,
      content_type: contentType,
      status: 'recruiting',
    })
    .select('id')
    .single()

  if (insertError || !matchRequest) {
    return { message: insertError?.message ?? '섭외 요청 생성에 실패했습니다.' }
  }

  let mentorQuery = supabase
    .from('mentor_profiles')
    .select('id, user_id')
    .eq('status', 'approved')
    .ilike('industry', `%${industry}%`)

  if (jobFunction) mentorQuery = mentorQuery.ilike('job_function', `%${jobFunction}%`)
  if (companyFilter) mentorQuery = mentorQuery.ilike('company', `%${companyFilter}%`)

  const { data: matchingMentors } = await mentorQuery

  if (matchingMentors && matchingMentors.length > 0) {
    await supabase.from('match_candidates').insert(
      matchingMentors.map((m) => ({
        match_request_id: matchRequest.id,
        mentor_id: m.id,
        status: 'invited',
      }))
    )
    await Promise.all(
      matchingMentors.map((m) => queueKakaoNotification(supabase, m.user_id, 'match_request'))
    )
  } else {
    await supabase.from('operations_alerts').insert({
      type: 'no_mentor_match',
      ref_table: 'match_requests',
      ref_id: matchRequest.id,
    })
  }

  redirect(`/coordinator/requests/${matchRequest.id}`)
}

export async function respondToCandidate(candidateId: string, decision: 'accepted' | 'declined') {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  if (!mentorProfile) return

  await supabase
    .from('match_candidates')
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq('id', candidateId)
    .eq('mentor_id', mentorProfile.id)

  revalidatePath('/mentor/requests')
}

export async function confirmSelection(matchRequestId: string, selectedCandidateIds: string[]) {
  const profile = await requireProfile('coordinator')
  const supabase = await createClient()

  const { data: matchRequest } = await supabase
    .from('match_requests')
    .select('id, org_id, requested_by, session_fee:proposed_fee')
    .eq('id', matchRequestId)
    .eq('requested_by', profile.id)
    .single()

  if (!matchRequest || selectedCandidateIds.length === 0) return

  const { data: candidates } = await supabase
    .from('match_candidates')
    .select('id, mentor_id, status, mentor_profiles(user_id)')
    .eq('match_request_id', matchRequestId)
    .eq('status', 'accepted')

  if (!candidates) return

  const selectedSet = new Set(selectedCandidateIds)

  await Promise.all(
    candidates.map((c) =>
      supabase
        .from('match_candidates')
        .update({ status: selectedSet.has(c.id) ? 'selected' : 'not_selected' })
        .eq('id', c.id)
    )
  )

  await supabase.from('match_requests').update({ status: 'confirmed' }).eq('id', matchRequestId)

  const selectedCandidates = candidates.filter((c) => selectedSet.has(c.id))

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      match_request_id: matchRequestId,
      org_id: matchRequest.org_id,
      type: 'recommendation',
      scale_tier: selectedCandidates.length >= 10 ? 'managed' : 'individual',
      payment_type: 'prepaid',
      session_fee: matchRequest.session_fee,
      project_code: generateProjectCode(),
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (projectError || !project) return

  const commissionRate = 0.2
  const feeAmount = Number(matchRequest.session_fee ?? 0)
  await supabase.from('invoices').insert({
    project_id: project.id,
    org_id: matchRequest.org_id,
    payment_type: 'prepaid',
    payment_method: selectedCandidates.length >= 10 ? 'project_contract' : null,
    amount: Math.round(feeAmount * (1 + commissionRate)),
    status: 'unpaid',
  })

  const memberRows = [
    { project_id: project.id, user_id: profile.id, role_in_project: 'coordinator' as const },
    ...selectedCandidates.map((c) => ({
      project_id: project.id,
      user_id: (c.mentor_profiles as unknown as { user_id: string }).user_id,
      role_in_project: 'mentor' as const,
    })),
  ]
  await supabase.from('project_members').insert(memberRows)

  await Promise.all(
    memberRows
      .filter((m) => m.role_in_project === 'mentor')
      .map((m) => queueKakaoNotification(supabase, m.user_id, 'final_confirm'))
  )
  await queueKakaoNotification(supabase, profile.id, 'final_confirm')

  revalidatePath(`/coordinator/requests/${matchRequestId}`)
}
