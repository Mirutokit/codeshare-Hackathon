// components/auth/FacilityAuthForm.tsx
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, Home, Eye, EyeOff, User, Building2, Users } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '@/lib/supabase'

interface FacilityAuthFormProps {
  defaultTab?: 'login' | 'register'
}

const FacilityAuthForm: React.FC<FacilityAuthFormProps> = ({ defaultTab = 'login' }) => {
  const router = useRouter()
  const { user, signInWithEmail, signUpWithEmail, loading: authLoading } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // 認証状態変更を監視してリダイレクト
  useEffect(() => {
    if (user && !authLoading && !isRedirecting) {
      console.log('=== 事業者認証状態検出、リダイレクト実行 ===')
      console.log('User:', user.email)
      console.log('Current path:', router.asPath)
      
      // 施設ログインページにいる場合のみリダイレクト
      if (router.asPath === '/auth/facilitylogin' || router.asPath.includes('/auth/facilitylogin')) {
        console.log('施設ログインページからマイページへリダイレクト')
        
        setIsRedirecting(true)
        setSuccess('ログイン成功！事業者マイページに移動します...')
        
        setTimeout(() => {
          // 複数の方法で確実にリダイレクト
          try {
            router.replace('/business/mypage')
          } catch (error) {
            console.warn('Router failed, using window.location')
            window.location.href = '/business/mypage'
          }
        }, 1000)
      }
    }
  }, [user, authLoading, router, isRedirecting])

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('=== 事業者ログイン処理開始 ===')

    try {
      const { error } = await signInWithEmail(loginData.email, loginData.password)
      
      if (error) {
        console.error('事業者ログインエラー:', error)
        
        if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
          setError('メールアドレスの確認が完了していません。確認メールをご確認いただくか、開発環境の場合はSupabaseの設定をご確認ください。')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。')
        } else {
          setError('ログインに失敗しました: ' + error.message)
        }
      } else {
        console.log('=== 事業者ログイン成功、認証状態変更を待機 ===')
        setSuccess('ログインに成功しました。認証状態を更新中...')
        
        // 認証状態の変更はuseEffectで処理される
      }
    } catch (err) {
      console.error('事業者ログイン処理例外:', err)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading || authLoading) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    // バリデーション（基本情報のみ）
    if (!registerData.email || !registerData.password || !registerData.fullName) {
      setError('すべての項目を入力してください')
      setLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      console.log('=== 事業者新規登録開始（簡素化版） ===')

      // Step 1: メタデータ付きで事業者ユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            user_type: 'facility' // 事業者として識別
          }
        }
      })

      if (authError) {
        console.error('認証エラー:', authError)
        setError(getAuthErrorMessage(authError))
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした')
      }

      console.log('Step 1完了 - ユーザーID:', userId)

      // Step 2: handle_new_user処理待機
      console.log('Step 2: handle_new_user処理待機中...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 3: 基本的なfacilityレコードを作成（詳細は後でマイページで設定）
      console.log('Step 3: 基本facility情報作成中...')
      const { error: facilityError } = await supabase
        .from('facilities')
        .insert({
          user_id: userId,
          name: '事業所名を設定してください', // デフォルト値
          description: '事業所の詳細情報を入力してください',
          address: '住所を入力してください',
          district: '新宿区', // デフォルト値
          phone_number: null,
          is_active: false // 詳細設定完了まで非公開
        })

      if (facilityError) {
        console.error('facility作成エラー:', facilityError)
        
        // 手動でpublic.usersレコード作成を試行
        console.log('手動でpublic.usersレコード作成を試行...')
        await supabase.rpc('create_user_manually', {
          p_user_id: userId,
          p_email: registerData.email,
          p_full_name: registerData.fullName,
          p_user_type: 'facility'
        })
        
        // 再度facilityレコード作成を試行
        const { error: retryError } = await supabase
          .from('facilities')
          .insert({
            user_id: userId,
            name: '事業所名を設定してください',
            description: '事業所の詳細情報を入力してください',
            address: '住所を入力してください',
            district: '新宿区',
            phone_number: null,
            is_active: false
          })
        
        if (retryError) {
          setError('事業者アカウント作成に失敗しました。サポートまでお問い合わせください。')
          setLoading(false)
          return
        }
      }

      console.log('事業者アカウント作成完了')

      if (authData.user?.email_confirmed_at) {
        setSuccess('事業者アカウント作成が完了しました！事業者マイページで事業所情報を設定してください。')
        setTimeout(() => router.push('/business/mypage'), 2000)
      } else {
        setSuccess('事業者アカウント作成が完了しました！メール確認後、事業者マイページで事業所情報を設定してください。')
        setTimeout(() => router.push('/auth/verify-email'), 2000)
      }

    } catch (err: any) {
      console.error('登録プロセスエラー:', err)
      setError(err.message || 'アカウント作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // エラーメッセージのヘルパー関数
  const getAuthErrorMessage = (error: any): string => {
    if (error.message) {
      if (error.message.includes('already registered') || 
          error.message.includes('User already registered')) {
        return 'このメールアドレスは既に登録されています'
      } else if (error.message.includes('invalid email') ||
                 error.message.includes('Invalid email')) {
        return '無効なメールアドレスです'
      } else if (error.message.includes('password') ||
                 error.message.includes('Password')) {
        return 'パスワードが要件を満たしていません（6文字以上の英数字）'
      } else if (error.message.includes('network') ||
                 error.message.includes('fetch')) {
        return 'ネットワークエラーが発生しました。インターネット接続を確認してください'
      } else if (error.message.includes('email_not_confirmed') || 
                 error.message.includes('Email not confirmed')) {
        return 'メールアドレスの確認が完了していません。確認メールをご確認いただくか、開発環境の場合はSupabaseの設定をご確認ください。'
      } else if (error.message.includes('Invalid login credentials')) {
        return 'メールアドレスまたはパスワードが正しくありません。'
      }
    }
    return `登録に失敗しました: ${error.message}`
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegisterData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      {/* 認証済みでリダイレクト中の場合は、リダイレクトオーバーレイを表示 */}
      {isRedirecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '3px solid #22c55e',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '0.5rem' }}>
              事業者ログイン完了！
            </p>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '0.5rem' }}>
              事業者マイページに移動しています...
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {user?.email} としてログイン中
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '32rem', width: '100%' }}>
        {/* ヘッダーナビゲーション */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0 0.5rem'
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
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
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
        </div>

        {/* メインコンテンツヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Building2 size={28} style={{ color: '#22c55e' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              事業者向けサービス
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            事業所情報の管理・編集やサービス設定ができます
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* タブヘッダー */}
          <div style={{ 
            display: 'flex',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: activeTab === 'login' ? 600 : 400,
                color: activeTab === 'login' ? '#22c55e' : '#6b7280',
                borderBottom: activeTab === 'login' ? '2px solid #22c55e' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: activeTab === 'register' ? 600 : 400,
                color: activeTab === 'register' ? '#22c55e' : '#6b7280',
                borderBottom: activeTab === 'register' ? '2px solid #22c55e' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              新規登録
            </button>
          </div>

          {/* タブコンテンツ */}
          <div style={{ padding: '2rem' }}>
            {/* タブコンテンツヘッダー */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                {activeTab === 'login' ? '事業者ログイン' : '事業者アカウント作成'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {activeTab === 'login' 
                  ? '事業者アカウントにログインしてご利用ください' 
                  : '事業者情報を入力してアカウントを作成してください'
                }
              </p>
            </div>

          {/* エラー・成功メッセージ */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
              {error.includes('email_not_confirmed') && activeTab === 'login' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Link 
                    href="/auth/verify-email" 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: '#2563eb', 
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    メール確認ページを見る →
                  </Link>
                </div>
              )}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {success}
            </div>
          )}

          {/* ログインフォーム */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  メールアドレス
                </label>
                <Input
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  パスワード
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="パスワードを入力"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full cta-primary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    ログイン中...
                  </div>
                ) : (
                  'ログイン'
                )}
              </Button>

              {/* パスワードを忘れた場合 */}
              <div style={{ textAlign: 'center' }}>
                <a 
                  href="/auth/forgot-password" 
                  style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    textDecoration: 'none' 
                  }}
                  onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#22c55e'}
                  onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#6b7280'}
                >
                  パスワードをお忘れの場合
                </a>
              </div>
            </form>
          )}

          {/* 新規登録フォーム */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  担当者名 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Input
                  name="fullName"
                  type="text"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  placeholder="山田 太郎"
                  required
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  事業所の担当者名を入力してください
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  メールアドレス <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  パスワード <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="6文字以上で入力"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  6文字以上の英数字を組み合わせてください
                </p>
              </div>

              {/* 事業所情報は後で設定する旨を案内 */}
              <div style={{ 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#166534',
                border: '1px solid #bbf7d0'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>
                  事業所情報について
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  事業所名・住所・サービス詳細などは、アカウント作成後にマイページで設定いただけます。
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading || authLoading}
                className="w-full cta-primary"
                disabled={loading || authLoading}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {loading || authLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    アカウント作成中...
                  </div>
                ) : (
                  '事業者アカウント作成'
                )}
              </Button>

              {/* 利用規約・プライバシーポリシー */}
              <div style={{ 
                padding: '1rem', 
                background: '#f9fafb', 
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                アカウント作成により、
                <a href="/terms" style={{ color: '#22c55e', textDecoration: 'none' }}>利用規約</a>
                と
                <a href="/privacy" style={{ color: '#22c55e', textDecoration: 'none' }}>プライバシーポリシー</a>
                に同意したものとみなされます
              </div>
            </form>
          )}

          {/* 開発環境でのヒント */}
          {process.env.NODE_ENV === 'development' && activeTab === 'login' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#f0f9ff', 
              borderRadius: '0.375rem', 
              border: '1px solid #bae6fd' 
            }}>
              <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0 }}>
                開発環境: メール確認エラーが出る場合は、Supabaseで「Enable email confirmations」をOFFにしてください。
              </p>
            </div>
          )}

          {/* ゲストアクセス案内（ログインタブのみ） */}
          {activeTab === 'login' && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#f0fdf4', 
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid #bbf7d0'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#166534', margin: '0 0 0.5rem 0', fontWeight: 500 }}>
                まずはサービスを確認してみませんか？
              </p>
              <Link 
                href="/" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: '#22c55e', 
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                事業所検索を見てみる →
              </Link>
            </div>
          )}
          </div>
        </div>

        {/* フッター情報 */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            お困りの場合は{' '}
            <a 
              href="mailto:support@care-connect.jp" 
              style={{ color: '#22c55e', textDecoration: 'none' }}
            >
              サポートまでお問い合わせください
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default FacilityAuthForm