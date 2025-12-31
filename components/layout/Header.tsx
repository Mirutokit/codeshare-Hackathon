// components/layout/Header.tsx - スマホ対応版
import React, { useState } from 'react'
import Link from 'next/link'
import { User, LogOut, Building2, Users, HelpCircle } from 'lucide-react' // HelpCircle をインポート
import { useAuthContext } from '@/components/providers/AuthProvider'
import { getMyPagePath, getUserType } from '@/lib/utils/userType'
import { useDevice } from '../../hooks/useDevice'

interface HeaderProps {
  isLoggedIn: boolean
  signOut: () => Promise<{ error?: any }>
  variant?: 'home' | 'mypage'
  showContactButton?: boolean
  showHelpButton?: boolean // ヘルプボタン表示用のPropを追加
  customTitle?: string
  hideSubtitle?: boolean  
  onHelpClick?: () => void // ヘルプボタンのクリックハンドラ
}

const Header: React.FC<HeaderProps> = ({ 
  isLoggedIn, 
  signOut, 
  variant = 'home', 
  showContactButton = true, 
  showHelpButton = true, // Propのデフォルト値を追加
  customTitle,
  hideSubtitle = false,
  onHelpClick
}) => {
  const { user } = useAuthContext()
  const { isMobile } = useDevice()
  
  const userType = getUserType(user)
  const myPagePath = getMyPagePath(user)

  const commonProps = {
    isLoggedIn,
    signOut,
    variant,
    showContactButton,
    showHelpButton, // commonPropsに追加
    customTitle,
    hideSubtitle,
    user,
    userType,
    myPagePath,
    onHelpClick
  }

  if (isMobile) {
    return <MobileHeader {...commonProps} />
  }
  return <DesktopHeader {...commonProps} />
}

// スマホ版ヘッダー
function MobileHeader({ 
  isLoggedIn, 
  signOut, 
  variant, 
  showContactButton, 
  showHelpButton, // Propを受け取る
  customTitle, 
  hideSubtitle,
  user,
  userType,
  myPagePath,
  onHelpClick
}: HeaderProps & { user?: any, userType?: string, myPagePath?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました。もう一度お試しください。');
    }
    // ページ遷移や状態の更新はAuthProviderが自動的に行います。
  }

  const getTitle = () => {
    if (customTitle) return customTitle
    return 'ケアコネクト'
  }

  return (
    <header style={{
      background: variant === 'mypage' ? '#f8fafc' : 'white',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      borderBottom: '1px solid #e5e7eb',
      padding: '0.5rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* メインバー */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          {/* ロゴ */}
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '2rem', 
                height: '2rem', 
                background:'#22c55e', 
                borderRadius: '0.5rem',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <span style={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '1.125rem' 
                }}>
                  C
                </span>
              </div>
              <span style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: '#111827' 
              }}>
                {getTitle()}
              </span>
            </div>
          </Link>

          {/* ハンバーガーメニュー */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#374151'
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* サブタイトル */}
        {!hideSubtitle && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            {variant === 'mypage' 
              ? 'アカウント設定・お気に入り管理' 
              : '東京都の障害福祉サービス事業所検索システム'
            }
          </div>
        )}

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            padding: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem' 
            }}>

              {/* ホームリンクをmypageの時だけ表示 */}
              {variant === 'mypage' && (
                <Link 
                  href="/" 
                  style={{ 
                    padding: '0.75rem', 
                    background: '#f3f4f6', 
                    color: '#374151', 
                    textDecoration: 'none', 
                    borderRadius: '0.375rem',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  ホームに戻る
                </Link>
              )}
              
              {isLoggedIn ? (
                <>
                  {variant !== 'mypage' && (
                    <Link 
                      href={myPagePath} 
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem', 
                        background: '#22c55e', 
                        color: 'white', 
                        textDecoration: 'none', 
                        borderRadius: '0.375rem',
                        fontWeight: '500'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={16} />
                      マイページ
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    <LogOut size={16} />
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/userlogin" 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem', 
                      background: '#f3f4f6', 
                      color: '#374151', 
                      textDecoration: 'none', 
                      borderRadius: '0.375rem',
                      fontWeight: '500'
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users size={16} />
                    利用者ログイン
                  </Link>
                  <Link 
                    href="/auth/facilitylogin" 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem', 
                      background: '#22c55e', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '0.375rem',
                      fontWeight: '500'
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building2 size={16} />
                    事業者ログイン
                  </Link>
                </>
              )}
              
              {/* ヘルプボタン */}
              {showHelpButton && (
                <Link
                  href=""
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f3f4f6', 
                    color: '#374151', 
                    textDecoration: 'none',
                    borderRadius: '0.375rem',
                    textAlign: 'center',
                    fontWeight: '500',
                    border: '1px solid #d1d5db'
                  }}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onHelpClick?.();
                  }}
                >
                  <HelpCircle size={16} />
                  ヘルプ
                </Link>
              )}

              {/* お問い合わせボタン */}
              {showContactButton && (
                <Link
                  href="/contact"
                  style={{
                    padding: '0.75rem',
                    background: '#22c55e',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.375rem',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  お問い合わせ
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// デスクトップ版ヘッダー（レイアウト修正版）
function DesktopHeader({ 
  isLoggedIn, 
  signOut, 
  variant, 
  showContactButton, 
  showHelpButton, // Propを受け取る
  hideSubtitle,
  user,
  userType,
  myPagePath,
  onHelpClick
}: HeaderProps & { user?: any, userType?: string, myPagePath?: string }) {
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました。もう一度お試しください。');
    }
    // ページ遷移や状態の更新はAuthProviderが自動的に行います。
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
        {/* 左側: ロゴ + ユーザー情報 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem' 
        }}>
          {/* ロゴ部分 */}
          <Link 
            href="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              textDecoration: 'none',
              cursor: 'pointer'
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

          {/* ユーザー情報表示 */}
          {isLoggedIn && (
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
          )}
        </div>

        {/* 右側: ナビゲーションボタン */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          {isLoggedIn ? (
            <>
              {/* ホームに戻るボタン（mypageの時のみ） */}
              {variant === 'mypage' && (
                <Link 
                  href="/"
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
                    e.currentTarget.style.backgroundColor = '#22c55e'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#22c55e'
                  }}
                >
                  <User size={16} />
                  ホームに戻る
                </Link>
              )}

              {/* マイページボタン（homeの時のみ） */}
              {variant !== 'mypage' && (
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
                    e.currentTarget.style.backgroundColor = '#22c55e'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#22c55e'
                  }}
                >
                  <User size={16} />
                  マイページ
                </Link>
              )}

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

              {/* ▼▼▼ 追加 ▼▼▼ */}
              {/* ヘルプボタン（ログイン時） */}
              {showHelpButton && (
                <Link
                  href="/help"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#22c55e'
                    e.currentTarget.style.color = '#22c55e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  <HelpCircle size={16} />
                  ヘルプ
                </Link>
              )}
              {/* ▲▲▲ 追加 ▲▲▲ */}

              {/* お問い合わせボタン（ログイン時） */}
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
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#22c55e'
                    e.currentTarget.style.color = '#22c55e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  お問い合わせ
                </Link>
              )}
            </>
          ) : (
            <>
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
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#22c55e'
                  e.currentTarget.style.color = '#22c55e'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.color = '#6b7280'
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
                  e.currentTarget.style.backgroundColor = '#22c55e'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.color = '#22c55e'
                }}
              >
                <Building2 size={16} />
                事業者ログイン
              </Link>
              
              {/* ヘルプボタン（ログアウト時） */}
              {showHelpButton && (
                <Link
                  href=""
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#22c55e'
                    e.currentTarget.style.color = '#22c55e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                  onClick={() => {
                    onHelpClick?.();
                  }}
                >
                  <HelpCircle size={16} />
                  ヘルプ
                </Link>
              )}

              {/* お問い合わせボタン（ログアウト時） */}
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
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#22c55e'
                    e.currentTarget.style.color = '#22c55e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  お問い合わせ
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header