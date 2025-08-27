// pages/auth/facilitylogin.tsx （タブ式対応版）
import React from 'react'
import Head from 'next/head'
import TabbedAuthForm from '@/components/auth/TabbedAuthForm'

const FacilityLoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>施設ログイン - ケアコネクト</title>
        <meta name="description" content="ケアコネクトの施設アカウントにログインして、ブックマークやメッセージ機能をご利用ください" />
      </Head>
      <TabbedAuthForm defaultTab="register" />
    </>
  )
}

export default FacilityLoginPage