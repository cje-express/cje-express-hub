import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_DEMO_MODE, DEMO_COOKIE, getDemoProfile } from '@/lib/demo'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- DEMO MODE ---
  if (IS_DEMO_MODE) {
    const userId = request.cookies.get(DEMO_COOKIE)?.value
    const publicRoutes = ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/api/']
    const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r))

    if (!userId && !isPublicRoute && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (userId) {
      const profile = getDemoProfile(userId)

      if (pathname === '/login' || pathname === '/register' || pathname === '/') {
        const dest = (profile?.role === 'SUPER_ADMIN_CJE' || profile?.role === 'OPERADOR_CJE')
          ? '/admin/dashboard'
          : '/cliente/dashboard'
        return NextResponse.redirect(new URL(dest, request.url))
      }

      if (pathname.startsWith('/admin')) {
        if (profile?.role !== 'SUPER_ADMIN_CJE' && profile?.role !== 'OPERADOR_CJE') {
          return NextResponse.redirect(new URL('/cliente/dashboard', request.url))
        }
      }

      if (pathname.startsWith('/cliente')) {
        if (profile?.role === 'SUPER_ADMIN_CJE' || profile?.role === 'OPERADOR_CJE') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
      }
    }

    return NextResponse.next()
  }

  // --- SUPABASE MODE ---
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicRoutes = ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/api/']
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r))

  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = (profile?.role === 'SUPER_ADMIN_CJE' || profile?.role === 'OPERADOR_CJE')
      ? '/admin/dashboard'
      : '/cliente/dashboard'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('auth_user_id', user.id).single()
    if (profile?.role !== 'SUPER_ADMIN_CJE' && profile?.role !== 'OPERADOR_CJE') {
      return NextResponse.redirect(new URL('/cliente/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/cliente') && user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('auth_user_id', user.id).single()
    if (profile?.role === 'SUPER_ADMIN_CJE' || profile?.role === 'OPERADOR_CJE') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
