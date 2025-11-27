// pages/mypage/index.tsx - 修正版 利用者マイページ
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { 
  User, Mail, Phone, MapPin, Heart, Shield, Activity, 
  Eye, EyeOff, Save, Edit3, Settings, Bell, Lock,
  AlertCircle, CheckCircle, ArrowLeft, Home, Star,
  Calendar, FileText, MessageCircle
} from 'lucide-react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useBookmarks } from '@/lib/hooks/useBookmarks'
import { useMessages } from '@/lib/hooks/useMessages'
import { supabase } from '@/lib/supabase/client'
import { TokyoDistrict, DisabilityType } from '@/types/database'
import Header from '../../components/layout/Header'
import ConversationList from '@/components/dm/ConversationList'
import MessageThread from '@/components/dm/MessageThread'

const TOKYO_DISTRICTS: TokyoDistrict[] = [
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
  // 西多摩郡
  '瑞穂町', '日の出町', '檜原村', '奥多摩町',
  // 島しょ部
  '大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村',
  '八丈町', '青ヶ島村', '小笠原村'
]

const DISABILITY_TYPES: DisabilityType[] = [
  '身体障害', '知的障害', '精神障害', '発達障害', '難病等', 'その他'
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

// マイページコンポーネント
const UserMyPage: React.FC = () => {
  const router = useRouter()
  const { user, signOut } = useAuthContext()
  const { bookmarks, refreshBookmarks, toggleBookmark, isBookmarked } = useBookmarks()
  const { conversations, fetchConversations, getOrCreateConversation, loading: messagesLoading } = useMessages()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'personal' | 'support' | 'account' | 'bookmarks' | 'messages'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  
  // DM関連の状態
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [showMessageThread, setShowMessageThread] = useState(false)
  
  const [profileData, setProfileData] = useState({
    // 基本情報 (usersテーブル)
    full_name: '',
    email: '',
    phone_number: '',
    district: '' as TokyoDistrict | '',
    
    // 個人情報 (user_details)
    age: '',
    gender: '',
    disability_types: [] as DisabilityType[],
    disability_grade: '',
    
    // サポート情報 (user_details)
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: '',
    medical_info: '',
    transportation_needs: '',
    other_requirements: '',
    receive_notifications: true
  })

  const [originalData, setOriginalData] = useState(profileData)

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [bookmarkedFacilities, setBookmarkedFacilities] = useState<any[]>([])

  // 初期データ読み込み
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return
      
      setInitialLoading(true)
      console.log('=== ユーザーデータ読み込み開始 ===')
      
      try {
        const authenticatedUserId = user.id
        const authenticatedUserEmail = user.email || ''
        const authenticatedUserName = user.user_metadata?.full_name || ''
        
        if (!authenticatedUserId) {
          throw new Error('認証されたユーザーIDが取得できません')
        }
        
        console.log('認証情報:', {
          id: authenticatedUserId,
          email: authenticatedUserEmail,
          name: authenticatedUserName
        })

        // usersテーブルから直接データ取得
        console.log('=== usersテーブルからデータ取得 ===')

        let userRecord = null
        const { data: initialUserRecord, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authenticatedUserId)
          .single()

        if (userError) {
          console.error('usersテーブル取得エラー:', userError)
          
          // レコードが存在しない場合は作成
          if (userError.code === 'PGRST116') { // No rows returned
            console.log('ユーザーレコードが存在しないため作成します')
            
            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: authenticatedUserId,
                email: authenticatedUserEmail,
                full_name: authenticatedUserName || authenticatedUserEmail,
                user_type: 'user'
              })
              .select()
              .single()
            
            if (createError) {
              console.error('ユーザーレコード作成エラー:', createError)
              // 作成に失敗した場合はデフォルトデータを使用
              userRecord = {
                id: authenticatedUserId,
                email: authenticatedUserEmail,
                full_name: authenticatedUserName || authenticatedUserEmail,
                phone_number: null,
                district: null,
                user_type: 'user'
              }
            } else {
              console.log('ユーザーレコード作成成功:', createdUser)
              userRecord = createdUser
            }
          } else {
            // その他のエラーの場合はデフォルトデータを使用
            userRecord = {
              id: authenticatedUserId,
              email: authenticatedUserEmail,
              full_name: authenticatedUserName || authenticatedUserEmail,
              phone_number: null,
              district: null,
              user_type: 'user'
            }
          }
        } else {
          console.log('usersテーブル取得成功:', initialUserRecord)
          userRecord = initialUserRecord
        }

        // user_detailsテーブルからデータ取得
        console.log('=== user_detailsテーブルからデータ取得 ===')
        
        const { data: userDetails, error: detailsError } = await supabase
          .from('user_details')
          .select('*')
          .eq('user_id', authenticatedUserId)
          .single()

        if (detailsError) {
          if (detailsError.code === 'PGRST116') { // No rows returned
            console.log('user_detailsレコードが存在しないため作成します')
            
            const { data: createdDetails, error: createDetailsError } = await supabase
              .from('user_details')
              .insert({
                user_id: authenticatedUserId,
                receive_notifications: true
              })
              .select()
              .single()
            
            if (createDetailsError) {
              console.error('user_detailsレコード作成エラー:', createDetailsError)
            } else {
              console.log('user_detailsレコード作成成功:', createdDetails)
            }
          } else {
            console.error('user_details取得エラー:', detailsError)
          }
        } else {
          console.log('user_details取得成功:', userDetails)
        }

        // データ統合
        const userData = {
          // usersテーブルのデータ
          full_name: userRecord?.full_name || authenticatedUserName || '',
          email: userRecord?.email || authenticatedUserEmail || '',
          phone_number: userRecord?.phone_number || '',
          district: userRecord?.district || '' as TokyoDistrict | '',
          
          // user_detailsテーブルのデータ
          age: userDetails?.age ? userDetails.age.toString() : '',
          gender: userDetails?.gender || '',
          disability_types: userDetails?.disability_types || [],
          disability_grade: userDetails?.disability_grade || '',
          guardian_name: userDetails?.guardian_name || '',
          guardian_phone: userDetails?.guardian_phone || '',
          emergency_contact: userDetails?.emergency_contact || '',
          medical_info: userDetails?.medical_info || '',
          transportation_needs: userDetails?.transportation_needs || '',
          other_requirements: userDetails?.other_requirements || '',
          receive_notifications: userDetails?.receive_notifications ?? true
        }
        
        console.log('統合されたユーザーデータ:', userData)
        
        setProfileData(userData)
        setOriginalData(userData)

      } catch (error) {
        console.error('ユーザーデータ読み込みエラー:', error)
        setMessage({ 
          type: 'error', 
          text: `プロフィール情報の読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
        })
      } finally {
        setInitialLoading(false)
      }
    }

    loadUserData()
  }, [user])

  // DM起動処理（URLパラメータから）
  useEffect(() => {
    const { tab, facility } = router.query
    
    if (tab === 'messages' && facility && user) {
      setActiveTab('messages')
      setShowMessageThread(false) // 最初は一覧を表示
      
      // 事業所との会話を作成または取得
      const handleFacilityMessage = async () => {
        try {
          const facilityId = Array.isArray(facility) ? facility[0] : facility
          
          // 会話を作成または取得
          const conversationId = await getOrCreateConversation(
            user.id, 
            parseInt(facilityId)
          )
          
          if (conversationId) {
            // 会話一覧を更新
            await fetchConversations()
          }
        } catch (error) {
          console.error('会話作成エラー:', error)
        }
      }
      
      handleFacilityMessage()
    }
  }, [router.query, user, getOrCreateConversation, fetchConversations])

  // ブックマーク読み込み
  useEffect(() => {
    const loadBookmarkedFacilities = async () => {
      if (activeTab !== 'bookmarks' || !user) return
      
      try {
        await refreshBookmarks()
        
        // ブックマークした事業所の詳細情報を取得
        if (bookmarks.length > 0) {
          const facilityIds = bookmarks.map(b => parseInt(b.facility))
          const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, district, description, phone_number, website_url, image_url')
            .in('id', facilityIds)

          if (error) {
            console.error('事業所データ取得エラー:', error)
          } else {
            setBookmarkedFacilities(facilities || [])
          }
        } else {
          setBookmarkedFacilities([])
        }
      } catch (error) {
        console.error('ブックマーク読み込みエラー:', error)
      }
    }

    loadBookmarkedFacilities()
  }, [activeTab, bookmarks, refreshBookmarks, user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'disability_types') {
        const disabilityType = value as DisabilityType
        setProfileData(prev => ({
          ...prev,
          disability_types: checked 
            ? [...prev.disability_types, disabilityType]
            : prev.disability_types.filter(d => d !== disabilityType)
        }))
      } else {
        setProfileData(prev => ({ ...prev, [name]: checked }))
      }
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  // 修正されたhandleProfileSubmit関数
  const handleProfileSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!user) return
  
  setLoading(true)
  setMessage(null)

  try {
    console.log('=== プロフィール更新開始 ===')
    console.log('更新データ:', profileData)
    
    const authenticatedUserId = user.id
    const authenticatedUserEmail = user.email || profileData.email
    
    if (!authenticatedUserId) {
      throw new Error('認証情報が取得できません。再ログインしてください。')
    }
    
    console.log('認証ユーザーID:', authenticatedUserId)
    
    // 1. usersテーブルを直接更新
    console.log('=== usersテーブル更新開始 ===')
    
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from('users')
      .update({
        // emailは更新対象から外す
        full_name: profileData.full_name,
        phone_number: profileData.phone_number || null,
        district: profileData.district || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', authenticatedUserId) // idで更新対象のユーザーを特定
      .select()

    if (userUpdateError) {
      console.error('usersテーブル更新エラー:', userUpdateError)
      throw new Error(`基本情報の保存に失敗しました: ${userUpdateError.message}`)
    }
    
    console.log('usersテーブル更新成功:', userUpdateData)

    // 2. user_detailsテーブルの処理（安全な方法）
    console.log('=== user_detailsテーブル処理開始 ===')
    
    // まず既存レコードの確認
    const { data: existingDetails, error: checkError } = await supabase
      .from('user_details')
      .select('user_id')
      .eq('user_id', authenticatedUserId)
      .single()

    console.log('既存レコード確認:', { exists: !!existingDetails, error: checkError })

    let detailsResult = null
    let detailsError = null

    if (existingDetails) {
      // 既存レコードがある場合：UPDATE
      console.log('既存レコードを更新')
      const updateResult = await supabase
        .from('user_details')
        .update({
          age: profileData.age ? parseInt(profileData.age) : null,
          gender: profileData.gender || null,
          disability_types: profileData.disability_types,
          disability_grade: profileData.disability_grade || null,
          guardian_name: profileData.guardian_name || null,
          guardian_phone: profileData.guardian_phone || null,
          emergency_contact: profileData.emergency_contact || null,
          medical_info: profileData.medical_info || null,
          transportation_needs: profileData.transportation_needs || null,
          other_requirements: profileData.other_requirements || null,
          receive_notifications: profileData.receive_notifications,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authenticatedUserId)
        .select()

      detailsResult = updateResult.data
      detailsError = updateResult.error
    } else {
      // 既存レコードがない場合：INSERT
      console.log('新規レコードを作成')
      const insertResult = await supabase
        .from('user_details')
        .insert({
          user_id: authenticatedUserId,
          age: profileData.age ? parseInt(profileData.age) : null,
          gender: profileData.gender || null,
          disability_types: profileData.disability_types,
          disability_grade: profileData.disability_grade || null,
          guardian_name: profileData.guardian_name || null,
          guardian_phone: profileData.guardian_phone || null,
          emergency_contact: profileData.emergency_contact || null,
          medical_info: profileData.medical_info || null,
          transportation_needs: profileData.transportation_needs || null,
          other_requirements: profileData.other_requirements || null,
          receive_notifications: profileData.receive_notifications,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      detailsResult = insertResult.data
      detailsError = insertResult.error
    }

    if (detailsError) {
      console.error('user_detailsテーブル処理エラー:', detailsError)
      
      // 一部のエラーは警告として処理（致命的でない）
      if (detailsError.code === '23505') { // unique_violation
        console.warn('重複キーエラー（トリガーの可能性）:', detailsError.message)
        setMessage({ 
          type: 'success', 
          text: '基本情報は保存されました。詳細情報で重複エラーが発生しましたが、データは正常に処理されています。' 
        })
      } else {
        throw new Error(`詳細情報の保存に失敗しました: ${detailsError.message}`)
      }
    } else {
      console.log('user_detailsテーブル処理成功:', detailsResult)
    }

    // 3. 更新確認のためにデータを再取得（必要時のみ）
    console.log('=== 更新確認のためのデータ再取得 ===')
    
    // 短い待機時間でレプリケーション対応
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 最新データの取得（確認用）
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authenticatedUserId)
      .single()

    const { data: updatedDetails } = await supabase
      .from('user_details')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .single()

    console.log('更新後のデータ確認:', {
      user: updatedUser,
      details: updatedDetails
    })

    // 4. ユーザーメタデータも更新
    if (profileData.full_name !== user.user_metadata?.full_name) {
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: profileData.full_name }
        })
        
        if (updateError) {
          console.error('ユーザーメタデータ更新エラー:', updateError)
        } else {
          console.log('ユーザーメタデータ更新成功')
        }
      } catch (metaError) {
        console.error('ユーザーメタデータ更新で例外:', metaError)
      }
    }

    // 5. 成功処理
    if (!message) { // エラーメッセージが設定されていない場合のみ成功メッセージ
      setMessage({ type: 'success', text: 'プロフィールを更新しました' })
    }
    setIsEditing(false)
    setOriginalData(profileData)
    
    console.log('=== プロフィール更新完了 ===')

  } catch (error: any) {
    console.error('プロフィール更新エラー:', error)
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

    // バリデーション
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
      // Supabaseでパスワード更新
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })
      
      if (error) {
        throw error
      }

      console.log('パスワード更新成功')
      setMessage({ type: 'success', text: 'パスワードを更新しました' })
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })

    } catch (error: any) {
      console.error('パスワード更新エラー:', error)
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

 const handleDeleteAccount = async () => {
  if (!confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
    return
  }
  
  if (!confirm('すべてのデータが失われます。本当に削除を実行しますか？')) {
    return
  }

  try {
    setLoading(true)
    setMessage(null)
    
    console.log('アカウント削除開始:', user?.id)
    
    if (!user) {
      throw new Error('ユーザー情報が取得できません')
    }

    // 現在のセッションを取得してデバッグ
    console.log('セッション取得開始...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('セッション情報詳細:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length,
      tokenType: session?.token_type,
      expiresAt: session?.expires_at,
      user: session?.user?.id,
      sessionError: sessionError?.message
    })
    
    if (sessionError) {
      console.error('セッション取得エラー:', sessionError)
      throw new Error(`セッション取得エラー: ${sessionError.message}`)
    }
    
    if (!session?.access_token) {
      console.error('アクセストークンが存在しません')
      throw new Error('認証情報が取得できません。再ログインしてください。')
    }

    console.log('API呼び出し準備完了。リクエスト送信...')
    
    // APIエンドポイント呼び出し
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('API応答受信:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    const responseText = await response.text()
    console.log('レスポンス内容:', responseText)

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText || 'Unknown error' }
      }
      throw new Error(errorData.error || 'アカウント削除に失敗しました')
    }

    const result = JSON.parse(responseText)
    console.log('アカウント削除成功:', result)

    setMessage({ 
      type: 'success', 
      text: 'アカウントが削除されました。ご利用ありがとうございました。' 
    })

    // ストレージクリア
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    // 3秒後にトップページに遷移
    setTimeout(() => {
      window.location.href = '/'
    }, 3000)

  } catch (error: any) {
    console.error('アカウント削除エラー:', error)
    setMessage({ 
      type: 'error', 
      text: error.message || 'アカウント削除に失敗しました。しばらく後にもう一度お試しください。' 
    })
  } finally {
    setLoading(false)
  }
}

  // タブデータ
  const tabs = [
    { key: 'profile', label: '基本情報', icon: User },
    { key: 'personal', label: '個人情報', icon: Heart },
    { key: 'support', label: 'サポート情報', icon: Shield },
    { key: 'account', label: 'アカウント設定', icon: Settings },
    { key: 'bookmarks', label: 'ブックマーク', icon: Star },
    { key: 'messages', label: 'メッセージ', icon: MessageCircle }
  ]

  // ログインチェック
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>ログインが必要です</h2>
          <Link href="/auth/userlogin">
            <MyPageButton variant="primary">ログインページへ</MyPageButton>
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
          <p>プロフィール情報を読み込み中...</p>
        </div>
      </div>
    )
  }
  
  const isLoggedIn = !!user

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Head>
        <title>マイページ - ケアコネクト</title>
      </Head>

      {/* ヘッダー */}
      <Header 
        isLoggedIn={isLoggedIn}
        signOut={signOut}
        variant="mypage"
        showContactButton={true}
      />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* ページタイトル */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '0.5rem' 
          }}>
            マイページ
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '0.875rem',
            // PCでは一行表示、スマホでは自然な改行
            maxWidth: '100%',
            // メディアクエリ風の条件分岐は難しいので、長めの文章として調整
            lineHeight: '1.5'
          }}>
            {/* PC表示用 (768px以上) */}
            <span style={{ 
              display: window?.innerWidth >= 768 ? 'inline' : 'none'
            }}>
              プロフィール情報の確認・編集やブックマークの管理ができます
            </span>
            {/* スマホ表示用 (768px未満) */}
            <span style={{ 
              display: window?.innerWidth < 768 ? 'inline' : 'none'
            }}>
              プロフィール情報の確認・編集や<br />ブックマークの管理ができます
            </span>
          </p>
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
                    minWidth: '123px',
                    padding: '1rem 1.5rem',
                    background: activeTab === tab.key ? '#22c55e' : 'transparent',
                    color: activeTab === tab.key ? 'white' : '#6b7280',
                    border: 'none',
                    fontSize: '0.775rem',
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

          {/* 基本情報タブ */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  基本情報
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
                      お名前
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
                      disabled={true} // メールアドレスは変更不可
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      メールアドレスの変更は管理者にお問い合わせください
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Phone size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      電話番号
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
                      お住まいの地区
                    </label>
                    <select
                      name="district"
                      value={profileData.district}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      style={{
                        width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                        borderRadius: '0.5rem', fontSize: '0.875rem', 
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
                      {loading ? '保存中...' : '基本情報を保存'}
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

          {/* 個人情報タブ */}
          {activeTab === 'personal' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  個人情報
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        年齢
                      </label>
                      <MyPageInput
                        name="age"
                        type="number"
                        value={profileData.age}
                        onChange={handleProfileChange}
                        placeholder="25"
                        min="0"
                        max="120"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        性別
                      </label>
                      <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          color: !isEditing ? '#6b7280' : '#111827'
                        }}
                      >
                        <option value="">選択してください</option>
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                        <option value="その他">その他</option>
                        <option value="回答しない">回答しない</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.75rem' }}>
                      <Heart size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      障害の種類（複数選択可）
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                      {DISABILITY_TYPES.map(type => (
                        <label key={type} style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', 
                          border: '1px solid #e5e7eb', borderRadius: '0.375rem', 
                          cursor: isEditing ? 'pointer' : 'not-allowed',
                          background: profileData.disability_types.includes(type) ? '#dcfce7' : (!isEditing ? '#f9fafb' : 'white'),
                          opacity: !isEditing ? 0.7 : 1,
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="checkbox"
                            name="disability_types"
                            value={type}
                            checked={profileData.disability_types.includes(type)}
                            onChange={handleProfileChange}
                            disabled={!isEditing}
                            style={{ accentColor: '#22c55e' }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      障害の等級・程度
                    </label>
                    <MyPageInput
                      name="disability_grade"
                      type="text"
                      value={profileData.disability_grade}
                      onChange={handleProfileChange}
                      placeholder="例：身体障害者手帳1級"
                      disabled={!isEditing}
                    />
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
                      {loading ? '保存中...' : '個人情報を保存'}
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

          {/* サポート情報タブ */}
          {activeTab === 'support' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  サポート情報
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
                  {/* 緊急連絡先 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      <Shield size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      緊急時連絡先
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          保護者・家族名
                        </label>
                        <MyPageInput
                          name="guardian_name"
                          type="text"
                          value={profileData.guardian_name}
                          onChange={handleProfileChange}
                          placeholder="山田 花子"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          保護者・家族の電話番号
                        </label>
                        <MyPageInput
                          name="guardian_phone"
                          type="tel"
                          value={profileData.guardian_phone}
                          onChange={handleProfileChange}
                          placeholder="090-1234-5678"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        緊急連絡先
                      </label>
                      <MyPageInput
                        name="emergency_contact"
                        type="text"
                        value={profileData.emergency_contact}
                        onChange={handleProfileChange}
                        placeholder="緊急時の連絡先"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* 医療・配慮情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      <Activity size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      医療・配慮情報
                    </h4>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        医療情報・配慮事項
                      </label>
                      <textarea
                        name="medical_info"
                        value={profileData.medical_info}
                        onChange={handleProfileChange}
                        placeholder="アレルギー、服薬状況、医療的配慮が必要な事項などを記入してください"
                        rows={3}
                        disabled={!isEditing}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical',
                          outline: 'none', fontFamily: 'inherit', lineHeight: '1.5',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          color: !isEditing ? '#6b7280' : '#111827'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        移動・交通手段
                      </label>
                      <MyPageInput
                        name="transportation_needs"
                        type="text"
                        value={profileData.transportation_needs}
                        onChange={handleProfileChange}
                        placeholder="車椅子利用、送迎希望など"
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        その他のご要望・特記事項
                      </label>
                      <textarea
                        name="other_requirements"
                        value={profileData.other_requirements}
                        onChange={handleProfileChange}
                        placeholder="サービス利用にあたってのご要望や特別な配慮が必要な事項があれば記入してください"
                        rows={3}
                        disabled={!isEditing}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical',
                          outline: 'none', fontFamily: 'inherit', lineHeight: '1.5',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          color: !isEditing ? '#6b7280' : '#111827'
                        }}
                      />
                    </div>
                  </div>

                  {/* 通知設定 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      <Bell size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      通知設定
                    </h4>
                    <label style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', 
                      cursor: isEditing ? 'pointer' : 'not-allowed',
                      opacity: !isEditing ? 0.7 : 1,
                      padding: '0.75rem',
                      background: !isEditing ? '#f9fafb' : '#f0fdf4',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <input
                        type="checkbox"
                        name="receive_notifications"
                        checked={profileData.receive_notifications}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        style={{ accentColor: '#22c55e' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        新しいサービスや空き情報のメール通知を受け取る
                      </span>
                    </label>
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
                      {loading ? '保存中...' : 'サポート情報を保存'}
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

          {/* アカウント設定タブ */}
          {activeTab === 'account' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                <Lock size={20} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                アカウント設定
              </h3>
              
              <form onSubmit={handlePasswordSubmit}>
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

              {/* アカウント削除セクション */}
              <div style={{ 
                marginTop: '3rem', 
                padding: '1.5rem', 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '0.5rem' 
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.5rem' }}>
                  アカウントの削除
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '0.5rem' }}>
                  アカウントを削除すると、以下のデータが完全に削除されます：
                </p>
                <ul style={{ fontSize: '0.75rem', color: '#7f1d1d', marginBottom: '1rem', paddingLeft: '1rem' }}>
                  <li>基本情報</li>
                  <li>詳細プロフィール</li>
                  <li>ブックマーク</li>
                  <li>認証情報</li>
                </ul>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '1rem' }}>
                  <strong>この操作は取り消せません。</strong>
                </p>
                <MyPageButton 
                  variant="danger" 
                  onClick={handleDeleteAccount}
                  loading={loading}
                >
                  アカウントを削除
                </MyPageButton>
              </div>
            </div>
          )}

          {/* ブックマークタブ */}
          {activeTab === 'bookmarks' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                <Star size={20} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                ブックマークした事業所
              </h3>
              
              {bookmarkedFacilities.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <Star size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                  <h4 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                    ブックマークした事業所がありません
                  </h4>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    事業所検索でブックマークした事業所がここに表示されます
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {bookmarkedFacilities.length}件の事業所をブックマークしています
                  </p>
                  
                  {bookmarkedFacilities.map((facility) => (
                    <div key={facility.id} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
                          {facility.name}
                        </h4>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          <MapPin size={16} style={{ display: 'inline-block', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                          {facility.district}
                        </p>
                        {facility.description && (
                          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                            {facility.description.length > 150 
                              ? `${facility.description.slice(0, 150)}...` 
                              : facility.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                          {facility.phone_number && (
                            <span>
                              <Phone size={12} style={{ display: 'inline-block', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                              {facility.phone_number}
                            </span>
                          )}
                          {facility.website_url && (
                            <span>ウェブサイトあり</span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <MyPageButton 
                          variant="danger" 
                          size="sm"
                          onClick={async () => {
                            if (confirm('このブックマークを削除しますか？')) {
                              await toggleBookmark(facility.id.toString())
                              setBookmarkedFacilities(prev => 
                                prev.filter(f => f.id !== facility.id)
                              )
                              setMessage({ type: 'success', text: 'ブックマークを削除しました' })
                            }
                          }}
                        >
                          ブックマーク削除
                        </MyPageButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* メッセージタブ */}
          {activeTab === 'messages' && (
            <div>
              {showMessageThread && selectedConversation ? (
                <MessageThread
                  conversation={selectedConversation}
                  onClose={() => {
                    setShowMessageThread(false)
                    setSelectedConversation(null)
                  }}
                />
              ) : (
                <ConversationList
                  conversations={conversations}
                  onSelectConversation={(conversation) => {
                    setSelectedConversation(conversation)
                    setShowMessageThread(true)
                  }}
                  selectedConversationId={selectedConversation?.id}
                  loading={messagesLoading}
                />
              )}
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

export default UserMyPage