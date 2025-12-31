// lib/hooks/useAuth.tsx - 統合版
import { useContext } from 'react'
import { AuthContext } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase/client'

// AuthContextから値を取得するフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 追加のヘルパーフック（必要に応じて）
export function useAuthContext() {
  return useAuth() // 同じものを参照
}

// 事業者向けサインアップ関数（既存機能を維持）
export const signUpFacilityWithEmail = async (
  email: string,
  password: string,
  fullName: string,
  businessName: string,
  businessType: string
) => {
  try {
    console.log('🏢 事業者サインアップ開始:', { email, businessName, businessType })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
          business_type: businessType,
          user_type: 'facility' // 🔑 重要: handle_new_userがこれを見る
        }
      }
    })

    if (error) {
      console.error('❌ 事業者サインアップエラー:', error)
    } else {
      console.log('✅ 事業者サインアップ成功:', data.user?.id)
    }

    return { data, error }
  } catch (error) {
    console.error('❌ 事業者サインアップ例外:', error)
    return { data: null, error }
  }
}