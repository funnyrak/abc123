import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for system jobs (e.g. the delay-check cron) that
// run without a logged-in user session and need to read/write across
// RLS boundaries. Never import this into anything reachable from a
// user request without its own authorization check first.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
