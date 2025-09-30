// app/api/auth/logout/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // ユーザーのセッション情報を取得
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // セッションが存在すればサインアウト処理を実行
  if (session) {
    await supabase.auth.signOut()
  }

  // ログアウト後はトップページなどにリダイレクト
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  })
}