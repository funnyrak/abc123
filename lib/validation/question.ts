import * as z from 'zod'

export const QuestionSchema = z.object({
  scopeType: z.enum(['individual', 'industry', 'job_function', 'company']),
  scopeValue: z.string().trim().min(1, { error: '질문 대상을 선택하거나 입력해주세요.' }),
  content: z.string().trim().min(5, { error: '질문 내용을 5자 이상 입력해주세요.' }),
})

export type QuestionFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined
