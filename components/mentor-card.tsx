import Link from 'next/link'

export const MENTOR_LIST_SELECT =
  'id, company, department, position, job_function, industry, mentoring_fields, region, claim_status, display_name'

export type MentorListItem = {
  id: string
  company: string | null
  department: string | null
  position: string | null
  job_function: string | null
  industry: string | null
  mentoring_fields: string[] | null
  region: string | null
  claim_status: string
  display_name: string | null
}

type Career = { id: string; start_year: number; end_year: number | null; organization: string; description: string | null }
type Education = { id: string; degree_type: string; school_name: string; major: string | null }

export function MentorProfileBody({
  mentor,
  careers,
  educations,
  showClaimNotice = false,
}: {
  mentor: {
    company: string | null
    position: string | null
    department: string | null
    industry: string | null
    job_function: string | null
    region: string | null
    mentoring_fields: string[] | null
    bio: string | null
    claim_status: string
  }
  careers: Career[]
  educations: Education[]
  showClaimNotice?: boolean
}) {
  return (
    <>
      {showClaimNotice && mentor.claim_status === 'unclaimed' && (
        <p className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          이 멘토는 아직 가입 전입니다 — 초대 후 활성화되면 섭외 요청에 응답할 수 있습니다.
        </p>
      )}
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">
          {mentor.company} · {mentor.position} {mentor.department ? `· ${mentor.department}` : ''}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {mentor.industry} · {mentor.job_function} {mentor.region ? `· ${mentor.region}` : ''}
        </p>
        {mentor.mentoring_fields && mentor.mentoring_fields.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {mentor.mentoring_fields.map((f) => (
              <span key={f} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                {f}
              </span>
            ))}
          </div>
        )}
        {mentor.bio && <p className="mt-3 text-sm text-neutral-700">{mentor.bio}</p>}
      </div>

      <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900">주요 경력</h3>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
          {careers.map((c) => (
            <li key={c.id}>
              {c.start_year} – {c.end_year ?? '현재'} · {c.organization}
              {c.description ? ` (${c.description})` : ''}
            </li>
          ))}
          {careers.length === 0 && <li className="text-neutral-400">등록된 경력이 없습니다.</li>}
        </ul>
      </div>

      <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900">출신 학교</h3>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
          {educations.map((e) => (
            <li key={e.id}>
              {e.degree_type} · {e.school_name} {e.major ? `(${e.major})` : ''}
            </li>
          ))}
          {educations.length === 0 && <li className="text-neutral-400">등록된 학력이 없습니다.</li>}
        </ul>
      </div>
    </>
  )
}

export function MentorCard({
  mentor,
  href,
  showClaimBadge = false,
}: {
  mentor: MentorListItem
  href: string
  showClaimBadge?: boolean
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        {mentor.display_name ?? '이름 미등록'}
        {showClaimBadge && mentor.claim_status === 'unclaimed' && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            가입 대기
          </span>
        )}
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        {mentor.company} · {mentor.position} {mentor.department ? `· ${mentor.department}` : ''}
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        {mentor.industry} · {mentor.job_function} {mentor.region ? `· ${mentor.region}` : ''}
      </p>
      {mentor.mentoring_fields && mentor.mentoring_fields.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mentor.mentoring_fields.map((f) => (
            <span key={f} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
              {f}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
