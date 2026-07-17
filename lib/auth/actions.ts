'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  LoginFormSchema,
  LoginFormState,
  SignupFormSchema,
  SignupFormState,
} from '@/lib/validation/auth'

const ROLE_HOME: Record<string, string> = {
  mentor: '/mentor',
  coordinator: '/coordinator',
  student: '/student',
  admin: '/admin',
}

export async function signup(
  _state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validated = SignupFormSchema.safeParse({
    role: formData.get('role'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    orgCode: formData.get('orgCode') || undefined,
    claimToken: formData.get('claimToken') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { role, name, email, phone, password, orgCode, claimToken } = validated.data
  const supabase = await createClient()

  let orgId: string | null = null
  if (role !== 'mentor') {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_code', orgCode)
      .maybeSingle()

    if (!org) {
      return { errors: { orgCode: ['등록되지 않은 학교/기관 코드입니다.'] } }
    }
    orgId = org.id
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, name, phone, org_id: orgId, claim_token: claimToken ?? null },
    },
  })

  if (error) {
    return { message: error.message }
  }

  if (!data.session) {
    return { message: '가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.' }
  }

  redirect(ROLE_HOME[role] ?? '/')
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validated = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    return { message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  redirect((profile && ROLE_HOME[profile.role]) ?? '/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
