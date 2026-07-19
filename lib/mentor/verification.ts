'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'

export async function submitVerificationDocument(filePath: string) {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  if (!mentorProfile) return

  await supabase.from('verification_documents').insert({
    mentor_id: mentorProfile.id,
    file_url: filePath,
    status: 'pending',
  })

  await supabase.from('mentor_profiles').update({ status: 'pending' }).eq('id', mentorProfile.id)

  revalidatePath('/mentor/verification')
}
