'use client'

import { useActionState, useState } from 'react'
import { updateMentorProfile } from '@/lib/mentor/actions'
import { MentorProfileFormState } from '@/lib/validation/mentor'

type MentorProfile = {
  company: string | null
  department: string | null
  position: string | null
  job_function: string | null
  industry: string | null
  main_duties: string | null
  mentoring_fields: string[] | null
  bio: string | null
  region: string | null
} | null

type CareerRow = {
  startYear: string
  endYear: string
  organization: string
  description: string
}

type EducationRow = {
  degreeType: '학사' | '석사'
  schoolName: string
  major: string
  graduationYear: string
}

export function MentorProfileForm({
  mentorProfile,
  careers,
  educations,
}: {
  mentorProfile: MentorProfile
  careers: { start_year: number; end_year: number | null; organization: string; description: string | null }[]
  educations: { degree_type: string; school_name: string; major: string | null; graduation_year: number | null }[]
}) {
  const [state, action, pending] = useActionState<MentorProfileFormState, FormData>(
    updateMentorProfile,
    undefined
  )

  const [careerRows, setCareerRows] = useState<CareerRow[]>(
    careers.length
      ? careers.map((c) => ({
          startYear: String(c.start_year),
          endYear: c.end_year ? String(c.end_year) : '',
          organization: c.organization,
          description: c.description ?? '',
        }))
      : [{ startYear: '', endYear: '', organization: '', description: '' }]
  )

  const [educationRows, setEducationRows] = useState<EducationRow[]>(
    educations.length
      ? educations.map((e) => ({
          degreeType: e.degree_type as '학사' | '석사',
          schoolName: e.school_name,
          major: e.major ?? '',
          graduationYear: e.graduation_year ? String(e.graduation_year) : '',
        }))
      : [
          { degreeType: '학사', schoolName: '', major: '', graduationYear: '' },
          { degreeType: '석사', schoolName: '', major: '', graduationYear: '' },
        ]
  )

  const careerJson = JSON.stringify(
    careerRows
      .filter((r) => r.organization.trim() && r.startYear)
      .map((r) => ({
        startYear: Number(r.startYear),
        endYear: r.endYear ? Number(r.endYear) : null,
        organization: r.organization,
        description: r.description,
      }))
  )

  const educationJson = JSON.stringify(
    educationRows
      .filter((r) => r.schoolName.trim())
      .map((r) => ({
        degreeType: r.degreeType,
        schoolName: r.schoolName,
        major: r.major,
        graduationYear: r.graduationYear ? Number(r.graduationYear) : null,
      }))
  )

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-900">1. 현재 소속</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="기업" name="company" defaultValue={mentorProfile?.company ?? ''} error={state?.errors?.company} />
          <Field
            label="부서"
            name="department"
            defaultValue={mentorProfile?.department ?? ''}
          />
          <Field
            label="직책/직급"
            name="position"
            defaultValue={mentorProfile?.position ?? ''}
            error={state?.errors?.position}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-900">2. 주요 경력 사항</h2>
        {careerRows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2fr_2fr_auto] items-start gap-2">
            <input
              type="number"
              placeholder="시작 연도"
              value={row.startYear}
              onChange={(e) => updateRow(setCareerRows, i, { startYear: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="종료 연도"
              value={row.endYear}
              onChange={(e) => updateRow(setCareerRows, i, { endYear: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="조직명"
              value={row.organization}
              onChange={(e) => updateRow(setCareerRows, i, { organization: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="설명"
              value={row.description}
              onChange={(e) => updateRow(setCareerRows, i, { description: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => setCareerRows((rows) => rows.filter((_, idx) => idx !== i))}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs text-neutral-500"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setCareerRows((rows) => [...rows, { startYear: '', endYear: '', organization: '', description: '' }])
          }
          className="self-start text-sm text-neutral-600 underline"
        >
          + 경력 추가
        </button>
        <input type="hidden" name="careerJson" value={careerJson} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-900">3. 출신 학교 (학사 · 석사)</h2>
        {educationRows.map((row, i) => (
          <div key={i} className="grid grid-cols-[auto_2fr_2fr_1fr] items-start gap-2">
            <select
              value={row.degreeType}
              onChange={(e) =>
                updateRow(setEducationRows, i, { degreeType: e.target.value as '학사' | '석사' })
              }
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="학사">학사</option>
              <option value="석사">석사</option>
            </select>
            <input
              placeholder="학교명"
              value={row.schoolName}
              onChange={(e) => updateRow(setEducationRows, i, { schoolName: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="전공"
              value={row.major}
              onChange={(e) => updateRow(setEducationRows, i, { major: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="졸업 연도"
              value={row.graduationYear}
              onChange={(e) => updateRow(setEducationRows, i, { graduationYear: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <input type="hidden" name="educationJson" value={educationJson} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-900">4~5. 업무 내용 · 멘토링 영역</h2>
        <Field
          label="주요 업무 내용"
          name="mainDuties"
          defaultValue={mentorProfile?.main_duties ?? ''}
          error={state?.errors?.mainDuties}
          textarea
        />
        <Field
          label="직무"
          name="jobFunction"
          defaultValue={mentorProfile?.job_function ?? ''}
          error={state?.errors?.jobFunction}
        />
        <Field
          label="산업"
          name="industry"
          defaultValue={mentorProfile?.industry ?? ''}
          error={state?.errors?.industry}
        />
        <Field
          label="멘토링 영역 (쉼표로 구분)"
          name="mentoringFields"
          defaultValue={(mentorProfile?.mentoring_fields ?? []).join(', ')}
          error={state?.errors?.mentoringFields}
          placeholder="예: 커리어 코칭, 창업, 직무 전문성"
        />
        <Field label="자기소개" name="bio" defaultValue={mentorProfile?.bio ?? ''} textarea />
        <Field label="활동 가능 지역" name="region" defaultValue={mentorProfile?.region ?? ''} />
      </section>

      {state?.message && <p className="text-sm text-neutral-700">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}

function updateRow<T>(setRows: React.Dispatch<React.SetStateAction<T[]>>, index: number, patch: Partial<T>) {
  setRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
}

function Field({
  label,
  name,
  defaultValue,
  error,
  textarea,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string
  error?: string[]
  textarea?: boolean
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      )}
      {error && <p className="text-sm text-red-600">{error[0]}</p>}
    </div>
  )
}
