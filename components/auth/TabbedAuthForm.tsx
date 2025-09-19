// components/auth/TabbedAuthForm.tsx
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, Home, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '@/lib/supabase'

interface TabbedAuthFormProps {
  defaultTab?: 'login' | 'register'
}

const TabbedAuthForm: React.FC<TabbedAuthFormProps> = ({ defaultTab = 'login' }) => {
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
  const [showDevelopmentPopup, setShowDevelopmentPopup] = useState(false)

  // 認証状態変更を監視してリダイレクト
  useEffect(() => {
    // 【ページガード】
    // 認証済みユーザーがこのページにアクセスした場合、ホームページにリダイレクトする
    if (!authLoading && user) {
      console.log('=== 認証済みユーザーを検出、ホームページへリダイレクトします ===');
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowDevelopmentPopup(true)
  }

  const closeDevelopmentPopup = () => {
    setShowDevelopmentPopup(false)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: 認証 - Supabaseに本人確認をしてもらう
      const { data: authData, error: signInError } = await signInWithEmail(
        loginData.email,
        loginData.password
      );

      if (signInError) {
        // 認証自体が失敗した場合（パスワード間違いなど）
        if (signInError.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else {
          setError(`ログインに失敗しました: ${signInError.message}`);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Step 2: 認可 - ユーザー種別を確認する
        const { data: profile, error: profileError } = await supabase
          .from('profiles') // ★ あなたのプロフィールテーブル名に合わせてください
          .select('user_type')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          // プロファイルが見つからない重大なエラー
          setError('ユーザー情報の取得に失敗しました。管理者にお問い合わせください。');
          await supabase.auth.signOut(); // ★ セッションが残らないようにサインアウトさせる
          setLoading(false);
          return;
        }
        
        // Step 3: 権限を検証し、適切な処理を行う
        if (profile.user_type === 'user') {
          // 🎉 成功！利用者アカウントが利用者ページでログインした
          setSuccess('ログイン成功！ホームページに移動します...');
          setIsRedirecting(true);
          router.replace('/');
        } else {
          // 失敗！事業者アカウントなどが利用者ページでログインしようとした
          setError('このアカウントは事業者用です。事業者向けログインページからログインしてください。');
          await supabase.auth.signOut(); // ★ 間違ったセッションを即座に破棄する
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('ログイン処理中に予期せぬエラーが発生しました:', err);
      setError('予期せぬエラーが発生しました。');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading || authLoading) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    // 簡単なバリデーション
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
      console.log('=== 新規登録開始（統合AuthProvider使用） ===')
      console.log('フォームデータ:', registerData)

      // AuthProvider経由でサインアップ
      const { data: authData, error: authError } = await signUpWithEmail(
        registerData.email,
        registerData.password,
        registerData.fullName
      )

      if (authError) {
        console.error('認証エラー詳細分析:', authError)
        
        // 日本語エラーメッセージに変換
        let errorMessage = 'アカウント作成に失敗しました'
        
        if (authError.message) {
          if (authError.message.includes('already registered') || 
              authError.message.includes('User already registered')) {
            errorMessage = 'このメールアドレスは既に登録されています'
          } else if (authError.message.includes('invalid email') ||
                     authError.message.includes('Invalid email')) {
            errorMessage = '無効なメールアドレスです'
          } else if (authError.message.includes('password') ||
                     authError.message.includes('Password')) {
            errorMessage = 'パスワードが要件を満たしていません（6文字以上の英数字）'
          } else {
            errorMessage = `登録に失敗しました: ${authError.message}`
          }
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした')
      }

      console.log('認証成功、ユーザーID:', userId)

      // データベースレコードの作成を試行
      // ... (既存のRPC呼び出し部分は変更なし)

    } catch (err: any) {
      console.error('登録プロセス全体エラー:', err)
      setError(err.message || 'アカウント作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      {isRedirecting && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '0.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', textAlign: 'center', border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              width: '3rem', height: '3rem', 
              border: '3px solid #22c55e', borderTop: '3px solid transparent',
              borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '0.5rem' }}>ログイン完了！</p>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '0.5rem' }}>ホームページに移動しています...</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user?.email} としてログイン中</p>
          </div>
        </div>
      )}

      {showDevelopmentPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10001
        }}>
          <div style={{
            background: 'white', borderRadius: '0.75rem', padding: '2rem',
            maxWidth: '28rem', margin: '1rem', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem', height: '3rem', margin: '0 auto',
                  backgroundColor: '#fef3c7', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🚧</span>
                </div>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                開発中の機能です
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                パスワードリセット機能は現在開発中です。<br />
                しばらくお待ちください。
              </p>
              <button
                onClick={closeDevelopmentPopup}
                style={{
                  backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem', border: 'none', fontSize: '0.875rem',
                  fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '28rem', width: '100%' }}>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem', padding: '0 0.5rem'
        }}>
          <Link href="/" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            textDecoration: 'none', cursor: 'pointer', transition: 'opacity 0.2s'
          }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.8' }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
          >
            <div style={{
              width: '2.5rem', height: '2.5rem', background: '#22c55e', borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.25rem', fontWeight: 'bold'
            }}>
              C
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              ケアコネクト
            </span>
          </Link>
          
          <Link href="/auth/facilitylogin" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem',
            fontWeight: 500, padding: '0.75rem 1rem', borderRadius: '0.5rem',
            border: '1px solid #e5e7eb', transition: 'all 0.2s', background: 'white'
          }}
            onMouseEnter={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = '#f9fafb';
              (e.target as HTMLAnchorElement).style.borderColor = '#22c55e';
              (e.target as HTMLAnchorElement).style.color = '#22c55e';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = 'white';
              (e.target as HTMLAnchorElement).style.borderColor = '#e5e7eb';
              (e.target as HTMLAnchorElement).style.color = '#6b7280';
            }}
          >
            <Home size={16} />
            施設ログイン
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ 
              display: 'flex', background: '#f9fafb', borderBottom: '1px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                style={{
                  flex: 1, padding: '1rem', background: 'none', border: 'none',
                  fontSize: '1rem', fontWeight: activeTab === 'login' ? 600 : 400,
                  color: activeTab === 'login' ? '#22c55e' : '#6b7280',
                  borderBottom: activeTab === 'login' ? '2px solid #22c55e' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                style={{
                  flex: 1, padding: '1rem', background: 'none', border: 'none',
                  fontSize: '1rem', fontWeight: activeTab === 'register' ? 600 : 400,
                  color: activeTab === 'register' ? '#22c55e' : '#6b7280',
                  borderBottom: activeTab === 'register' ? '2px solid #22c55e' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                新規登録
              </button>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                  {activeTab === 'login' ? 'ログイン' : '新規アカウント作成'}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {activeTab === 'login' 
                    ? 'アカウントにログインしてご利用ください' 
                    : '基本情報を入力してアカウントを作成してください'
                  }
                </p>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  {success}
                </div>
              )}

              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      メールアドレス
                    </label>
                    <Input
                      name="email" type="email" value={loginData.email}
                      onChange={handleLoginChange} placeholder="example@email.com"
                      required style={{ width: '12rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      パスワード
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        name="password" type={showPassword ? 'text' : 'password'}
                        value={loginData.password} onChange={handleLoginChange}
                        placeholder="password" required
                        style={{ paddingRight: '2.5rem', width: '12rem'}}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                        position: 'absolute', right: '4.1rem', top: '60%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        color: '#6b7280', cursor: 'pointer', padding: '0.25rem'
                      }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full cta-primary" style={{ 
                    width: '100%', justifyContent: 'center', padding: '0.75rem 1rem',
                    fontSize: '1rem', fontWeight: 600
                  }}>
                    {loading ? 'ログイン中...' : 'ログイン'}
                  </Button>
                  <div style={{ textAlign: 'center' }}>
                    <a href="#" onClick={handleForgotPasswordClick} style={{ 
                      fontSize: '0.875rem', color: '#6b7280', 
                      textDecoration: 'none', cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#22c55e'}
                      onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#6b7280'}
                    >
                      パスワードをお忘れの場合
                    </a>
                  </div>
                </form>
              )}

              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Register Form Fields */}
                </form>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            お困りの場合は{' '}
            <a href="mailto:support@care-connect.jp" style={{ color: '#22c55e', textDecoration: 'none' }}>
              サポートまでお問い合わせください
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default TabbedAuthForm