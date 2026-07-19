import * as z from 'zod'

export const SignupFormSchema = z
  .object({
    role: z.enum(['mentor', 'coordinator', 'student']),
    name: z.string().min(2, { error: '이름은 2자 이상 입력해주세요.' }).trim(),
    email: z.email({ error: '올바른 이메일을 입력해주세요.' }).trim(),
    phone: z.string().min(9, { error: '연락처를 입력해주세요.' }).trim(),
    password: z
      .string()
      .min(8, { error: '비밀번호는 8자 이상이어야 합니다.' })
      .regex(/[a-zA-Z]/, { error: '영문을 포함해주세요.' })
      .regex(/[0-9]/, { error: '숫자를 포함해주세요.' }),
    orgName: z.string().trim().optional(),
    claimToken: z.string().trim().optional(),
  })
  .refine((data) => data.role === 'mentor' || !!data.orgName, {
    error: '학교/기관명을 입력해주세요.',
    path: ['orgName'],
  })

export type SignupFormState =
  | {
      errors?: {
        role?: string[]
        name?: string[]
        email?: string[]
        phone?: string[]
        password?: string[]
        orgName?: string[]
      }
      message?: string
    }
  | undefined

export const LoginFormSchema = z.object({
  email: z.email({ error: '올바른 이메일을 입력해주세요.' }).trim(),
  password: z.string().min(1, { error: '비밀번호를 입력해주세요.' }),
})

export type LoginFormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined
