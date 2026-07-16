'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'
import { generateProjectCode } from '@/lib/project/code'

// Coordinator-triggered: turns the org's Q&A access on and creates the
// qna_subscription Project that mentors opt into (see optInToQnaProject
// below). One active subscription project per org for MVP.
export async function subscribeToQna() {
  const profile = await requireProfile('coordinator')
  if (!profile.org_id) return

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('org_id', profile.org_id)
    .eq('type', 'qna_subscription')
    .maybeSingle()

  if (existing) return

  await supabase.from('organizations').update({ qna_subscription_status: 'active' }).eq('id', profile.org_id)

  const { data: project } = await supabase
    .from('projects')
    .insert({
      org_id: profile.org_id,
      type: 'qna_subscription',
      project_code: generateProjectCode(),
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (project) {
    await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: profile.id, role_in_project: 'coordinator' })
  }

  revalidatePath('/coordinator')
}

export async function optInToQnaProject(projectId: string) {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  if (!mentorProfile) return

  await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: profile.id, role_in_project: 'mentor' })

  revalidatePath('/mentor/qna-projects')
}
