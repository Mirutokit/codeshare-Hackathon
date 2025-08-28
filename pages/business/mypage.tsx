// pages/business/mypage/index.tsx - 完全版事業者マイページ
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { 
  Building2, User, Mail, Phone, MapPin, Globe, FileText,
  Eye, EyeOff, Save, Edit3, Settings, Lock, Award,
  AlertCircle, CheckCircle, Image, Star, ArrowLeft
} from 'lucide-react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase/client'

const TOKYO_DISTRICTS = [
  // 23区
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
  '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
  '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
  '葛飾区', '江戸川区',
  // 市部
  '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市',
  '調布市', '町田市', '小金井市', '小平市', '日野市', '東村山市', '国分寺市',
  '国立市', '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市', '武蔵村山市',
  '多摩市', '稲城市', '羽村市', 'あきる野市', '西東京市',
  // その他
  '瑞穂町', '日の出町', '檜原村', '奥多摩町',
  '大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村',
  '八丈町', '青ヶ島村', '小笠原村'
]

// 共通入力コンポーネント
const MyPageInput: React.FC<{
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
}> = ({ name, type = 'text', value, onChange, placeholder, required, disabled, min, max }) => {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      style={{
        width: '100%',
        padding: '0.75rem',
        fontSize: '0.875rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        outline: 'none',
        transition: 'all 0.2s',
        backgroundColor: disabled ? '#f9fafb' : 'white',
        color: disabled ? '#6b7280' : '#111827'
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.target.style.borderColor = '#22c55e'
          e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)'
        }
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db'
        e.target.style.boxShadow = 'none'
      }}
    />
  )
}

// 共通ボタンコンポーネント
const MyPageButton: React.FC<{
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ type = 'button', variant = 'primary', size = 'md', loading, disabled, onClick, children, style }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled || loading ? '0.6' : '1',
    ...style
  }

  const variants = {
    primary: {
      background: '#22c55e',
      color: 'white',
      padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 2rem' : '0.625rem 1.5rem',
      fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.875rem'
    },
    secondary: {
      background: 'white',
      color: '#22c55e',
      border: '1px solid #22c55e',
      padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 2rem' : '0.625rem 1.5rem',
      fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.875rem'
    },
    danger: {
      background: '#ef4444',
      color: 'white',
      padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 2rem' : '0.625rem 1.5rem',
      fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.875rem'
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variants[variant] }}
    >
      {loading ? '処理中...' : children}
    </button>
  )
}

// 事業者マイページメインコンポーネント
const FacilityMyPage: React.FC = () => {
  const router = useRouter()
  const { user, signOut } = useAuthContext()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'facility' | 'services' | 'account'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profileData, setProfileData] = useState({
    // 担当者情報 (usersテーブル)
    auth_user_id: '',
    full_name: '',
    email: '',
    phone_number: '',
    district: '',
    
    // 事業所情報 (facilitiesテーブル)
    facility_id: '',
    name: '',
    description: '',
    appeal_points: '',
    address: '',
    facility_district: '',
    latitude: null as number | null,
    longitude: null as number | null,
    facility_phone: '',
    website_url: '',
    image_url: '',
    is_active: false,
    is_profile_complete: false
  })

  const [originalData, setOriginalData] = useState(profileData)

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })

  // 事業者データ読み込み
  useEffect(() => {
    const loadBusinessData = async () => {
      if (!user) return
      
      setInitialLoading(true)
      console.log('=== 事業者データ読み込み開始 ===')
      
      try {
        const authenticatedUserId = user.id
        
        // 専用RPC関数でデータ取得
        const { data: facilityData, error: facilityError } = await supabase
          .rpc('get_facility_profile', { p_auth_user_id: authenticatedUserId })

        if (facilityError) {
          console.error('事業者プロフィール取得エラー:', facilityError)
          throw new Error(`事業者情報の取得に失敗しました: ${facilityError.message}`)
        }

        if (!facilityData?.success) {
          console.error('事業者プロフィール取得失敗:', facilityData)
          throw new Error('事業者情報が見つかりません')
        }

        const userData = facilityData.data.user_info || {}
        const facilityInfo = facilityData.data.facility_info || {}

        // プロフィール完了判定
        const isComplete = !!(
          facilityInfo.name && 
          facilityInfo.address && 
          facilityInfo.address !== '住所を入力してください' &&
          facilityInfo.district &&
          facilityInfo.description && 
          facilityInfo.description !== '事業所詳細情報を入力してください'
        )

        const consolidatedData = {
          auth_user_id: userData.id || '',
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone_number: userData.phone_number || '',
          district: userData.district || '',
          
          facility_id: facilityInfo.id || '',
          name: facilityInfo.name || '',
          description: facilityInfo.description || '',
          appeal_points: facilityInfo.appeal_points || '',
          address: facilityInfo.address || '',
          facility_district: facilityInfo.district || '',
          latitude: facilityInfo.latitude || null,
          longitude: facilityInfo.longitude || null,
          facility_phone: facilityInfo.phone_number || '',
          website_url: facilityInfo.website_url || '',
          image_url: facilityInfo.image_url || '',
          is_active: facilityInfo.is_active || false,
          is_profile_complete: isComplete
        }
        
        console.log('統合された事業者データ:', consolidatedData)
        
        setProfileData(consolidatedData)
        setOriginalData(consolidatedData)

      } catch (error) {
        console.error('事業者データ読み込みエラー:', error)
        setMessage({ 
          type: 'error', 
          text: `プロフィール情報の読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
        })
      } finally {
        setInitialLoading(false)
      }
    }

    loadBusinessData()
  }, [user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setProfileData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'latitude' || name === 'longitude') {
      setProfileData(prev => ({ ...prev, [name]: value ? parseFloat(value) : null }))
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  // プロフィール更新処理
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setMessage(null)

    try {
      console.log('=== 事業者プロフィール更新開始 ===')
      
      const authenticatedUserId = user.id
      
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_facility_profile', {
          p_auth_user_id: authenticatedUserId,
          p_full_name: profileData.full_name,
          p_phone_number: profileData.phone_number,
          p_district: profileData.district,
          p_business_name: profileData.name,
          p_description: profileData.description,
          p_appeal_points: profileData.appeal_points,
          p_address: profileData.address,
          p_facility_district: profileData.facility_district,
          p_business_phone: profileData.facility_phone,
          p_website_url: profileData.website_url,
          p_image_url: profileData.image_url,
          p_latitude: profileData.latitude,
          p_longitude: profileData.longitude
        })

      if (updateError) {
        console.error('プロフィール更新エラー:', updateError)
        throw new Error(`更新に失敗しました: ${updateError.message}`)
      }

      if (!updateResult?.success) {
        console.error('プロフィール更新失敗:', updateResult)
        throw new Error(updateResult?.message || '更新に失敗しました')
      }
      
      console.log('プロフィール更新成功:', updateResult)

      setMessage({ type: 'success', text: '事業者プロフィールを更新しました' })
      setIsEditing(false)
      
      const updatedProfile = {
        ...profileData,
        is_profile_complete: updateResult.is_profile_complete || false,
        is_active: updateResult.is_active || false
      }
      setProfileData(updatedProfile)
      setOriginalData(updatedProfile)

    } catch (error: any) {
      console.error('事業者プロフィール更新エラー:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'プロフィール更新に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: '新しいパスワードが一致しません' })
      setLoading(false)
      return
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'パスワードは6文字以上で入力してください' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })
      
      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'パスワードを更新しました' })
      setPasswordData({ new_password: '', confirm_password: '' })

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'パスワード更新に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setProfileData(originalData)
    setIsEditing(false)
    setMessage(null)
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      console.error("ログアウトエラー:", error.message)
      alert("ログアウトに失敗しました")
    } else {
      router.push('/')
    }
  }

  // タブデータ
  const tabs = [
    { key: 'profile', label: '担当者情報', icon: User },
    { key: 'facility', label: '事業所情報', icon: Building2 },
    { key: 'services', label: 'サービス管理', icon: Award },
    { key: 'account', label: 'アカウント設定', icon: Settings }
  ]

  // ログインチェック
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>ログインが必要です</h2>
          <Link href="/auth/facilitylogin">
            <MyPageButton variant="primary">事業者ログインへ</MyPageButton>
          </Link>
        </div>
      </div>
    )
  }

  // 初期ローディング
  if (initialLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>事業者情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Head>
        <title>事業者マイページ - ケアコネクト</title>
      </Head>

      {/* ヘッダー */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ 
          maxWidth: '80rem', 
          margin: '0 auto', 
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* ロゴ */}
          <Link href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textDecoration: 'none'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: '#22c55e',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              C
            </div>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: '#111827' 
            }}>
              ケアコネクト
            </span>
          </Link>

          {/* ナビゲーション */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              事業者: {profileData.name || user.email}
            </span>
            <MyPageButton variant="secondary" size="sm" onClick={handleLogout}>
              ログアウト
            </MyPageButton>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* ページタイトル */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Building2 size={28} style={{ color: '#22c55e' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              事業者マイページ
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            事業所情報の管理・編集やサービス設定ができます
          </p>
          
          {/* プロフィール完了ステータス */}
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: profileData.is_profile_complete ? '#f0fdf4' : '#fef3c7',
            border: profileData.is_profile_complete ? '1px solid #bbf7d0' : '1px solid #fbbf24',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {profileData.is_profile_complete ? (
              <>
                <CheckCircle size={16} style={{ color: '#22c55e' }} />
                <span style={{ color: '#166534' }}>
                  {profileData.is_active ? '検索対象として公開中' : 'プロフィール完了'}
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#92400e' }}>プロフィール未完了</span>
              </>
            )}
          </div>
        </div>

        {/* タブナビゲーション */}
        <div style={{ 
          background: 'white', 
          borderRadius: '0.75rem 0.75rem 0 0', 
          border: '1px solid #e5e7eb',
          borderBottom: 'none',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any)
                    setIsEditing(false)
                    setMessage(null)
                  }}
                  style={{
                    flex: '1',
                    minWidth: '140px',
                    padding: '1rem 1.5rem',
                    background: activeTab === tab.key ? '#22c55e' : 'transparent',
                    color: activeTab === tab.key ? 'white' : '#6b7280',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* タブコンテンツ */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '0 0 0.75rem 0.75rem',
          border: '1px solid #e5e7eb',
          minHeight: '60vh'
        }}>
          {/* メッセージ表示 */}
          {message && (
            <div style={{ 
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: message.type === 'success' ? '#166534' : '#b91c1c',
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* 担当者情報タブ */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  担当者情報
                </h3>
                <MyPageButton
                  variant={isEditing ? "secondary" : "primary"}
                  onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                  disabled={loading}
                >
                  <Edit3 size={16} />
                  {isEditing ? '編集をキャンセル' : '編集する'}
                </MyPageButton>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      担当者名
                    </label>
                    <MyPageInput
                      name="full_name"
                      type="text"
                      value={profileData.full_name}
                      onChange={handleProfileChange}
                      placeholder="山田 太郎"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      メールアドレス
                    </label>
                    <MyPageInput
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="example@email.com"
                      disabled={true}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      メールアドレスの変更は管理者にお問い合わせください
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Phone size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      担当者電話番号
                    </label>
                    <MyPageInput
                      name="phone_number"
                      type="tel"
                      value={profileData.phone_number}
                      onChange={handleProfileChange}
                      placeholder="090-1234-5678"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <MapPin size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      担当者所在地区
                    </label>
                    <select
                      name="district"
                      value={profileData.district}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      style={{
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.5rem', 
                        fontSize: '0.875rem',
                        backgroundColor: !isEditing ? '#f9fafb' : 'white',
                        color: !isEditing ? '#6b7280' : '#111827'
                      }}
                    >
                      <option value="">選択してください</option>
                      {TOKYO_DISTRICTS.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <MyPageButton 
                      type="submit" 
                      variant="primary" 
                      loading={loading}
                    >
                      <Save size={16} />
                      {loading ? '保存中...' : '担当者情報を保存'}
                    </MyPageButton>
                    <MyPageButton 
                      type="button" 
                      variant="secondary" 
                      onClick={handleCancelEdit}
                    >
                      キャンセル
                    </MyPageButton>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* 事業所情報タブ */}
          {activeTab === 'facility' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  事業所情報
                </h3>
                <MyPageButton
                  variant={isEditing ? "secondary" : "primary"}
                  onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                  disabled={loading}
                >
                  <Edit3 size={16} />
                  {isEditing ? '編集をキャンセル' : '編集する'}
                </MyPageButton>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* 基本情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      <Building2 size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      基本情報
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          事業所名 <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <MyPageInput
                          name="name"
                          type="text"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          placeholder="株式会社ケアサービス"
                          disabled={!isEditing}
                          required
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          <Phone size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                          事業所電話番号
                        </label>
                        <MyPageInput
                          name="facility_phone"
                          type="tel"
                          value={profileData.facility_phone}
                          onChange={handleProfileChange}
                          placeholder="03-1234-5678"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        <Globe size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        ウェブサイトURL
                      </label>
                      <MyPageInput
                        name="website_url"
                        type="url"
                        value={profileData.website_url}
                        onChange={handleProfileChange}
                        placeholder="https://www.care-service.com"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* 住所情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      <MapPin size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      所在地
                    </h4>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        住所 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <MyPageInput
                        name="address"
                        type="text"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        placeholder="東京都渋谷区神南1-2-3 ビル名 階数"
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        検索表示用地区 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="facility_district"
                        value={profileData.facility_district}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                        style={{
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', 
                          fontSize: '0.875rem',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          color: !isEditing ? '#6b7280' : '#111827'
                        }}
                      >
                        <option value="">選択してください</option>
                        {TOKYO_DISTRICTS.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          緯度（任意）
                        </label>
                        <MyPageInput
                          name="latitude"
                          type="number"
                          value={profileData.latitude?.toString() || ''}
                          onChange={handleProfileChange}
                          placeholder="35.6895"
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          経度（任意）
                        </label>
                        <MyPageInput
                          name="longitude"
                          type="number"
                          value={profileData.longitude?.toString() || ''}
                          onChange={handleProfileChange}
                          placeholder="139.6917"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 事業所紹介・詳細 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      <FileText size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      事業所紹介
                    </h4>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        事業所説明・詳細情報 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        name="description"
                        value={profileData.description}
                        onChange={handleProfileChange}
                        placeholder="事業種別: 訪問介護&#10;&#10;当事業所は、利用者様一人ひとりに寄り添った質の高いケアサービスを提供しています。経験豊富なスタッフが24時間体制でサポートいたします。&#10;&#10;代表者: 田中一郎&#10;事業所番号: 1234567890&#10;営業時間: 月-土 9:00-18:00"
                        rows={6}
                        disabled={!isEditing}
                        required
                        style={{
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', 
                          fontSize: '0.875rem', 
                          resize: 'vertical',
                          outline: 'none', 
                          fontFamily: 'inherit', 
                          lineHeight: '1.5',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          color: !isEditing ? '#6b7280' : '#111827'
                        }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        事業種別、代表者名、営業時間、事業所番号などの詳細情報をこちらに記載してください
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        <Star size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        アピールポイント
                      </label>
                      <textarea
                        name="appeal_points"
                        value={profileData.appeal_points}
                        onChange={handleProfileChange}
                        placeholder="• 経験豊富なスタッフ陣&#10;• 24時間対応可能&#10;• 医療連携体制充実&#10;• 送迎サービスあり&#10;• 個別ケアプラン作成"
                        rows={4}
                        disabled={!isEditing}
                        style={{
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', 
                          fontSize: '0.875rem', 
                          resize: 'vertical',
                          outline: 'none', 
                          fontFamily: 'inherit', 
                          lineHeight: '1.5',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          color: !isEditing ? '#6b7280' : '#111827'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        <Image size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        画像URL（任意）
                      </label>
                      <MyPageInput
                        name="image_url"
                        type="url"
                        value={profileData.image_url}
                        onChange={handleProfileChange}
                        placeholder="https://example.com/facility-image.jpg"
                        disabled={!isEditing}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        事業所の外観や内部の写真URLを設定できます
                      </p>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <MyPageButton 
                      type="submit" 
                      variant="primary" 
                      loading={loading}
                    >
                      <Save size={16} />
                      {loading ? '保存中...' : '事業所情報を保存'}
                    </MyPageButton>
                    <MyPageButton 
                      type="button" 
                      variant="secondary" 
                      onClick={handleCancelEdit}
                    >
                      キャンセル
                    </MyPageButton>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* サービス管理タブ */}
          {activeTab === 'services' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                <Award size={20} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                サービス管理
              </h3>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <Award size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                <h4 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                  サービス管理機能は準備中です
                </h4>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  提供可能なサービスの登録・管理機能を開発中です
                </p>
                <MyPageButton variant="secondary" disabled>
                  近日実装予定
                </MyPageButton>
              </div>
            </div>
          )}

          {/* アカウント設定タブ */}
          {activeTab === 'account' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                <Lock size={20} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                アカウント設定
              </h3>
              
              {/* パスワード変更 */}
              <form onSubmit={handlePasswordSubmit} style={{ marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                  パスワード変更
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '32rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      新しいパスワード
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MyPageInput
                        name="new_password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        placeholder="6文字以上で入力"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer'
                        }}
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      新しいパスワード（確認）
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MyPageInput
                        name="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        placeholder="パスワードを再入力"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer'
                        }}
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <MyPageButton 
                    type="submit" 
                    variant="primary" 
                    loading={loading}
                  >
                    <Save size={16} />
                    {loading ? '更新中...' : 'パスワードを更新'}
                  </MyPageButton>
                </div>
              </form>

              {/* 公開状態表示 */}
              <div style={{ marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                  <Building2 size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  事業所公開状態
                </h4>
                
                <div style={{
                  padding: '1.5rem',
                  background: profileData.is_active ? '#f0fdf4' : '#fef3c7',
                  border: profileData.is_active ? '1px solid #bbf7d0' : '1px solid #fbbf24',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    {profileData.is_active ? (
                      <>
                        <CheckCircle size={20} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#166534' }}>
                          検索対象として公開中
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#92400e' }}>
                          {profileData.is_profile_complete ? '公開準備完了' : '非公開（情報未完了）'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: profileData.is_active ? '#166534' : '#92400e',
                    marginBottom: '0.5rem'
                  }}>
                    {profileData.is_active 
                      ? '利用者の検索結果に表示されています'
                      : '必要な情報をすべて入力すると、自動的に公開されます'
                    }
                  </p>
                  
                  {!profileData.is_profile_complete && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#92400e',
                      background: 'rgba(251, 191, 36, 0.1)',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      marginTop: '1rem'
                    }}>
                      <strong>公開に必要な項目:</strong>
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                        <li>事業所名</li>
                        <li>詳細な住所</li>
                        <li>地区選択</li>
                        <li>事業所説明文</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* 戻るボタン */}
              <div style={{ textAlign: 'center' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <MyPageButton variant="secondary">
                    <ArrowLeft size={16} />
                    トップページに戻る
                  </MyPageButton>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* スピナーのアニメーション */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default FacilityMyPage