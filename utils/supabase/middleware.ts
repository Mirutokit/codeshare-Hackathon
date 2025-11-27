// utils/supabase/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr' // CookieOptionsは必要に応じて残す
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          return request.cookies.get(name)?.value
        },
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        // ▼▼▼ この部分を修正 ▼▼▼
        remove: (name, options) => {
          // .set({...}) の代わりに .delete() を使用する
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
        // ▲▲▲ 修正完了 ▲▲▲
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authRoutes = ['/auth/userlogin', '/auth/facilitylogin']
  if (user && authRoutes.includes(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }
  return response
}