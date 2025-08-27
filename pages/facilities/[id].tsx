// pages/facilities/[id].tsx - レスポンシブ対応事業所詳細ページ（DM機能付き）
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { useDevice } from '@/hooks/useDevice';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MapPin, Phone, Globe, MessageCircle, Heart, ArrowLeft, Clock, Users, Star, Building, Calendar, ExternalLink, Send, X, Paperclip, Smile } from 'lucide-react';
import BookmarkIcon from '@/components/ui/BookmarkIcon';

// 型定義
interface Service {
  id: number;
  service_id: number;
  availability: 'available' | 'unavailable';
  capacity: number | null;
  current_users: number;
  service?: {
    name: string;
    category: string;
    description: string;
  };
}

interface Facility {
  id: number;
  name: string;
  description: string | null;
  appeal_points: string | null;
  address: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  phone_number: string | null;
  website_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
  operating_hours?: string;
  established_date?: string;
  organization_type?: string;
  staff_count?: number;
  accessibility_features?: string[];
  transportation_info?: string;
  fees_info?: string;
  contact_person?: string;
  email?: string;
}

interface DMMessage {
  id: number;
  content: string;
  sender: 'user' | 'facility';
  timestamp: Date;
  read: boolean;
}

// ユーティリティ関数
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2,4})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
}

// DMモーダルコンポーネント
const DMModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  facilityId: number;
}> = ({ isOpen, onClose, facilityName, facilityId }) => {
  const { isMobile } = useDevice();
  const [messages, setMessages] = useState<DMMessage[]>([
    {
      id: 1,
      content: "こんにちは！ご質問やご相談がございましたら、お気軽にメッセージをお送りください。",
      sender: 'facility',
      timestamp: new Date(Date.now() - 3600000),
      read: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: DMMessage = {
      id: messages.length + 1,
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
      read: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // 模擬的な自動返信
    setIsTyping(true);
    setTimeout(() => {
      const facilityResponse: DMMessage = {
        id: messages.length + 2,
        content: "メッセージをありがとうございます。担当者が確認次第、詳しくご返信いたします。お急ぎの場合はお電話でもお気軽にお問い合わせください。",
        sender: 'facility',
        timestamp: new Date(),
        read: false
      };
      setMessages(prev => [...prev, facilityResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return timestamp.toLocaleDateString('ja-JP');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0' : '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '1rem 1rem 0 0' : '1rem',
        width: isMobile ? '100%' : '500px',
        height: isMobile ? '80vh' : '600px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        animation: isMobile ? 'slideUp 0.3s ease-out' : 'fadeIn 0.3s ease-out'
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Building size={20} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: isMobile ? '1rem' : '1.125rem', 
                fontWeight: '600', 
                margin: 0, 
                color: '#111827' 
              }}>
                {facilityName}
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                margin: 0 
              }}>
                通常1時間以内に返信
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* メッセージエリア */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '0.75rem 1rem',
                borderRadius: message.sender === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                backgroundColor: message.sender === 'user' ? '#22c55e' : '#f3f4f6',
                color: message.sender === 'user' ? 'white' : '#111827',
                fontSize: '0.875rem',
                lineHeight: 1.4,
                position: 'relative'
              }}>
                <p style={{ margin: 0 }}>{message.content}</p>
                <div style={{
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  marginTop: '0.25rem',
                  textAlign: 'right'
                }}>
                  {formatMessageTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* タイピングインジケーター */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem 1rem 1rem 0.25rem',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <span>入力中</span>
                  <div style={{ display: 'flex', gap: '0.15rem' }}>
                    <div style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#9ca3af',
                      animation: 'pulse 1.4s ease-in-out infinite'
                    }}></div>
                    <div style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#9ca3af',
                      animation: 'pulse 1.4s ease-in-out 0.2s infinite'
                    }}></div>
                    <div style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#9ca3af',
                      animation: 'pulse 1.4s ease-in-out 0.4s infinite'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* メッセージ入力エリア */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.75rem'
          }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="メッセージを入力..."
                style={{
                  width: '100%',
                  minHeight: '40px',
                  maxHeight: '120px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                rows={1}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{
                    padding: '0.25rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    borderRadius: '0.25rem'
                  }}>
                    <Paperclip size={16} />
                  </button>
                  <button style={{
                    padding: '0.25rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    borderRadius: '0.25rem'
                  }}>
                    <Smile size={16} />
                  </button>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  color: '#9ca3af'
                }}>
                  Enter で送信
                </span>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: newMessage.trim() ? '#22c55e' : '#e5e7eb',
                color: newMessage.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '50%',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 70%, 100% {
            opacity: 0.4;
          }
          35% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Badge コンポーネント
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const { isMobile } = useDevice();
  
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: isMobile ? 'px-2 py-1 text-xs' : 'px-2 py-1 text-xs',
    md: isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: '500',
        borderRadius: '9999px',
        padding: size === 'sm' ? (isMobile ? '0.2rem 0.4rem' : '0.25rem 0.5rem') : (isMobile ? '0.2rem 0.4rem' : '0.375rem 0.75rem'),
        fontSize: size === 'sm' ? (isMobile ? '0.7rem' : '0.75rem') : (isMobile ? '0.7rem' : '0.875rem'),
        backgroundColor: variant === 'default' ? '#f3f4f6' : 
                        variant === 'success' ? '#dcfce7' : 
                        variant === 'warning' ? '#fef3c7' : 
                        variant === 'error' ? '#fecaca' : '#dbeafe',
        color: variant === 'default' ? '#374151' : 
               variant === 'success' ? '#166534' : 
               variant === 'warning' ? '#92400e' : 
               variant === 'error' ? '#dc2626' : '#1e40af',
      }}
    >
      {children}
    </span>
  );
};

// ServiceTag コンポーネント（モバイル対応）
const ServiceTag: React.FC<{
  service?: {
    name: string;
    category: string;
    description: string;
  };
  availability: 'available' | 'unavailable';
  capacity?: number | null;
  currentUsers?: number;
}> = ({ service, availability, capacity, currentUsers = 0 }) => {
  const { isMobile } = useDevice();
  
  if (!service) return null;

  const variant = availability === 'available' ? 'success' : 'default';
  const symbol = availability === 'available' ? '◯' : '×';

  return (
    <div 
      style={{
        padding: isMobile ? '0.75rem' : '1rem',
        borderRadius: '0.5rem',
        border: '1px solid',
        borderColor: availability === 'available' ? '#22c55e' : '#d1d5db',
        backgroundColor: availability === 'available' ? '#f0fdf4' : '#f9fafb'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '0.25rem',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        <span style={{ 
          fontWeight: '600', 
          color: availability === 'available' ? '#166534' : '#6b7280',
          fontSize: isMobile ? '0.875rem' : '1rem'
        }}>
          {symbol} {service.name}
        </span>
        <Badge variant={variant} size="sm">
          {service.category}
        </Badge>
      </div>
      
      <p style={{ 
        fontSize: isMobile ? '0.7rem' : '0.75rem', 
        color: '#6b7280', 
        margin: '0 0 0.5rem 0',
        lineHeight: 1.4 
      }}>
        {service.description}
      </p>
      
      {availability === 'available' && capacity && (
        <div style={{ 
          fontSize: isMobile ? '0.7rem' : '0.75rem', 
          color: '#059669',
          fontWeight: '500'
        }}>
          利用可能枠: {capacity - currentUsers}/{capacity}名
          {capacity - currentUsers > 0 ? (
            <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>✓ 空きあり</span>
          ) : (
            <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>満員</span>
          )}
        </div>
      )}
    </div>
  );
};

// InfoCard コンポーネント（モバイル対応）
const InfoCard: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, children, icon }) => {
  const { isMobile } = useDevice();
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {icon && <div style={{ color: '#22c55e' }}>{icon}</div>}
        <h3 style={{ 
          fontSize: isMobile ? '1rem' : '1.125rem', 
          fontWeight: '600', 
          color: '#111827',
          margin: 0
        }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

// 事業所詳細ページコンポーネント（レスポンシブ対応）
const FacilityDetailPage: React.FC = () => {
  const router = useRouter();
  const { id, ...searchParams } = router.query;
  const { user, signOut } = useAuthContext();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isMobile, isDesktop } = useDevice();
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const isLoggedIn = !!user;

  // 検索に戻るためのURL構築
  const getBackToSearchUrl = () => {
    const params = new URLSearchParams();
    
    const getString = (value: string | string[] | undefined): string => {
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) return value[0] || '';
      return '';
    };
    
    if (searchParams.q) {
      const value = getString(searchParams.q);
      if (value) params.append('q', value);
    }
    if (searchParams.district) {
      const value = getString(searchParams.district);
      if (value) params.append('district', value);
    }
    if (searchParams.services) {
      const value = getString(searchParams.services);
      if (value) params.append('services', value);
    }
    if (searchParams.available) {
      const value = getString(searchParams.available);
      if (value) params.append('available', value);
    }
    if (searchParams.page) {
      const value = getString(searchParams.page);
      if (value) params.append('page', value);
    }
    if (searchParams.view) {
      const value = getString(searchParams.view);
      if (value) params.append('view', value);
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  // データ取得
  useEffect(() => {
    if (!id || Array.isArray(id)) return;

    const fetchFacility = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/facilities/${id}`);
        
        if (!response.ok) {
          throw new Error('事業所情報の取得に失敗しました');
        }

        const data = await response.json();
        setFacility(data);
      } catch (err) {
        console.error('事業所詳細取得エラー:', err);
        setError(err instanceof Error ? err.message : '事業所情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  // ブックマークトグル
  const handleBookmarkToggle = async () => {
    if (!isLoggedIn || !facility) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }

    try {
      await toggleBookmark(facility.id.toString());
      console.log('ブックマーク操作完了');
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
      alert('ブックマーク操作中にエラーが発生しました。');
    }
  };

  // DM機能の処理
  const handleDMClick = () => {
    if (!isLoggedIn) {
      alert('DM機能を使用するにはログインが必要です。');
      return;
    }
    // 実際の実装時はここでDMページへの遷移やモーダル表示を行う
    alert('DM機能は開発中です。現在はお電話またはメールでお問い合わせください。');
  };

  // ローディング状態
  if (loading) {
    return (
      <div>
        <Head>
          <title>事業所詳細 - ケアコネクト</title>
        </Head>
        
        <Header 
          isLoggedIn={isLoggedIn}
          signOut={signOut}
        />

        <main style={{ 
          paddingTop: '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem',
          paddingRight: isMobile ? '1rem' : '2rem',
          paddingBottom: '2rem'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '4rem 2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: isMobile ? '1rem' : '1.125rem' }}>事業所情報を読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  // エラー状態
  if (error || !facility) {
    return (
      <div>
        <Head>
          <title>事業所が見つかりません - ケアコネクト</title>
        </Head>
        
        <Header 
          isLoggedIn={isLoggedIn}
          signOut={signOut}
        />

        <main style={{ 
          paddingTop: '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem',
          paddingRight: isMobile ? '1rem' : '2rem',
          paddingBottom: '2rem'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '4rem 2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌒</div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>事業所が見つかりません</h2>
            <p style={{ 
              color: '#6b7280',
              marginBottom: '2rem',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              {error || '指定された事業所は存在しないか、削除された可能性があります。'}
            </p>
            <Link href={getBackToSearchUrl()}>
              <button style={{
                backgroundColor: '#22c55e',
                color: 'white',
                padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ArrowLeft size={16} />
                検索ページに戻る
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];
  const hasSearchParams = Object.keys(searchParams).length > 0;

  return (
    <div>
      <Head>
        <title>{facility.name} - 事業所詳細 - ケアコネクト</title>
        <meta name="description" content={facility.description || `${facility.name}の詳細情報`} />
      </Head>

      {/* ヘッダー */}
      <Header 
        isLoggedIn={isLoggedIn}
        signOut={signOut}
        variant="home"
        showContactButton={true}
      />

      {/* メインコンテンツ */}
      <main style={{ 
        paddingTop: isMobile ? '1rem' : '2rem',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem',
        paddingBottom: '4rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* パンくずリスト（PC・モバイル共通） */}
        <nav style={{ 
          marginBottom: isMobile ? '1rem' : '1.5rem', 
          fontSize: isMobile ? '0.8rem' : '0.875rem', 
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem' : '0',
          backgroundColor: isMobile ? 'white' : 'transparent',
          borderRadius: isMobile ? '0.5rem' : '0',
          border: isMobile ? '1px solid #e5e7eb' : 'none',
          boxShadow: isMobile ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
        }}>
          <Link href={getBackToSearchUrl()} style={{ color: '#22c55e', textDecoration: 'none' }}>
            {hasSearchParams ? '検索結果' : 'ホーム'}
          </Link>
          <span>/</span>
          <span>事業所詳細</span>
          <span>/</span>
          <span style={{ 
            color: '#111827', 
            fontWeight: '500',
            wordBreak: isMobile ? 'break-all' : 'normal'
          }}>
            {facility.name}
          </span>
        </nav>

        {/* 事業所ヘッダー */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: isMobile ? '0.75rem' : '1rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 画像セクション */}
            <div style={{ height: isMobile ? '200px' : '300px', position: 'relative' }}>
              {facility.image_url && !imageError ? (
                <Image
                  src={facility.image_url}
                  alt={facility.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <Heart size={isMobile ? 48 : 64} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                  <p style={{ 
                    color: '#166534', 
                    fontSize: isMobile ? '1rem' : '1.125rem', 
                    fontWeight: '500',
                    textAlign: 'center',
                    padding: '0 1rem'
                  }}>
                    {facility.name}
                  </p>
                </div>
              )}
              
              {/* オーバーレイ情報 */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                padding: isMobile ? '1.5rem' : '2rem',
                color: 'white'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-end',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '1rem' : '0'
                }}>
                  <div style={{ width: isMobile ? '100%' : 'auto' }}>
                    <h1 style={{ 
                      fontSize: isMobile ? '1.5rem' : '2rem', 
                      fontWeight: 'bold', 
                      margin: '0 0 0.5rem 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {facility.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={isMobile ? 14 : 16} />
                      <span style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>{facility.district}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 基本情報セクション */}
            <div style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: isMobile ? '1rem' : '1.5rem' 
              }}>
                {/* ステータス */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <Badge variant={facility.is_active ? 'success' : 'error'}>
                      {facility.is_active ? '営業中' : '休業中'}
                    </Badge>
                    {facility.organization_type && (
                      <Badge variant="info">{facility.organization_type}</Badge>
                    )}
                  </div>
                  <p style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.875rem', 
                    color: '#6b7280', 
                    margin: 0 
                  }}>
                    最終更新: {new Date(facility.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {/* 連絡先 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {facility.website_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={isMobile ? 14 : 16} style={{ color: '#22c55e' }} />
                      <a 
                        href={facility.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#2563eb', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          fontSize: isMobile ? '0.875rem' : '1rem'
                        }}
                      >
                        公式サイト
                        <ExternalLink size={isMobile ? 10 : 12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* アクションボタン（モバイル用） */}
              {isMobile && (
                <div style={{
                  marginTop: '0.25rem',
                  display: 'grid',
                  gridTemplateColumns: facility.phone_number ? '1fr 1fr' : '1fr',
                  gap: '1rem'
                }}>
                  <button
                    onClick={handleDMClick}
                    style={{
                      padding: '0.875rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <MessageCircle size={16} />
                    メッセージ
                  </button>

                  {facility.phone_number && (
                    <a
                      href={`tel:${facility.phone_number}`}
                      style={{
                        padding: '0.875rem',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Phone size={16} />
                      電話
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
          gap: isMobile ? '0' : '2rem' 
        }}>
          {/* メインコンテンツ */}
          <div>
            {/* 事業所概要 */}
            {facility.description && (
              <InfoCard title="事業所概要" icon={<Building size={20} />}>
                <p style={{ 
                  lineHeight: 1.7, 
                  color: '#374151',
                  margin: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  {facility.description}
                </p>
              </InfoCard>
            )}

            {/* アピールポイント */}
            {facility.appeal_points && (
              <InfoCard title="アピールポイント" icon={<Star size={20} />}>
                <p style={{ 
                  lineHeight: 1.7, 
                  color: '#22c55e',
                  fontWeight: '500',
                  margin: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  {facility.appeal_points}
                </p>
              </InfoCard>
            )}

            {/* 提供サービス */}
            <InfoCard title="提供サービス" icon={<Heart size={20} />}>
              {availableServices.length > 0 && (
                <div style={{ marginBottom: availableServices.length > 0 && unavailableServices.length > 0 ? '1.5rem' : '0' }}>
                  <h4 style={{ 
                    color: '#166534', 
                    fontSize: isMobile ? '0.875rem' : '1rem', 
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    ✅ 利用可能なサービス ({availableServices.length}件)
                  </h4>
                  <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem' }}>
                    {availableServices.map((service) => (
                      <ServiceTag
                        key={service.id}
                        service={service.service}
                        availability="available"
                        capacity={service.capacity}
                        currentUsers={service.current_users}
                      />
                    ))}
                  </div>
                </div>
              )}

              {unavailableServices.length > 0 && (
                <div>
                  <h4 style={{ 
                    color: '#6b7280', 
                    fontSize: isMobile ? '0.875rem' : '1rem', 
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    ⌒ 現在利用できないサービス ({unavailableServices.length}件)
                  </h4>
                  <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem' }}>
                    {unavailableServices.map((service) => (
                      <ServiceTag
                        key={service.id}
                        service={service.service}
                        availability="unavailable"
                      />
                    ))}
                  </div>
                </div>
              )}

              {availableServices.length === 0 && unavailableServices.length === 0 && (
                <p style={{ 
                  color: '#6b7280', 
                  textAlign: 'center', 
                  padding: isMobile ? '1.5rem' : '2rem',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  サービス情報がありません
                </p>
              )}
            </InfoCard>

            {/* モバイル版サイドバー情報 */}
            {isMobile && (
              <>
                {/* アクセス情報 */}
                <InfoCard title="アクセス情報" icon={<MapPin size={20} />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        住所
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {facility.address}
                      </p>
                    </div>
                    
                    {facility.transportation_info && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          交通アクセス
                        </h4>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
                          {facility.transportation_info}
                        </p>
                      </div>
                    )}

                    {facility.latitude && facility.longitude && (
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`;
                          window.open(url, '_blank');
                        }}
                        style={{
                          padding: '0.875rem',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          width: '100%'
                        }}
                      >
                        <MapPin size={16} />
                        Google Mapで開く
                      </button>
                    )}
                  </div>
                </InfoCard>

                {/* 運営情報 */}
                <InfoCard title="運営情報" icon={<Clock size={20} />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {facility.operating_hours && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          営業時間
                        </h4>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                          {facility.operating_hours}
                        </p>
                      </div>
                    )}
                    
                    {facility.established_date && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          設立年月日
                        </h4>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                          {new Date(facility.established_date).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    )}

                    {facility.staff_count && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          スタッフ数
                        </h4>
                        <p style={{ 
                          margin: 0, 
                          color: '#6b7280', 
                          fontSize: '0.875rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem' 
                        }}>
                          <Users size={14} />
                          {facility.staff_count}名
                        </p>
                      </div>
                    )}
                  </div>
                </InfoCard>

              </>
            )}
          </div>

          {/* デスクトップ版サイドバー */}
          {isDesktop && (
            <div>
              {/* アクション */}
              <InfoCard title="お問い合わせ" icon={<MessageCircle size={20} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* DMボタン */}
                  <button
                    onClick={handleDMClick}
                    style={{
                      padding: '0.875rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    <MessageCircle size={16} />
                    メッセージを送る
                  </button>

                  {facility.contact_person && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        担当者
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {facility.contact_person}
                      </p>
                    </div>
                  )}

                  {facility.email && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        メールアドレス
                      </h4>
                      <a 
                        href={`mailto:${facility.email}`}
                        style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}
                      >
                        {facility.email}
                      </a>
                    </div>
                  )}

                  {facility.phone_number && (
                    <a
                      href={`tel:${facility.phone_number}`}
                      style={{
                        padding: '0.875rem',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Phone size={16} />
                      電話で問い合わせ
                    </a>
                  )}
                </div>
              </InfoCard>

              {/* アクセス情報 */}
              <InfoCard title="アクセス情報" icon={<MapPin size={20} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      住所
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {facility.address}
                    </p>
                  </div>
                  
                  {facility.transportation_info && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        交通アクセス
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {facility.transportation_info}
                      </p>
                    </div>
                  )}

                  {facility.latitude && facility.longitude && (
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`;
                        window.open(url, '_blank');
                      }}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <MapPin size={16} />
                      Google Mapで開く
                    </button>
                  )}
                </div>
              </InfoCard>

              {/* 運営情報 */}
              <InfoCard title="運営情報" icon={<Clock size={20} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {facility.operating_hours && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        営業時間
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {facility.operating_hours}
                      </p>
                    </div>
                  )}
                  
                  {facility.established_date && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        設立年月日
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(facility.established_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  )}

                  {facility.staff_count && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        スタッフ数
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        color: '#6b7280', 
                        fontSize: '0.875rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem' 
                      }}>
                        <Users size={14} />
                        {facility.staff_count}名
                      </p>
                    </div>
                  )}
                </div>
              </InfoCard>
            </div>
          )}
        </div>
      </main>



      {/* フッター */}
      <Footer 
        isLoggedIn={isLoggedIn}
        signOut={signOut}
      />
    </div>
  );
};

export default FacilityDetailPage;