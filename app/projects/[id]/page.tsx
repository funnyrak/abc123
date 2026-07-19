import { notFound } from 'next/navigation'
import { requireProjectMember } from '@/lib/project/access'
import { markProjectCompleted } from '@/lib/billing/actions'
import { DashboardShell } from '@/components/dashboard-shell'
import { ScheduleForm } from './schedule-form'
import { AttendanceToggle } from './attendance-toggle'
import { MaterialUploader } from './material-uploader'
import { CancelButton } from './cancel-button'
import { PaymentPanel } from './payment-panel'

const PROJECT_STATUS_LABEL: Record<string, string> = {
  confirmed: '확정됨',
  in_progress: '진행 중',
  completed: '완료됨',
  cancelled: '취소됨',
}

export default async function ProjectRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile, role, supabase } = await requireProjectMember(id)

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const { data: schedules } = await supabase
    .from('project_schedules')
    .select('*')
    .eq('project_id', id)
    .order('session_no', { ascending: true })

  const { data: materials } = await supabase
    .from('lecture_materials')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const materialsWithUrls = await Promise.all(
    (materials ?? []).map(async (m) => {
      const { data } = await supabase.storage
        .from('lecture-materials')
        .createSignedUrl(m.file_url, 60 * 10)
      return { ...m, signedUrl: data?.signedUrl ?? null }
    })
  )

  const canSeeFinance = role === 'mentor' || profile.role === 'admin'
  const canSeeInvoice = role === 'coordinator' || profile.role === 'admin'

  const { data: invoice } = canSeeInvoice
    ? await supabase.from('invoices').select('*').eq('project_id', id).maybeSingle()
    : { data: null }

  const { data: settlements } = canSeeFinance
    ? await supabase.from('mentor_settlements').select('*').eq('project_id', id)
    : { data: null }

  return (
    <DashboardShell profile={profile} title="프로젝트 룸">
      <div className="max-w-2xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <code className="text-sm text-neutral-500">{project.project_code}</code>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {PROJECT_STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            {project.scale_tier === 'managed' ? '10명 이상 · 직영 운영' : '1~2명'} ·{' '}
            {project.payment_type === 'prepaid' ? '선결제' : '후결제'}
          </p>
          {project.status === 'confirmed' && (
            <div className="mt-3 flex gap-2">
              <form
                action={async () => {
                  'use server'
                  await markProjectCompleted(id)
                }}
              >
                <button className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white">
                  완료 처리 및 정산 산정
                </button>
              </form>
              <CancelButton projectId={id} />
            </div>
          )}
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-neutral-900">일정</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {(schedules ?? []).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    {s.session_no}회차 · {new Date(s.scheduled_at).toLocaleString('ko-KR')}
                  </p>
                  {s.topic && <p className="text-neutral-500">{s.topic}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                    {s.status === 'completed'
                      ? s.attended
                        ? '참석 완료'
                        : '불참'
                      : s.status === 'cancelled'
                        ? '취소됨'
                        : '예정'}
                  </span>
                  {role === 'mentor' && s.status === 'scheduled' && (
                    <AttendanceToggle projectId={id} scheduleId={s.id} />
                  )}
                </div>
              </li>
            ))}
            {(!schedules || schedules.length === 0) && (
              <li className="text-sm text-neutral-500">등록된 일정이 없습니다.</li>
            )}
          </ul>
          {project.status !== 'cancelled' && <ScheduleForm projectId={id} />}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-neutral-900">강의 자료</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {materialsWithUrls.map((m) => (
              <li key={m.id}>
                {m.signedUrl ? (
                  <a href={m.signedUrl} className="text-neutral-700 underline" target="_blank" rel="noreferrer">
                    {m.title ?? m.file_url}
                  </a>
                ) : (
                  <span className="text-neutral-400">{m.title ?? m.file_url}</span>
                )}
              </li>
            ))}
            {materialsWithUrls.length === 0 && (
              <li className="text-neutral-500">공유된 자료가 없습니다.</li>
            )}
          </ul>
          <MaterialUploader projectId={id} />
        </section>

        {(canSeeInvoice || canSeeFinance) && (
          <PaymentPanel
            projectId={id}
            isAdmin={profile.role === 'admin'}
            invoice={canSeeInvoice ? invoice : null}
            settlements={canSeeFinance ? (settlements ?? []) : null}
          />
        )}
      </div>
    </DashboardShell>
  )
}
