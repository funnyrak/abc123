'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'

export async function reviewVerificationDocument(
  documentId: string,
  mentorId: string,
  mentorUserId: string,
  decision: 'approved' | 'rejected'
) {
  const admin = await requireProfile('admin')
  const supabase = await createClient()

  await supabase
    .from('verification_documents')
    .update({ status: decision, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('id', documentId)

  await supabase.from('mentor_profiles').update({ status: decision }).eq('id', mentorId)

  await supabase
    .from('kakao_notifications')
    .insert({ user_id: mentorUserId, type: 'verification_result', status: 'pending' })

  revalidatePath('/admin/mentors')
}
