// pages/auth/userlogin.tsx - 利用者ログインページ（既存のTabbedAuthFormを使用）
import React from 'react'
import Head from 'next/head'
import TabbedAuthForm from '@/components/auth/TabbedAuthForm'

const UserLoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>利用者ログイン - ケアコネクト</title>
        <meta name="description" content="利用者向けログイン・新規登録ページ" />
      </Head>
      <TabbedAuthForm defaultTab="login" />
    </>
  )
}

export default UserLoginPage