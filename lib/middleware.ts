// utils/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  // ▼▼▼【この行を追加】▼▼▼
  // すべてのレスポンスにキャッシュを無効化するヘッダーを設定
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  // ▲▲▲【追加完了】▲▲▲
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        // ★ signOut()が呼び出されると、この部分が実行される
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // ★ Cookieの値を空にしてブラウザに返すことで削除を実現
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}