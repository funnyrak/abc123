'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'

// No PG is wired up yet (same situation as docs/SPEC.md §10 for org
// invoices) — this grants credits immediately instead of collecting
// real payment. Swap for a real checkout once a payment provider
// contract exists.
export async function purchaseCredits() {
  const profile = await requireProfile('student')
  const supabase = await createClient()

  await supabase.from('question_credit_purchases').insert({
    student_id: profile.id,
    credits_purchased: 5,
    amount: 10000,
  })

  revalidatePath('/student')
  revalidatePath('/student/ask')
}
