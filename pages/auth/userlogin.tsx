
// pages/auth/userlogin.tsx （タブ式対応版）
import React from 'react'
import Head from 'next/head'
import TabbedAuthForm from '@/components/auth/TabbedAuthForm'

const userLoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>ユーザーログイン - ケアコネクト</title>
        <meta name="description" content="ケアコネクトにログインして、より便利にサービスをご利用ください" />
      </Head>
      <TabbedAuthForm defaultTab="login" />
    </>
  )
}

export default userLoginPage