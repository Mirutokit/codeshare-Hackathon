// pages/contact/success.tsx - お問い合わせ送信完了ページ
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home, Mail } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ContactSuccessPage: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const isLoggedIn = !!user;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>お問い合わせ送信完了 - ケアコネクト</title>
        <meta name="description" content="お問い合わせが正常に送信されました。ありがとうございます。" />
      </Head>

      <Header 
        isLoggedIn={isLoggedIn}
        signOut={signOut}
        showContactButton={false}
      />

      <main style={{ flex: 1, backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* パンくずリスト */}
          <nav style={{ marginBottom: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Link href="/" style={{ color: '#22c55e', textDecoration: 'none' }}>
              ホーム
            </Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <Link href="/contact" style={{ color: '#22c55e', textDecoration: 'none' }}>
              お問い合わせ
            </Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <span>送信完了</span>
          </nav>

          {/* メインコンテンツ */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '3rem 2rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            {/* 成功アイコン */}
            <div style={{
              width: '5rem',
              height: '5rem',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              animation: 'pulse 2s infinite'
            }}>
              <CheckCircle size={32} color="white" />
            </div>

            {/* メッセージ */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 1rem 0'
            }}>
              送信完了
            </h1>

            <p style={{
            color: '#6b7280',
            fontSize: '0.925rem',
            margin: '0 0 2rem 0',
            lineHeight: '1.6' 
            }}>
            お問い合わせありがとうございます。<br />
            お送りいただいた内容を確認し、<br />
            担当者より回答させていただきます。
            </p>

            {/* 詳細情報 */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Mail size={20} color="#22c55e" />
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#15803d',
                  margin: 0
                }}>
                  お問い合わせについて
                </h3>
              </div>
              
              <ul style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: '#374151',
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}>
                <li>お問い合わせ内容はシステムに保存されました</li>
                <li>内容を確認後、担当者よりご連絡いたします</li>
                <li>回答までに数日お時間をいただく場合があります</li>
                <li>緊急の場合は、お電話でのお問い合わせもご利用ください</li>
              </ul>
            </div>
          </div>

          {/* 追加情報 */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <p style={{ margin: 0 }}>
              その他のご質問がございましたら、
              <Link 
                href="/contact" 
                style={{ color: '#22c55e', textDecoration: 'none', fontWeight: '500' }}
              >
                お問い合わせフォーム
              </Link>
              をご利用ください。
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* アニメーション用CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default ContactSuccessPage;
