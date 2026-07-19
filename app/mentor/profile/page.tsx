import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { MentorProfileForm } from './mentor-profile-form'

export default async function MentorProfilePage() {
  const profile = await requireProfile('mentor')
  const supabase = await createClient()

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  const { data: careers } = await supabase
    .from('mentor_careers')
    .select('*')
    .eq('mentor_id', mentorProfile?.id)
    .order('start_year', { ascending: false })

  const { data: educations } = await supabase
    .from('mentor_educations')
    .select('*')
    .eq('mentor_id', mentorProfile?.id)

  return (
    <DashboardShell profile={profile} title="프로필 관리">
      {mentorProfile?.status && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          재직 인증 상태: {STATUS_LABEL[mentorProfile.status] ?? mentorProfile.status}
        </p>
      )}
      <MentorProfileForm mentorProfile={mentorProfile} careers={careers ?? []} educations={educations ?? []} />
    </DashboardShell>
  )
}

const STATUS_LABEL: Record<string, string> = {
  pending: '심사 중',
  approved: '승인됨',
  rejected: '반려됨',
}
