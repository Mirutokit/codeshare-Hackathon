// components/layout/Header.tsx - 修正版
import React from 'react'
import Link from 'next/link'
import { User, LogOut, Settings, Building2, Users } from 'lucide-react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { getMyPagePath, getUserType } from '@/lib/utils/userType'

interface HeaderProps {
  isLoggedIn: boolean
  signOut: () => Promise<{ error?: any }>
  variant?: 'home' | 'mypage'
  showContactButton?: boolean
}

const Header: React.FC<HeaderProps> = ({ 
  isLoggedIn, 
  signOut, 
  variant = 'home', 
  showContactButton = false 
}) => {
  const { user } = useAuthContext()
  
  // ユーザータイプの取得
  const userType = getUserType(user)
  const myPagePath = getMyPagePath(user)

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      console.error("ログアウトエラー:", error.message)
      alert("ログアウトに失敗しました")
    }
  }

  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto', 
        padding: '0 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* ロゴ部分 */}
        <Link 
          href="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.opacity = '1'
          }}
        >
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            background: '#22c55e',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold'
          }}>
            C
          </div>
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: '#111827' 
          }}>
            ケアコネクト
          </span>
        </Link>

        {/* 右側のナビゲーション */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          {/* お問い合わせボタン（オプション） */}
          {showContactButton && (
            <Link 
              href="/contact" 
              style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLAnchorElement).style.backgroundColor = '#f9fafb'
                ;(e.target as HTMLAnchorElement).style.borderColor = '#22c55e'
                ;(e.target as HTMLAnchorElement).style.color = '#22c55e'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'
                ;(e.target as HTMLAnchorElement).style.borderColor = '#d1d5db'
                ;(e.target as HTMLAnchorElement).style.color = '#6b7280'
              }}
            >
              お問い合わせ
            </Link>
          )}

          {/* ログイン状態に応じた表示 */}
          {isLoggedIn ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem' 
            }}>
              {/* ユーザータイプ表示 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                {userType === 'facility' ? (
                  <>
                    <Building2 size={16} />
                    <span>事業者</span>
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    <span>利用者</span>
                  </>
                )}
                <span>: {user?.user_metadata?.full_name || user?.email}</span>
              </div>

              {/* マイページボタン */}
              <Link 
                href={myPagePath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#22c55e',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #22c55e',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLAnchorElement).style.backgroundColor = '#22c55e'
                  ;(e.target as HTMLAnchorElement).style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'
                  ;(e.target as HTMLAnchorElement).style.color = '#22c55e'
                }}
              >
                <User size={16} />
                マイページ
              </Link>

              {/* ログアウトボタン */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#ef4444'
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                <LogOut size={16} />
                ログアウト
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}>
              {/* 利用者ログインボタン */}
              <Link 
                href="/auth/userlogin" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLAnchorElement).style.backgroundColor = '#f9fafb'
                  ;(e.target as HTMLAnchorElement).style.borderColor = '#22c55e'
                  ;(e.target as HTMLAnchorElement).style.color = '#22c55e'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLAnchorElement).style.backgroundColor = 'white'
                  ;(e.target as HTMLAnchorElement).style.borderColor = '#e5e7eb'
                  ;(e.target as HTMLAnchorElement).style.color = '#6b7280'
                }}
              >
                <Users size={16} />
                利用者ログイン
              </Link>

              {/* 事業者ログインボタン */}
              <Link 
                href="/auth/facilitylogin" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: '#22c55e',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #22c55e',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLAnchorElement).style.backgroundColor = '#22c55e'
                  ;(e.target as HTMLAnchorElement).style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLAnchorElement).style.backgroundColor = 'white'
                  ;(e.target as HTMLAnchorElement).style.color = '#22c55e'
                }}
              >
                <Building2 size={16} />
                事業者ログイン
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header