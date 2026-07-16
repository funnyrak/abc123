import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DIRECT_DELAY_HOURS = 24
const BROADCAST_NO_RESPONSE_THRESHOLD = 3

// Scheduled via vercel.json to hit this route daily. Vercel Cron sends
// `Authorization: Bearer ${CRON_SECRET}` — see
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
// Set CRON_SECRET in the project's environment variables to enable it;
// without it this route rejects every request.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - DIRECT_DELAY_HOURS * 60 * 60 * 1000).toISOString()

  // 1) Direct (1:1) questions overdue by more than 24h.
  const { data: overdueDirect } = await supabase
    .from('questions')
    .select('id')
    .eq('scope_type', 'individual')
    .eq('status', 'open')
    .lt('created_at', cutoff)

  let directAlertsCreated = 0
  for (const q of overdueDirect ?? []) {
    const { data: existing } = await supabase
      .from('operations_alerts')
      .select('id')
      .eq('type', 'question_delay')
      .eq('ref_table', 'questions')
      .eq('ref_id', q.id)
      .eq('status', 'open')
      .maybeSingle()

    if (!existing) {
      await supabase.from('operations_alerts').insert({
        type: 'question_delay',
        ref_table: 'questions',
        ref_id: q.id,
      })
      directAlertsCreated++
    }
  }

  // 2) Broadcast questions: mentors with 3+ overdue non-responses.
  const { data: overdueTargets } = await supabase
    .from('question_targets')
    .select('mentor_id, questions!inner(created_at, scope_type)')
    .is('responded_at', null)
    .lt('questions.created_at', cutoff)
    .neq('questions.scope_type', 'individual')

  const overdueCountByMentor = new Map<string, number>()
  for (const t of overdueTargets ?? []) {
    overdueCountByMentor.set(t.mentor_id, (overdueCountByMentor.get(t.mentor_id) ?? 0) + 1)
  }

  let mentorAlertsCreated = 0
  for (const [mentorId, count] of overdueCountByMentor) {
    await supabase.from('mentor_profiles').update({ no_response_count: count }).eq('id', mentorId)

    if (count >= BROADCAST_NO_RESPONSE_THRESHOLD) {
      const { data: existing } = await supabase
        .from('operations_alerts')
        .select('id')
        .eq('type', 'mentor_no_response')
        .eq('ref_table', 'mentor_profiles')
        .eq('ref_id', mentorId)
        .eq('status', 'open')
        .maybeSingle()

      if (!existing) {
        await supabase.from('operations_alerts').insert({
          type: 'mentor_no_response',
          ref_table: 'mentor_profiles',
          ref_id: mentorId,
        })
        mentorAlertsCreated++
      }
    }
  }

  return NextResponse.json({
    checkedDirect: overdueDirect?.length ?? 0,
    directAlertsCreated,
    mentorsOverThreshold: [...overdueCountByMentor.values()].filter(
      (c) => c >= BROADCAST_NO_RESPONSE_THRESHOLD
    ).length,
    mentorAlertsCreated,
  })
}
