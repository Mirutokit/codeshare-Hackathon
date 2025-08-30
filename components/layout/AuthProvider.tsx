// components/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ data: any; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // 初期セッション取得（一度だけ実行）
  useEffect(() => {
    if (initialized) return

    console.log('=== AuthProvider初期セッション取得 ===')
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('初期セッション取得エラー:', error)
        } else if (session?.user) {
          console.log('初期セッション検出:', session.user.email)
          setUser(session.user)
        } else {
          console.log('初期セッションなし')
          setUser(null)
        }
      } catch (error) {
        console.error('初期セッション取得例外:', error)
        setUser(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    getInitialSession()
  }, [initialized])

  // 認証状態変更の監視（一度だけ設定）
  useEffect(() => {
    if (!initialized) return

    console.log('=== Auth state listener設定 ===')
    
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth state changed ===', { 
        event, 
        userId: session?.user?.id, 
        timestamp: new Date().toISOString(),
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
        isBrave: typeof navigator !== 'undefined' ? (navigator as any).brave : undefined
      })
      
      switch (event) {
        case 'SIGNED_IN':
          setUser(session?.user ?? null)
          setLoading(false)
          break
        case 'SIGNED_OUT':
          setUser(null)
          setLoading(false)
          break
        case 'TOKEN_REFRESHED':
          setUser(session?.user ?? null)
          break
        case 'USER_UPDATED':
          setUser(session?.user ?? null)
          break
        default:
          console.log('その他のauth event:', event)
      }
    })

    return () => {
      console.log('AuthProvider cleanup: subscription解除')
      subscription.unsubscribe()
    }
  }, [initialized])

  // メモ化されたサインイン関数
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    console.log('=== AuthProvider signInWithEmail ===', { email })
    setLoading(true)

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (result.error) {
        console.error('サインインエラー:', result.error)
      } else {
        console.log('サインイン成功:', result.data.user?.email)
      }

      return result
    } catch (error) {
      console.error('サインイン例外:', error)
      return { data: null, error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [])

  // メモ化されたサインアップ関数
  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string) => {
    console.log('=== AuthProvider signUpWithEmail ===', { email, fullName })
    setLoading(true)

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: 'user' // 一般利用者として登録
          }
        }
      })

      if (result.error) {
        console.error('サインアップエラー:', result.error)
      } else {
        console.log('サインアップ成功:', result.data.user?.email)
      }

      return result
    } catch (error) {
      console.error('サインアップ例外:', error)
      return { data: null, error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [])

  // メモ化されたサインアウト関数
  const signOut = useCallback(async () => {
    console.log('=== AuthProvider signOut ===')
    setLoading(true)

    try {
      const result = await supabase.auth.signOut()
      
      if (result.error) {
        console.error('サインアウトエラー:', result.error)
      } else {
        console.log('サインアウト成功')
        setUser(null)
      }

      return result
    } catch (error) {
      console.error('サインアウト例外:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [])

  // メモ化されたコンテキスト値
  const value = useMemo(() => ({
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }), [user, loading, signInWithEmail, signUpWithEmail, signOut])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}