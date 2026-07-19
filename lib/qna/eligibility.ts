import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/auth/dal'

const FREE_QUOTA = 3

export type Eligibility =
  | { method: 'subscription' }
  | { method: 'free'; remaining: number }
  | { method: 'credit'; remaining: number }
  | { method: 'none'; freeRemaining: number; creditsRemaining: number }

export async function getEligibility(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile
): Promise<Eligibility> {
  if (profile.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('qna_subscription_status')
      .eq('id', profile.org_id)
      .single()

    if (org?.qna_subscription_status === 'active') {
      return { method: 'subscription' }
    }
  }

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('free_questions_used')
    .eq('user_id', profile.id)
    .single()

  const freeRemaining = FREE_QUOTA - (studentProfile?.free_questions_used ?? 0)

  if (freeRemaining > 0) {
    return { method: 'free', remaining: freeRemaining }
  }

  const { data: purchases } = await supabase
    .from('question_credit_purchases')
    .select('credits_purchased')
    .eq('student_id', profile.id)

  const totalPurchased = (purchases ?? []).reduce((sum, p) => sum + p.credits_purchased, 0)

  const { count: creditsUsed } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', profile.id)
    .eq('funded_by', 'credit')

  const creditsRemaining = totalPurchased - (creditsUsed ?? 0)

  if (creditsRemaining > 0) {
    return { method: 'credit', remaining: creditsRemaining }
  }

  return { method: 'none', freeRemaining: 0, creditsRemaining: 0 }
}
