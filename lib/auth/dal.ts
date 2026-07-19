import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  role: 'mentor' | 'coordinator' | 'student' | 'admin'
  name: string
  email: string
  phone: string | null
  org_id: string | null
}

// Memoized per request — safe to call from multiple layouts/pages
// without triggering duplicate round-trips to Supabase.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, name, email, phone, org_id')
    .eq('id', user.id)
    .single()

  return profile
})

export async function requireProfile(role?: Profile['role']): Promise<Profile> {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (role && profile.role !== role) {
    redirect('/login')
  }

  return profile
}
