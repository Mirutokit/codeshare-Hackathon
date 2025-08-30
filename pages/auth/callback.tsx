// pages/auth/callback.tsx - 統合認証コールバック（OAuth + メール認証）
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AuthStatus = 'processing' | 'success' | 'error' | 'email_confirmed' | 'already_confirmed'

const AuthCallback: React.FC = () => {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>('processing')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== 認証コールバック処理開始 ===')
        console.log('URLパラメータ:', router.query)
        console.log('現在のURL:', window.location.href)

        // URLからパラメータを取得（複数の形式に対応）
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        // 複数のパラメータ形式に対応
        const access_token = router.query.access_token || urlParams.get('access_token') || hashParams.get('access_token')
        const refresh_token = router.query.refresh_token || urlParams.get('refresh_token') || hashParams.get('refresh_token')
        const token_hash = router.query.token_hash || urlParams.get('token_hash') || hashParams.get('token_hash')
        const type = router.query.type || urlParams.get('type') || hashParams.get('type')
        const error_description = router.query.error_description || urlParams.get('error_description') || hashParams.get('error_description')

        console.log('取得したパラメータ:', {
          access_token: access_token ? `存在 (${String(access_token).substring(0, 20)}...)` : 'なし',
          refresh_token: refresh_token ? `存在 (${String(refresh_token).substring(0, 20)}...)` : 'なし',
          token_hash: token_hash ? `存在 (${String(token_hash).substring(0, 20)}...)` : 'なし',
          type,
          error_description
        })

        // エラーがある場合の処理
        if (error_description) {
          console.error('URLエラーパラメータ:', error_description)
          setStatus('error')
          setMessage(decodeURIComponent(error_description as string))
          return
        }

        // 1. セッションを確認
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('現在のセッション:', sessionData.session?.user?.id || 'なし')

        // 2. Supabaseデフォルトテンプレートの token_hash 処理
        if (token_hash && type === 'email') {
          console.log('デフォルトメールテンプレート認証を処理中...')
          
          try {
            const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token_hash as string,
              type: 'email'
            })

            if (verifyError) {
              console.error('メール確認エラー:', verifyError)
              setStatus('error')
              setMessage('メール確認に失敗しました: ' + verifyError.message)
              return
            }

            if (authData.user) {
              console.log('メール確認成功:', authData.user.email)
              setUserEmail(authData.user.email || '')
              setStatus('email_confirmed')
              setMessage('メールアドレスが確認されました！')
              
              // データベースにユーザーレコードを作成
              await ensureUserRecord(authData.user)
              
              // 3秒後にマイページにリダイレクト
              setTimeout(() => router.push('/mypage'), 3000)
              return
            }
          } catch (otpError) {
            console.error('OTP処理エラー:', otpError)
            setStatus('error')
            setMessage('認証処理でエラーが発生しました')
            return
          }
        }

        // 3. トークンベースの認証処理（カスタムテンプレート用）
        if (access_token && refresh_token) {
          console.log('トークンベース認証を処理中...')
          
          const { data: authData, error: authError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string
          })

          if (authError) {
            console.error('セッション設定エラー:', authError)
            setStatus('error')
            setMessage('認証に失敗しました: ' + authError.message)
            return
          }

          if (authData.user) {
            console.log('認証成功:', authData.user.email)
            setUserEmail(authData.user.email || '')
            
            // メール確認の場合
            if (type === 'email_confirmation' || type === 'signup') {
              setStatus('email_confirmed')
              setMessage('メールアドレスが確認されました！')
              
              // データベースにユーザーレコードを作成
              await ensureUserRecord(authData.user)
              
              // 3秒後にマイページにリダイレクト
              setTimeout(() => router.push('/mypage'), 3000)
              return
            }
            
            // その他の認証成功
            setStatus('success')
            setMessage('ログインしました')
            setTimeout(() => router.push('/mypage'), 2000)
            return
          }
        }

        // 4. 既存セッションの確認（ページ直接アクセスなど）
        if (sessionData.session?.user) {
          console.log('既存セッション確認済み')
          
          if (sessionData.session.user.email_confirmed_at) {
            setStatus('already_confirmed')
            setMessage('既に認証済みです')
            setUserEmail(sessionData.session.user.email || '')
            setTimeout(() => router.push('/'), 2000)
          } else {
            setStatus('error')
            setMessage('メールアドレスの確認が必要です')
          }
          return
        }

        // 5. 認証情報がない場合
        console.log('認証情報が見つかりません')
        
        // デバッグ用の詳細情報
        console.log('=== デバッグ詳細情報 ===')
        console.log('window.location.href:', window.location.href)
        console.log('window.location.search:', window.location.search)
        console.log('window.location.hash:', window.location.hash)
        console.log('router.asPath:', router.asPath)
        console.log('router.query:', router.query)
        
        setStatus('error')
        setMessage('認証情報が見つかりません。メール内のリンクが正しくない可能性があります。')

      } catch (error) {
        console.error('認証処理エラー:', error)
        setStatus('error')
        setMessage('予期しないエラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
      }
    }

    // routerの準備ができてから実行
    if (router.isReady) {
      handleAuthCallback()
    }
  }, [router.isReady, router.query, router.asPath])

  // ユーザーレコード作成（メール確認後）- 修正版
  const ensureUserRecord = async (user: any) => {
    try {
      console.log('=== ユーザーレコード確認・作成 ===')
      console.log('ユーザー情報:', user.id, user.email)
      
      // 1. 既存レコードを確認
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .single()

      if (existingUser) {
        console.log('既存ユーザーレコード確認済み:', existingUser.email)
      } else {
        console.log('新規ユーザーレコードを作成中...')
        
        // ON CONFLICT で安全に作成
        const { data: createdUser, error: userError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            user_type: 'user'
          })
          .select()

        if (userError) {
          console.error('ユーザーレコード作成エラー:', userError)
          
          // 重複エラーの場合は警告のみ（トリガーが既に作成した可能性）
          if (userError.code === '23505') {
            console.warn('重複キーエラー（トリガーで既に作成済み）:', userError.message)
          }
        } else {
          console.log('ユーザーレコード作成成功:', createdUser)
        }
      }

      // 2. user_detailsレコードの処理
      const { data: existingDetails, error: detailsCheckError } = await supabase
        .from('user_details')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (existingDetails) {
        console.log('既存user_detailsレコード確認済み')
      } else {
        console.log('新規user_detailsレコードを作成中...')
        
        const { data: createdDetails, error: detailsError } = await supabase
          .from('user_details')
          .insert({
            user_id: user.id,
            receive_notifications: true
          })
          .select()

        if (detailsError) {
          console.error('user_detailsレコード作成エラー:', detailsError)
          
          // 重複エラーの場合は警告のみ
          if (detailsError.code === '23505') {
            console.warn('重複キーエラー（トリガーで既に作成済み）:', detailsError.message)
          }
        } else {
          console.log('user_detailsレコード作成成功:', createdDetails)
        }
      }

      console.log('ユーザーレコード処理完了')

    } catch (error) {
      console.error('ユーザーレコード作成処理エラー:', error)
      // エラーがあっても認証は成功しているので、処理を続行
    }
  }

  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Loader className="animate-spin" size={48} />,
          title: '認証を処理しています...',
          description: 'しばらくお待ちください',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        }
      
      case 'success':
        return {
          icon: <CheckCircle size={48} />,
          title: 'ログイン成功！',
          description: `${userEmail}でログインしました。トップページに移動します...`,
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        }
      
      case 'email_confirmed':
        return {
          icon: <CheckCircle size={48} />,
          title: 'メール確認完了！',
          description: `${userEmail}のメールアドレスが確認されました。マイページに移動します...`,
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        }
      
      case 'already_confirmed':
        return {
          icon: <CheckCircle size={48} />,
          title: '認証済み',
          description: `${userEmail}で既にログイン済みです。トップページに移動します...`,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        }
      
      case 'error':
        return {
          icon: <AlertCircle size={48} />,
          title: '認証エラー',
          description: message,
          bgColor: 'bg-red-50',
          textColor: 'text-red-600'
        }
      
      default:
        return {
          icon: <Loader className="animate-spin" size={48} />,
          title: '処理中...',
          description: '',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600'
        }
    }
  }

  const content = getStatusContent()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Head>
        <title>認証処理中 - ケアコネクト</title>
        <meta name="description" content="認証を処理しています" />
      </Head>
      
      <div className={`max-w-md w-full ${content.bgColor} rounded-lg p-8 text-center border`}>
        <div className={`${content.textColor} mb-6 flex justify-center`}>
          {content.icon}
        </div>
        
        <h1 className={`text-xl font-bold ${content.textColor} mb-4`}>
          {content.title}
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {content.description}
        </p>

        {status === 'error' && (
          <div className="space-y-3">
            <Link 
              href="/auth/userlogin"
              className="inline-block bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              ログインページに戻る
            </Link>
            
            <div className="text-sm text-gray-500">
              問題が続く場合は
              <a 
                href="mailto:support@care-connect.jp" 
                className="text-green-500 hover:underline ml-1"
              >
                サポートにお問い合わせください
              </a>
            </div>
          </div>
        )}

        {(status === 'success' || status === 'email_confirmed' || status === 'already_confirmed') && (
          <div className="text-sm text-gray-500">
            自動的にリダイレクトされます...
          </div>
        )}

        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-left">
            <strong>デバッグ情報:</strong>
            <pre className="mt-1 whitespace-pre-wrap">
              {JSON.stringify({
                status,
                query: router.query,
                userEmail
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback