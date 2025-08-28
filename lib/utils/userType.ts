// lib/utils/userType.ts
import { User } from '@supabase/supabase-js'

export const getUserType = (user: User | null): 'user' | 'facility' | null => {
  if (!user) return null
  
  const userType = user.user_metadata?.user_type
  
  // 事業者の判定
  if (userType === 'facility' || userType === 'business') {
    return 'facility'
  }
  
  // 一般利用者の判定
  if (userType === 'user') {
    return 'user'
  }
  
  return 'user' // デフォルトは一般利用者
}

export const getMyPagePath = (user: User | null): string => {
  const userType = getUserType(user)
  
  switch (userType) {
    case 'facility':
      return '/business/mypage'
    case 'user':
      return '/mypage'
    default:
      return '/auth/userlogin'
  }
}