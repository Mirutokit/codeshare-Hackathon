// pages/auth/facilitylogin.tsx - 事業者ログインページ
import React from 'react'
import Head from 'next/head'
import FacilityAuthForm from '@/components/auth/FacilityAuthForm'

const FacilityLoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>事業者ログイン - ケアコネクト</title>
        <meta name="description" content="事業者向けログインページ" />
      </Head>
      <FacilityAuthForm defaultTab="login" />
    </>
  )
}

export default FacilityLoginPage