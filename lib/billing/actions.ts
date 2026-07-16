'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'
import { requireProjectMember } from '@/lib/project/access'

export async function choosePaymentMethod(
  projectId: string,
  invoiceId: string,
  method: 'card' | 'bank_transfer'
) {
  const { role, profile, supabase } = await requireProjectMember(projectId)
  if (role !== 'coordinator' && profile.role !== 'admin') return

  await supabase.from('invoices').update({ payment_method: method }).eq('id', invoiceId)
  revalidatePath(`/projects/${projectId}`)
}

// No real PG (payment gateway) is wired up yet — a business account with a
// provider like Toss Payments or 아임포트 is needed first (see
// docs/SPEC.md §10). Marking an invoice paid is an admin-only manual step
// until that integration exists.
export async function markInvoicePaid(invoiceId: string, projectId: string) {
  await requireProfile('admin')
  const supabase = await createClient()

  await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)

  // Postpaid settlements were waiting on this payment — release them now.
  const { data: settlements } = await supabase
    .from('mentor_settlements')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'pending')

  if (settlements && settlements.length > 0) {
    await supabase
      .from('mentor_settlements')
      .update({ status: 'available' })
      .in('id', settlements.map((s) => s.id))
  }

  revalidatePath('/admin/invoices')
  revalidatePath(`/projects/${projectId}`)
}

export async function markProjectCompleted(projectId: string) {
  const { role, profile, supabase } = await requireProjectMember(projectId)
  if (role !== 'coordinator' && profile.role !== 'admin') return

  const { data: project } = await supabase
    .from('projects')
    .select('id, session_fee, payment_type')
    .eq('id', projectId)
    .single()

  if (!project) return

  await supabase.from('projects').update({ status: 'completed' }).eq('id', projectId)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('project_id', projectId)
    .maybeSingle()

  const settlementStatus =
    project.payment_type === 'prepaid' || invoice?.status === 'paid' ? 'available' : 'pending'

  const { data: mentors } = await supabase
    .from('project_members')
    .select('user_id, mentor_profiles!inner(id)')
    .eq('project_id', projectId)
    .eq('role_in_project', 'mentor')

  const { count: sessionCount } = await supabase
    .from('project_schedules')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .eq('attended', true)

  const totalAmount = (sessionCount ?? 0) * Number(project.session_fee ?? 0)

  for (const m of mentors ?? []) {
    const mentorProfileId = (m.mentor_profiles as unknown as { id: string }).id
    await supabase.from('mentor_settlements').upsert(
      {
        mentor_id: mentorProfileId,
        project_id: projectId,
        session_count: sessionCount ?? 0,
        total_amount: totalAmount,
        status: settlementStatus,
      },
      { onConflict: 'mentor_id,project_id' }
    )
  }

  revalidatePath(`/projects/${projectId}`)
}
