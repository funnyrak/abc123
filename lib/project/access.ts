import 'server-only'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile, type Profile } from '@/lib/auth/dal'

export async function requireProjectMember(projectId: string): Promise<{
  profile: Profile
  role: 'mentor' | 'coordinator' | null
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (profile.role === 'admin') {
    return { profile, role: null, supabase }
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('role_in_project')
    .eq('project_id', projectId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (!membership) notFound()

  return { profile, role: membership.role_in_project as 'mentor' | 'coordinator', supabase }
}
