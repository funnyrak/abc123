import * as z from 'zod'

export const OrganizationSchema = z.object({
  name: z.string().trim().min(1, { error: '기관명을 입력해주세요.' }),
  type: z.enum(['학교', '기관']),
  address: z.string().trim().optional(),
  orgCode: z
    .string()
    .trim()
    .min(3, { error: '코드는 3자 이상이어야 합니다.' })
    .regex(/^[a-zA-Z0-9-]+$/, { error: '영문, 숫자, 하이픈만 사용할 수 있습니다.' }),
})

export type OrganizationFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined
