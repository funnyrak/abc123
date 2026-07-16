import * as z from 'zod'

export const MatchRequestSchema = z.object({
  industry: z.string().trim().min(1, { error: '산업을 입력해주세요.' }),
  jobFunction: z.string().trim().optional(),
  companyFilter: z.string().trim().optional(),
  requestedSchedule: z.string().trim().min(1, { error: '희망 일정을 입력해주세요.' }),
  format: z.enum(['online', 'offline'], { error: '진행 방식을 선택해주세요.' }),
  proposedFee: z.coerce.number().min(0, { error: '제안 강사료를 입력해주세요.' }),
  contentType: z.enum(['단순멘토링', '직무교육', '실습', '특강'], {
    error: '내용 유형을 선택해주세요.',
  }),
})

export type MatchRequestFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined
