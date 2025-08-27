// pages/auth/verify-email.tsx - 改善版メール確認待ちページ
import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Mail, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div style={{
    background: 'white',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    padding: '2rem'
  }}>
    {children}
  </div>
)

const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  href?: string
  style?: React.CSSProperties
}> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick, 
  disabled = false,
  className = '',
  href,
  style = {}
}) => {
  const variants = {
    primary: {
      background: disabled ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: 'white',
      border: 'none'
    },
    secondary: {
      background: disabled ? '#f9fafb' : 'white',
      color: disabled ? '#9ca3af' : '#374151',
      border: `1px solid ${disabled ? '#e5e7eb' : '#d1d5db'}`
    },
    ghost: {
      background: 'transparent',
      color: disabled ? '#9ca3af' : '#374151',
      border: 'none'
    }
  }

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' }
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textDecoration: 'none',
    gap: '0.5rem',
    ...variants[variant],
    ...sizes[size],
    ...style
  }

  if (href && !disabled) {
    return (
      <Link 
        href={href} 
        style={baseStyle}
        onMouseEnter={(e) => {
          if (variant === 'primary') {
            (e.target as HTMLAnchorElement).style.transform = 'translateY(-1px)'
            ;(e.target as HTMLAnchorElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLAnchorElement).style.transform = 'translateY(0)'
          ;(e.target as HTMLAnchorElement).style.boxShadow = 'none'
        }}
      >
        {children}
      </Link>
    )
  }

  return (
    <button 
      style={baseStyle} 
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (variant === 'primary' && !disabled) {
          (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'
          ;(e.target as HTMLButtonElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.transform = 'translateY(0)'
        ;(e.target as HTMLButtonElement).style.boxShadow = 'none'
      }}
    >
      {children}
    </button>
  )
}

const VerifyEmail: React.FC = () => {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      // 現在のセッションからユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user?.email) {
        setResendError('ユーザー情報が取得できません。再度登録してください。')
        return
      }

      // 確認メールを再送信
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        setResendError('メール再送信に失敗しました: ' + error.message)
      } else {
        setResendSuccess(true)
      }
    } catch (error) {
      setResendError('予期しないエラーが発生しました')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '3rem 1.5rem'
    }}>
      <Head>
        <title>メール確認 - ケアコネクト</title>
        <meta name="description" content="メールアドレスの確認をお願いします" />
      </Head>
      
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto'
      }}>
        {/* ロゴヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.25rem',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>C</span>
            </div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>ケアコネクト</span>
          </div>
        </div>

        <Card>
          <div style={{ textAlign: 'center' }}>
            {/* メールアイコン */}
            <div style={{
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '4rem',
              width: '4rem',
              borderRadius: '50%',
              background: '#dbeafe',
              marginBottom: '1.5rem'
            }}>
              <Mail style={{ height: '2rem', width: '2rem', color: '#2563eb' }} />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 0.5rem 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              メール確認
            </h2>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              アカウント作成が完了しました
            </p>

            {/* メイン説明 */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                margin: '0 0 1rem 0',
                lineHeight: '1.6',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                ご登録いただいたメールアドレスに確認メールを送信しました。
                <br />
                <strong>メール内のリンクをクリック</strong>してアカウントを有効化してください。
              </p>
            </div>

            {/* 成功メッセージ */}
            {resendSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle style={{ height: '1rem', width: '1rem', color: '#16a34a' }} />
                <span style={{
                  color: '#166534',
                  fontSize: '0.875rem',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  確認メールを再送信しました。メールボックスをご確認ください。
                </span>
              </div>
            )}

            {/* エラーメッセージ */}
            {resendError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle style={{ height: '1rem', width: '1rem', color: '#dc2626' }} />
                <span style={{
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {resendError}
                </span>
              </div>
            )}

            {/* 再送信セクション */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 1rem 0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </p>
              <Button 
                variant="secondary"
                size="md"
                onClick={handleResendEmail}
                disabled={isResending}
                style={{ width: '100%' }}
              >
                <RefreshCw 
                  size={16} 
                  style={{
                    animation: isResending ? 'spin 1s linear infinite' : 'none'
                  }}
                />
                {isResending ? '送信中...' : '確認メールを再送信'}
              </Button>
            </div>

            {/* 注意事項 */}
            <div style={{
              background: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#a16207',
                margin: '0 0 0.5rem 0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>📧 メールが届かない場合</h3>
              <ul style={{
                fontSize: '0.75rem',
                color: '#a16207',
                margin: 0,
                paddingLeft: '1rem',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1.4
              }}>
                <li style={{ marginBottom: '0.25rem' }}>迷惑メール・スパムフォルダをご確認ください</li>
                <li style={{ marginBottom: '0.25rem' }}>メールアドレスが正しいかご確認ください</li>
                <li>しばらく時間をおいてからお試しください</li>
              </ul>
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button 
                variant="primary" 
                size="lg" 
                href="/auth/userlogin"
                style={{ width: '100%' }}
              >
                メール確認後、ログインする →
              </Button>
              
              <Button 
                variant="ghost" 
                size="md" 
                href="/"
                style={{ width: '100%' }}
              >
                <ArrowLeft size={16} />
                トップページに戻る
              </Button>
            </div>
          </div>
        </Card>

        {/* サポート情報 */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            メール認証に関してご不明な点がございましたら{' '}
            <a 
              href="mailto:support@care-connect.jp" 
              style={{
                color: '#22c55e',
                textDecoration: 'none',
                fontWeight: 500
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#16a34a'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#22c55e'}
            >
              サポートまでお問い合わせ
            </a>
            ください
          </p>
        </div>

        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f0f9ff',
            borderRadius: '0.375rem',
            border: '1px solid #bae6fd'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#0369a1',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <strong>開発環境:</strong> Supabaseの設定でメール確認を無効にしている場合、
              このステップはスキップされます。
            </p>
          </div>
        )}
      </div>

      {/* スピンアニメーション */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default VerifyEmail