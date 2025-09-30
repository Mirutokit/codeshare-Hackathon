// components/providers/AuthProvider.tsx - 最終改善版
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/router'

// ... (AuthContextType, AuthContext, useAuthContext の定義は変更なし)
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<any>
  signInWithEmail: (email: string, password: string) => Promise<any>
  // ★事業者登録用の関数を追加
  signUpAsFacility: (email: string, password: string, fullName: string) => Promise<any>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // enrichUserWithType関数は変更なし
   const enrichUserWithType = async (user: User): Promise<User> => {

  try {

   const { data: userData } = await supabase

   .from('users')

 .select('user_type')
 .eq('id', user.id).single()


 if (userData?.user_type) {

   return {...user,

user_metadata: { ...user.user_metadata, user_type: userData.user_type }

}

 }

  } catch (error) {

 console.error('ユーザータイプの取得に失敗:', error)

 }

 return user

 }

  useEffect(() => {
    setLoading(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AUTH EVENT: ${event}`)
        if (session?.user) {
          const enrichedUser = await enrichUserWithType(session.user)
          setUser(enrichedUser)
          setSession(session)
        } else {
          setUser(null)
          setSession(null)
        }
        setLoading(false)
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ▼▼▼ 変更点 ▼▼▼
  // 認証状態の変更を監視してリダイレクトを管理するuseEffect
  useEffect(() => {
    // 読み込みが完了しており、かつユーザーがログアウト状態の場合
    if (!loading && !user) {
      // ログインページやサインアップページにいる場合は何もしない
      if (router.pathname.startsWith('/auth')) {
        return;
      }
      
      // それ以外のページにいた場合は、ホームページにリダイレクトする
      router.push('/');
    }
  }, [user, loading, router]);
  // ▲▲▲ 変更点 ▲▲▲

  // ▼▼▼【このuseEffectを修正】▼▼▼
  // ログイン成功後のリダイレクト処理
  useEffect(() => {
    // 読み込みが完了しており、ユーザー情報が存在する場合
    if (!loading && user) {
      // 現在のページが認証関連ページだった場合にリダイレクトを実行
      if (router.pathname.startsWith('/auth')) {
        // ★ユーザータイプに応じてリダイレクト先を振り分ける
        const userType = user.user_metadata?.user_type;

        if (userType === 'facility') {
          // 事業者ユーザーなら事業者マイページへ
          router.push('/business/mypage');
        } else {
          // それ以外のユーザー（一般利用者など）ならホームページへ
          router.push('/');
        }
      }
    }
  }, [user, loading, router]);
  // ▲▲▲【修正完了】▲▲▲


  // signIn, signUp関数は変更なし
  const signInWithEmail = async (email: string, password: string) => {
     return supabase.auth.signInWithPassword({ email, password })
  }
  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, user_type: 'user' } }
    })
  }

   // ▼▼▼【新しい関数を追加】▼▼▼
  const signUpAsFacility = async (email: string, password: string, fullName: string) => {
    // Step 1: ユーザーを'facility'タイプとしてサインアップ
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'facility' // user_typeを'facility'に設定
        }
      }
    });

    if (error) {
      return { data, error };
    }

    // SupabaseのDBトリガー(handle_new_user)がusersテーブルにレコードを作成するのを少し待つ
    // より堅牢にするなら、ここでusersテーブルのレコードをポーリングするが、一旦シンプルな遅延で対応
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 2: facilitiesテーブルに初期レコードを作成
    // 注意: RLS(Row Level Security)で、認証済みユーザーが自身のuser_idでのみinsertできるよう設定が必要
    if (data.user) {
      const { error: facilityError } = await supabase.from('facilities').insert({
        user_id: data.user.id,
        name: `${fullName}の事業所`, // デフォルト名
        is_active: false, // 初期状態は非公開
      });

      if (facilityError) {
        // facilityの作成に失敗した場合、Authは成功しているのでエラーを返す
        console.error('Facility creation failed:', facilityError);
        return { 
          data, 
          error: new Error('認証は成功しましたが、事業者プロファイルの作成に失敗しました。') 
        };
      }
    }
    
    return { data, error };
  };

  // ▼▼▼ 変更点 ▼▼▼
  // signOut関数からリダイレクト処理を削除
  const signOut = async () => {
    await supabase.auth.signOut()
    // リダイレクトは上記のuseEffectが担当する
  }
  // ▲▲▲ 変更点 ▲▲▲

  const value = {
    user,
    session,
    loading,
    signOut,
    signUpWithEmail,
    signInWithEmail,
    signUpAsFacility, // ★valueオブジェクトに新しい関数を追加
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};