import * as z from 'zod'
import { INDUSTRY_OPTIONS, JOB_FUNCTION_OPTIONS } from '@/lib/constants/categories'

export const MentorProfileSchema = z.object({
  company: z.string().trim().min(1, { error: '현재 소속(기업)을 입력해주세요.' }),
  department: z.string().trim().optional(),
  position: z.string().trim().min(1, { error: '직책/직급을 입력해주세요.' }),
  jobFunction: z
    .array(z.enum(JOB_FUNCTION_OPTIONS))
    .min(1, { error: '직무를 1개 이상 선택해주세요.' }),
  industry: z
    .array(z.enum(INDUSTRY_OPTIONS))
    .min(1, { error: '산업을 1개 이상 선택해주세요.' }),
  mainDuties: z.string().trim().min(1, { error: '주요 업무 내용을 입력해주세요.' }),
  mentoringFields: z
    .string()
    .trim()
    .min(1, { error: '멘토링 영역을 1개 이상 입력해주세요.' }),
  bio: z.string().trim().optional(),
  region: z.string().trim().optional(),
})

const CareerRowSchema = z.object({
  startYear: z.coerce.number().int().min(1970).max(2100),
  endYear: z.coerce.number().int().min(1970).max(2100).optional().nullable(),
  organization: z.string().trim().min(1),
  description: z.string().trim().optional(),
})

const EducationRowSchema = z.object({
  degreeType: z.enum(['학사', '석사']),
  schoolName: z.string().trim().min(1),
  major: z.string().trim().optional(),
  graduationYear: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
})

export const CareerListSchema = z.array(CareerRowSchema).max(20)
export const EducationListSchema = z.array(EducationRowSchema).max(4)

export type MentorProfileFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined
