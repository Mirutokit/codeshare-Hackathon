// pages/dashboard.tsx
import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

const DashboardPage: React.FC = () => {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  // 認証チェック
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/userlogin')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('ログアウトエラー:', error)
      alert('ログアウトに失敗しました。')
      return
    }
    router.push('/auth/userlogin')
  }

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner">⏳</div>
          <p style={{ color: '#6b7280' }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // リダイレクト中
  }

  return (
    <>
      <Head>
        <title>ダッシュボード - ケアコネクト</title>
      </Head>
      
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        {/* ヘッダー */}
        <header className="header">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" className="logo-container">
                <div className="logo">C</div>
                <span className="main-title">ケアコネクト</span>
              </Link>
              <button onClick={handleSignOut} className="cta-secondary">
                ログアウト
              </button>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
              ダッシュボード
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>
                  ログイン成功！
                </h3>
                <p style={{ color: '#15803d' }}>
                  認証システムが正常に動作しています。
                </p>
              </div>

              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  ユーザー情報
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>メール:</strong> {user.email}</p>
                  <p><strong>名前:</strong> {user.user_metadata?.full_name || '未設定'}</p>
                  <p><strong>登録日時:</strong> {new Date(user.created_at).toLocaleString('ja-JP')}</p>
                  <p><strong>メール確認:</strong> {user.email_confirmed_at ? '確認済み' : '未確認'}</p>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem'  }}>
                <Link href="/" className="cta-primary">
                  検索ページ
                </Link>
                <Link href="/mypage" className="cta-primary">
                  マイページ
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default DashboardPage