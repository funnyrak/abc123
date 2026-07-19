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
    orgName: formData.get('orgName') || undefined,
    claimToken: formData.get('claimToken') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { role, name, email, phone, password, orgName, claimToken } = validated.data
  const supabase = await createClient()

  // No pre-registered school/org code needed anymore — coordinators and
  // students just type their org's name, and we reuse an existing org row
  // with that name or create one on the fly.
  let orgId: string | null = null
  if (role !== 'mentor' && orgName) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', orgName)
      .maybeSingle()

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, org_code: `org-${crypto.randomUUID().slice(0, 8)}` })
        .select('id')
        .single()

      if (orgError || !newOrg) {
        return { message: orgError?.message ?? '학교/기관 등록에 실패했습니다.' }
      }
      orgId = newOrg.id
    }
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
