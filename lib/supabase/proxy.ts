import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  mentor: '/mentor',
  coordinator: '/coordinator',
  student: '/student',
  admin: '/admin',
}

const PUBLIC_ROUTES = ['/', '/login', '/signup']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Optimistic check only — refreshes the auth cookie and reads the
  // session. Role-based data access is still enforced by RLS and by
  // each dashboard's own server-side checks.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.includes(path)

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (path === '/login' || path === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const home = profile ? ROLE_HOME[profile.role] : '/'
    return NextResponse.redirect(new URL(home ?? '/', request.url))
  }

  return response
}
