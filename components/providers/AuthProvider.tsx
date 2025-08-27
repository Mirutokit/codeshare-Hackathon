// components/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/router'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ data: any, error: any }>
  signInWithEmail: (email: string, password: string) => Promise<{ data: any, error: any }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Braveブラウザの検出
  const isBrave = () => {
    return (navigator as any).brave && (navigator as any).brave.isBrave
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('=== AuthProvider初期セッション取得 ===')
        
        // Braveブラウザの場合、少し遅延を加える
        if (isBrave()) {
          console.log('Braveブラウザを検出、遅延処理を適用')
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('初期セッション取得エラー:', error)
        } else {
          console.log('初期セッション:', session?.user?.id || 'なし')
        }
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('セッション取得例外:', err)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== Auth state changed ===', {
          event,
          userId: session?.user?.id || 'no user',
          timestamp: new Date().toISOString(),
          currentPath: router.pathname,
          isBrave: isBrave()
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // SIGNED_OUT イベントの場合のみ、ログインページ以外からのリダイレクトを防ぐ
        if (event === 'SIGNED_OUT') {
          console.log('サインアウト検出: 現在のパス =', router.pathname)
          
          // Braveの場合、より長い遅延を適用
          const delay = isBrave() ? 300 : 100
          
          // メインページ以外にいる場合のみリダイレクト
          if (router.pathname !== '/' && router.pathname !== '/auth/login') {
            setTimeout(() => {
              router.push('/')
            }, delay)
          }
        }
      }
    )

    return () => {
      console.log('AuthProvider cleanup: subscription解除')
      subscription.unsubscribe()
    }
  }, [router])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('=== AuthProvider signInWithEmail ===', { email })
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('サインイン結果:', {
        success: !error,
        userId: data?.user?.id || 'なし',
        error: error?.message || 'なし'
      })
      
      return { data, error }
    } catch (err) {
      console.error('サインイン例外:', err)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      console.log('=== AuthProvider signUpWithEmail ===')
      console.log('パラメータ:', { email, passwordLength: password.length, fullName })
      setLoading(true)
      
      // バリデーション
      if (!email || !password || !fullName) {
        const error = { message: '必須項目が不足しています' }
        return { data: null, error }
      }
      
      if (password.length < 6) {
        const error = { message: 'パスワードは6文字以上である必要があります' }
        return { data: null, error }
      }
      
      console.log('Supabase Auth signUpを呼び出し中...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })
      
      console.log('=== AuthProvider signUpWithEmail完了 ===')
      console.log('結果:', {
        success: !error,
        userId: data?.user?.id || 'なし',
        sessionExists: !!data?.session,
        needsConfirmation: data?.user && !data.session,
        error: error ? {
          message: error.message,
          status: (error as any).status,
          code: (error as any)?.code
        } : 'なし'
      })
      
      return { data, error }
      
    } catch (err) {
      console.error('=== AuthProvider signUpWithEmail例外 ===')
      console.error('例外詳細:', {
        message: err instanceof Error ? err.message : err,
        type: typeof err
      })
      
      return { 
        data: null, 
        error: { message: err instanceof Error ? err.message : 'Unknown signup error' }
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('=== AuthProvider signOut 開始 ===')
      setLoading(true)
      
      // Braveブラウザでセッションが既にクリアされている可能性をチェック
      const currentSession = await supabase.auth.getSession()
      console.log('現在のセッション状態:', currentSession.data.session ? 'あり' : 'なし')
      
      // セッションが存在する場合のみサインアウト処理を実行
      if (currentSession.data.session) {
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('サインアウト失敗:', error)
          // AuthSessionMissingErrorの場合は成功として扱う
          if (error.message?.includes('Auth session missing')) {
            console.log('セッションが既にクリアされているため、成功として処理')
          } else {
            return { error }
          }
        } else {
          console.log('サインアウト成功')
        }
      } else {
        console.log('セッションが既に存在しないため、クリーンアップのみ実行')
      }
      
      // 状態を確実にクリア
      setUser(null)
      setSession(null)
      
      // Braveブラウザの場合、強制的にリロードすることでセッションクリアを確実にする
      if (isBrave()) {
        console.log('Braveブラウザ検出: 強制リロードでセッションクリア')
        // ローカルストレージもクリア
        try {
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        } catch (e) {
          console.log('ストレージクリア中にエラー（無視）:', e)
        }
        window.location.href = '/'
        return { error: null }
      }
      
      // 他のブラウザは通常のリダイレクト
      setTimeout(() => {
        if (router.pathname !== '/') {
          router.push('/')
        }
      }, 200)
      
      return { error: null }
    } catch (err) {
      console.error('サインアウト例外:', err)
      
      // AuthSessionMissingErrorの場合は成功として扱う
      if (err instanceof Error && err.message?.includes('Auth session missing')) {
        console.log('セッションなしエラーを成功として処理')
        setUser(null)
        setSession(null)
        
        if (isBrave()) {
          window.location.href = '/'
        } else {
          router.push('/')
        }
        
        return { error: null }
      }
      
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    signUpWithEmail,
    signInWithEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}