// pages/contact/index.tsx - お問い合わせフォーム
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Mail, MessageSquare, User, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface FormData {
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  email?: string;
  subject?: string;
  message?: string;
  submit?: string;
}

const ContactPage: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const [formData, setFormData] = useState<FormData>({
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoggedIn = !!user;

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // メールアドレスの検証
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // 件名の検証
    if (!formData.subject.trim()) {
      newErrors.subject = '件名は必須です';
    } else if (formData.subject.length > 500) {
      newErrors.subject = '件名は500文字以内で入力してください';
    }

    // メッセージの検証
    if (!formData.message.trim()) {
      newErrors.message = 'お問い合わせ内容は必須です';
    } else if (formData.message.length < 10) {
      newErrors.message = 'お問い合わせ内容は10文字以上で入力してください';
    } else if (formData.message.length > 5000) {
      newErrors.message = 'お問い合わせ内容は5000文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim()
        });

      if (error) {
        console.error('お問い合わせ送信エラー:', error);
        setErrors({ submit: 'お問い合わせの送信に失敗しました。しばらく時間をおいて再度お試しください。' });
        return;
      }

      // 送信完了ページに遷移
      router.push('/contact/success');
    } catch (error) {
      console.error('予期しないエラー:', error);
      setErrors({ submit: 'システムエラーが発生しました。しばらく時間をおいて再度お試しください。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 入力値の変更
  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>お問い合わせ - ケアコネクト</title>
        <meta name="description" content="ケアコネクトへのお問い合わせフォームです。ご質問やご要望がございましたらお気軽にお問い合わせください。" />
      </Head>

      <Header 
        isLoggedIn={isLoggedIn}
        signOut={signOut}
        showContactButton={false}
      />

      <main style={{ flex: 1, backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* パンくずリスト */}
          <nav style={{ marginBottom: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Link href="/" style={{ color: '#22c55e', textDecoration: 'none' }}>
              ホーム
            </Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <span>お問い合わせ</span>
          </nav>

          {/* メインコンテンツ */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            border: '1px solid #e5e7eb'
          }}>
            {/* ヘッダー */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Mail size={24} color="white" />
              </div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 0.5rem 0'
              }}>
                お問い合わせ
              </h1>
              <p style={{
                color: '#6b7280',
                fontSize: '1rem',
                margin: 0
              }}>
                ご質問やご要望がございましたら、<br />
                お気軽にお問い合わせください
              </p>
            </div>

            {/* エラーメッセージ */}
            {errors.submit && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={20} color="#ef4444" />
                <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                  {errors.submit}
                </span>
              </div>
            )}

            {/* フォーム */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* メールアドレス */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  メールアドレス <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="example@email.com"
                  disabled={!!user} // ログイン済みユーザーは変更不可
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: user ? '#f9fafb' : 'white',
                    cursor: user ? 'not-allowed' : 'text',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!user && !errors.email) {
                      e.target.style.borderColor = '#22c55e';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                />
                {user && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                    ログイン中のメールアドレスが使用されます
                  </p>
                )}
                {errors.email && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.25rem 0 0 0' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 件名 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <MessageSquare size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  件名 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={handleChange('subject')}
                  placeholder="件名を入力してください"
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.subject ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!errors.subject) {
                      e.target.style.borderColor = '#22c55e';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.subject) {
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0 0 0' }}>
                  {errors.subject ? (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                      {errors.subject}
                    </p>
                  ) : (
                    <div />
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    {formData.subject.length}/500
                  </p>
                </div>
              </div>

              {/* お問い合わせ内容 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  お問い合わせ内容 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={handleChange('message')}
                  placeholder="内容を詳しくご記入ください"
                  maxLength={5000}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.message ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                  onFocus={(e) => {
                    if (!errors.message) {
                      e.target.style.borderColor = '#22c55e';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.message) {
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0 0 0' }}>
                  {errors.message ? (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                      {errors.message}
                    </p>
                  ) : (
                    <div />
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    {formData.message.length}/5000
                  </p>
                </div>
              </div>

              {/* 送信ボタン */}
                <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '1rem' 
                }}>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: isSubmitting ? '#d1d5db' : '#22c55e', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s' 
                    }} 
                    onMouseEnter={(e) => { 
                    if (!isSubmitting) { 
                        e.currentTarget.style.backgroundColor = '#16a34a'; 
                    } 
                    }} 
                    onMouseLeave={(e) => { 
                    if (!isSubmitting) { 
                        e.currentTarget.style.backgroundColor = '#22c55e'; 
                    } 
                    }}
                >
                    <Send size={16} />
                    {isSubmitting ? '送信中...' : '送信する'}
                </button>
                </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
