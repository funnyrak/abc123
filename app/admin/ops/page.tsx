import Link from 'next/link'
import { requireProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

const REQUEST_STATUS_LABEL: Record<string, string> = {
  recruiting: '모집 중',
  mentor_selected: '선택 완료',
  confirmed: '확정',
  cancelled: '취소',
}

export default async function AdminOpsPage() {
  const profile = await requireProfile('admin')
  const supabase = await createClient()

  const [{ data: requests }, { data: alerts }, { data: schedules }, { data: invoices }, { data: questions }] =
    await Promise.all([
      supabase.from('match_requests').select('status'),
      supabase
        .from('operations_alerts')
        .select('id, type, ref_table, ref_id, triggered_at')
        .eq('status', 'open')
        .order('triggered_at', { ascending: false }),
      supabase
        .from('project_schedules')
        .select('id, scheduled_at, status, reminder_7d_sent, reminder_1d_sent, reminder_2h_sent, projects(project_code)')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(20),
      supabase.from('invoices').select('status, amount'),
      supabase.from('questions').select('status, scope_type'),
    ])

  const requestCounts = countBy(requests ?? [], 'status')
  const totalRequests = (requests ?? []).length
  const confirmedRate = totalRequests
    ? Math.round(((requestCounts.confirmed ?? 0) / totalRequests) * 100)
    : 0

  const noMentorAlerts = (alerts ?? []).filter((a) => a.type === 'no_mentor_match')
  const delayAlerts = (alerts ?? []).filter(
    (a) => a.type === 'question_delay' || a.type === 'mentor_no_response'
  )

  const unpaidInvoices = (invoices ?? []).filter((i) => i.status === 'unpaid')
  const paidInvoices = (invoices ?? []).filter((i) => i.status === 'paid')
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + Number(i.amount), 0)

  const questionCounts = countBy(questions ?? [], 'status')
  const questionScopeCounts = countBy(questions ?? [], 'scope_type')

  return (
    <DashboardShell profile={profile} title="운영 관제 대시보드">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="1. 섭외 요청 접수 현황">
          <Stat label="전체 요청" value={`${totalRequests}건`} />
          <Stat label="성사율" value={`${confirmedRate}%`} />
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(REQUEST_STATUS_LABEL).map(([key, label]) => (
              <span key={key} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                {label} {requestCounts[key] ?? 0}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="2. 추천 멘토 없음 경고" warn={noMentorAlerts.length > 0}>
          {noMentorAlerts.length === 0 ? (
            <EmptyNote text="경고 없음" />
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-neutral-600">
              {noMentorAlerts.map((a) => (
                <li key={a.id}>
                  <Link href={`/coordinator/requests/${a.ref_id}`} className="underline">
                    요청 {a.ref_id.slice(0, 8)}
                  </Link>{' '}
                  · {new Date(a.triggered_at).toLocaleString('ko-KR')}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="3. 확정 스케줄 · 사전 알림 현황">
          {(!schedules || schedules.length === 0) ? (
            <EmptyNote text="예정된 일정이 없습니다" />
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-neutral-600">
              {schedules.map((s) => {
                const project = s.projects as unknown as { project_code: string } | null
                return (
                  <li key={s.id} className="flex items-center justify-between">
                    <span>
                      {project?.project_code} · {new Date(s.scheduled_at).toLocaleString('ko-KR')}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {s.reminder_7d_sent ? '7일✓' : '7일·'} {s.reminder_1d_sent ? '1일✓' : '1일·'}{' '}
                      {s.reminder_2h_sent ? '2시간✓' : '2시간·'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="4. 결제 현황">
          <Stat label="미결제" value={`${unpaidInvoices.length}건 · ${unpaidTotal.toLocaleString()}원`} />
          <Stat label="결제완료" value={`${paidInvoices.length}건`} />
          <Link href="/admin/invoices" className="mt-2 inline-block text-xs text-neutral-500 underline">
            결제 목록 보기
          </Link>
        </Panel>

        <Panel title="5. 질문 접수 · 매칭 현황">
          <Stat label="미답변" value={`${questionCounts.open ?? 0}건`} />
          <Stat label="답변완료" value={`${questionCounts.answered ?? 0}건`} />
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(questionScopeCounts).map(([key, count]) => (
              <span key={key} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                {key} {count}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="6. 질문 지체 경고" warn={delayAlerts.length > 0}>
          {delayAlerts.length === 0 ? (
            <EmptyNote text="경고 없음" />
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-neutral-600">
              {delayAlerts.map((a) => (
                <li key={a.id}>
                  {a.type === 'question_delay' ? '1:1 질문 24시간 초과' : '멘토 3회 이상 무응답'} ·{' '}
                  {a.ref_id.slice(0, 8)} · {new Date(a.triggered_at).toLocaleString('ko-KR')}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </DashboardShell>
  )
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key])
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}

function Panel({ title, warn, children }: { title: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-lg border bg-white p-5 ${warn ? 'border-amber-300' : 'border-neutral-200'}`}
    >
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-neutral-600">
      <span className="text-neutral-400">{label}</span> · {value}
    </p>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-neutral-400">{text}</p>
}
