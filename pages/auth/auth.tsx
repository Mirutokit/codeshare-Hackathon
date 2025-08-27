// pages/auth/auth.tsx - 統合認証ページ
import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import TabbedAuthForm from '@/components/auth/TabbedAuthForm'

const AuthPage: React.FC = () => {
  const router = useRouter()
  const { tab } = router.query
  
  // URLパラメータからデフォルトタブを決定
  const defaultTab = tab === 'register' ? 'register' : 'login'

  return (
    <>
      <Head>
        <title>{defaultTab === 'register' ? '新規登録' : 'ログイン'} - ケアコネクト</title>
        <meta 
          name="description" 
          content={defaultTab === 'register' 
            ? 'ケアコネクトのアカウントを作成して、ブックマークやメッセージ機能をご利用ください' 
            : 'ケアコネクトにログインして、より便利にサービスをご利用ください'
          } 
        />
      </Head>
      <TabbedAuthForm defaultTab={defaultTab} />
    </>
  )
}

export default AuthPage