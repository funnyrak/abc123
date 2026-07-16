'use server'

import { revalidatePath } from 'next/cache'
import { requireProjectMember } from '@/lib/project/access'

export async function addSchedule(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectMember(projectId)

  const sessionNo = Number(formData.get('sessionNo'))
  const scheduledAt = formData.get('scheduledAt') as string
  const topic = (formData.get('topic') as string) || null

  if (!sessionNo || !scheduledAt) return

  await supabase.from('project_schedules').insert({
    project_id: projectId,
    session_no: sessionNo,
    scheduled_at: new Date(scheduledAt).toISOString(),
    topic,
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function markAttendance(projectId: string, scheduleId: string, attended: boolean) {
  const { role, supabase } = await requireProjectMember(projectId)
  if (role !== 'mentor') return

  await supabase
    .from('project_schedules')
    .update({ attended, status: 'completed' })
    .eq('id', scheduleId)
    .eq('project_id', projectId)

  revalidatePath(`/projects/${projectId}`)
}

// Cancellation policy from docs/SPEC.md §4.3 (confirmed for online sessions;
// offline policy is still unconfirmed with the business — same calculation
// is applied to both formats until that's clarified).
function cancellationFeeRate(hoursUntilSession: number | null) {
  if (hoursUntilSession === null) return 0
  if (hoursUntilSession >= 72) return 0
  if (hoursUntilSession >= 24) return 0.5
  return 1
}

export async function cancelProject(projectId: string) {
  const { supabase } = await requireProjectMember(projectId)

  const { data: nextSchedule } = await supabase
    .from('project_schedules')
    .select('scheduled_at')
    .eq('project_id', projectId)
    .eq('status', 'scheduled')
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const hoursUntil = nextSchedule
    ? (new Date(nextSchedule.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
    : null

  const feeRate = cancellationFeeRate(hoursUntil)

  await supabase
    .from('projects')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_fee_rate: feeRate,
    })
    .eq('id', projectId)

  await supabase
    .from('project_schedules')
    .update({ status: 'cancelled' })
    .eq('project_id', projectId)
    .eq('status', 'scheduled')

  revalidatePath(`/projects/${projectId}`)
}

export async function addMaterialRecord(projectId: string, filePath: string, title: string) {
  const { profile, supabase } = await requireProjectMember(projectId)

  await supabase.from('lecture_materials').insert({
    project_id: projectId,
    uploaded_by: profile.id,
    file_url: filePath,
    title,
  })

  revalidatePath(`/projects/${projectId}`)
}
