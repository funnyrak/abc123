'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'
import { OrganizationFormState, OrganizationSchema } from '@/lib/validation/organization'

export async function createOrganization(
  _state: OrganizationFormState,
  formData: FormData
): Promise<OrganizationFormState> {
  await requireProfile('admin')

  const validated = OrganizationSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    address: formData.get('address') || undefined,
    orgCode: formData.get('orgCode'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('organizations').insert({
    name: validated.data.name,
    type: validated.data.type,
    address: validated.data.address || null,
    org_code: validated.data.orgCode,
  })

  if (error) {
    return {
      message: error.code === '23505' ? '이미 사용 중인 코드입니다.' : error.message,
    }
  }

  revalidatePath('/admin/organizations')
  return { message: '학교/기관을 추가했습니다.' }
}

export async function toggleQnaSubscription(orgId: string, active: boolean) {
  await requireProfile('admin')
  const supabase = await createClient()

  await supabase
    .from('organizations')
    .update({ qna_subscription_status: active ? 'active' : 'inactive' })
    .eq('id', orgId)

  revalidatePath('/admin/organizations')
}
