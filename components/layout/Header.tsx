// components/layout/Header.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useDevice } from '../../hooks/useDevice';

// ★ 統一されたprops型定義
interface HeaderProps {
  isLoggedIn: boolean;
  signOut: () => Promise<{ error?: any }>;
  variant?: 'home' | 'mypage';        // ページの種類
  showContactButton?: boolean;        // お問い合わせボタンの表示制御
  customTitle?: string;              // カスタムタイトル
  hideSubtitle?: boolean;            // サブタイトルの非表示制御
}

// ★ メインのHeaderコンポーネント（デバイス判定）
export default function Header({ 
  isLoggedIn, 
  signOut,
  variant = 'home',
  showContactButton = true,
  customTitle,
  hideSubtitle = false
}: HeaderProps) {
  const { isMobile, isDesktop } = useDevice();

  const commonProps = {
    isLoggedIn,
    signOut,
    variant,
    showContactButton,
    customTitle,
    hideSubtitle
  };

  if (isMobile) {
    return <MobileHeader {...commonProps} />;
  }
  return <DesktopHeader {...commonProps} />;
}

// ★ スマホ版ヘッダー
function MobileHeader({ 
  isLoggedIn, 
  signOut, 
  variant, 
  showContactButton, 
  customTitle, 
  hideSubtitle 
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ページによってタイトルを変更
  const getTitle = () => {
    if (customTitle) return customTitle;
    if (variant === 'mypage') return 'ケアコネクト';
    return 'ケアコネクト';
  };

  return (
    <header style={{
      background: variant === 'mypage' ? '#f8fafc' : 'white', // mypageは背景を薄く
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      borderBottom: '1px solid #e5e7eb',
      padding: '0.5rem 0',
      position: 'relative'
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
                width: '2rem', height: '2rem', 
                background:'#22c55e', 
                borderRadius: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.125rem' }}>C</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
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
              padding: '0.5rem'
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* サブタイトル - variant や hideSubtitle で制御 */}
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
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* ホームリンクをmypageの時だけ表示 */}
              {variant === 'mypage' && (
                <Link href="/" style={{ 
                  padding: '0.75rem', 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  textDecoration: 'none', 
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  ホームに戻る
                </Link>
              )}
              
              {isLoggedIn ? (
                <>
                  {variant !== 'mypage' && (
                    <Link href="/mypage" style={{ 
                      padding: '0.75rem', 
                      background: '#22c55e', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}>
                      マイページ
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await signOut();
                    }}
                    style={{
                      padding: '0.75rem',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" style={{ 
                    padding: '0.75rem', 
                    background: '#f3f4f6', 
                    color: '#374151', 
                    textDecoration: 'none', 
                    borderRadius: '0.375rem',
                    textAlign: 'center'
                  }}>
                    ログイン
                  </Link>
                  <Link href="/auth/register" style={{ 
                    padding: '0.75rem', 
                    background: '#22c55e', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '0.375rem',
                    textAlign: 'center'
                  }}>
                    新規登録
                  </Link>
                </>
              )}
              
              {/* お問い合わせボタン - showContactButtonで制御 */}
              {showContactButton && (
                <button style={{
                  padding: '0.75rem',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}>
                  お問い合わせ
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ★ PC版ヘッダー（既存のDesktopHeaderを同様に修正）
function DesktopHeader({ 
  isLoggedIn, 
  signOut, 
  variant, 
  showContactButton, 
  hideSubtitle 
}: HeaderProps) {
  return (
    <header style={{
      background: variant === 'mypage' ? '#f8fafc' : 'white',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 0'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '2rem', height: '2rem', 
                background: '#22c55e',
                borderRadius: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.125rem' }}>C</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>ケアコネクト</span>
            </div>
          </Link>
          
          {!hideSubtitle && (
            <span style={{ fontSize: '16px', margin: 0 }}>
              {variant === 'mypage' 
                ? ''
                : '東京都の障害福祉サービス事業所検索システム'
              }
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* ホームリンク（mypageの時のみ） */}
          {variant === 'mypage' && (
            <>
              <Link href="/" style={{ 
                padding: '0.5rem 0.75rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                background: '#f3f4f6', 
                borderRadius: '0.375rem', 
                textDecoration: 'none' 
              }}>
                ホームに戻る
              </Link>
              <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>
            </>
          )}

          {isLoggedIn ? (
            <>
              {variant !== 'mypage' && (
                <>
                  <Link href="/mypage" style={{ 
                    padding: '0.5rem 0.75rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'white', 
                    background: '#22c55e', 
                    borderRadius: '0.375rem', 
                    textDecoration: 'none' 
                  }}>
                    マイページ
                  </Link>
                  <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>
                </>
              )}
              <button
                onClick={signOut}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                ログアウト
              </button>
              {showContactButton && <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>}
            </>
          ) : (
            <>
              <Link href="/auth/login" style={{ 
                padding: '0.5rem 0.75rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                background: '#f3f4f6', 
                borderRadius: '0.375rem', 
                textDecoration: 'none' 
              }}>
                ログイン
              </Link>
              <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>
              <Link href="/auth/register" style={{ 
                padding: '0.5rem 0.75rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: 'white', 
                background: '#22c55e', 
                borderRadius: '0.375rem', 
                textDecoration: 'none' 
              }}>
                新規登録
              </Link>
              {showContactButton && <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>}
            </>
          )}
          
          {showContactButton && (
            <button style={{ 
              padding: '0.5rem 0.75rem', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'white', 
              background: '#22c55e', 
              borderRadius: '0.375rem', 
              border: 'none', 
              cursor: 'pointer' 
            }}>
              お問い合わせ
            </button>
          )}
        </div>
      </div>
    </header>
  );
}