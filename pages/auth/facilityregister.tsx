// pages/auth/facilityregister.tsx - 事業者新規登録ページ  
import React from 'react'
import Head from 'next/head'
import FacilityAuthForm from '@/components/auth/FacilityAuthForm'

const FacilityRegisterPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>事業者新規登録 - ケアコネクト</title>
        <meta name="description" content="事業者向け新規登録ページ" />
      </Head>
      <FacilityAuthForm defaultTab="register" />
    </>
  )
}

export default FacilityRegisterPage