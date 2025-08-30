// pages/business/mypage/index.tsx - 完全版
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
import Header from '../../components/layout/Header'

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

// 障害福祉サービスカテゴリ（完全版）
const SERVICE_CATEGORIES = {
  '訪問系サービス': [
    { id: 1, name: '居宅介護', description: '自宅で入浴、排せつ、食事の介護などを行います' },
    { id: 2, name: '重度訪問介護', description: '重度の肢体不自由者または重度の知的障害もしくは精神障害により行動上著しい困難を有する方に、自宅で入浴、排せつ、食事の介護、外出時における移動支援などを総合的に行います' },
    { id: 3, name: '同行援護', description: '視覚障害により、移動に著しい困難を有する方に、移動時及びそれに伴う外出先において必要な視覚的情報の提供（代筆・代読を含む）、移動の援護等の便宜を供与します' },
    { id: 4, name: '行動援護', description: '自己判断能力が制限されている方が行動する際に、危険を回避するために必要な支援、外出支援を行います' },
    { id: 5, name: '重度障害者等包括支援', description: '介護の必要性がとても高い方に、居宅介護等複数のサービスを包括的に行います' }
  ],
  '日中活動系サービス': [
    { id: 6, name: '療養介護', description: '医療と常時介護を必要とする方に、医療機関で機能訓練、療養上の管理、看護、介護及び日常生活の世話を行います' },
    { id: 7, name: '生活介護', description: '常に介護を必要とする方に、昼間、入浴、排せつ、食事の介護等を行うとともに、創作的活動又は生産活動の機会を提供します' },
    { id: 8, name: '短期入所', description: '自宅で介護する方が病気の場合などに、短期間、夜間も含め施設で入浴、排せつ、食事の介護等を行います' }
  ],
  '居住系サービス': [
    { id: 10, name: '共同生活援助', description: '夜間や休日、共同生活を行う住居で、相談や日常生活上の援助を行います' },
    { id: 11, name: '自立生活援助', description: '一人暮らしに必要な理解力・生活力等を補うため、定期的な居宅訪問や随時の対応により日常生活における課題を把握し、必要な支援を行います' }
  ],
  '施設系サービス': [
    { id: 9, name: '施設入所支援', description: '施設に入所する方に、夜間や休日、入浴、排せつ、食事の介護等を行います' }
  ],
  '訓練系・就労系サービス': [
    { id: 12, name: '自立訓練(機能訓練)', description: '自立した日常生活又は社会生活ができるよう、一定期間、身体機能又は生活能力の向上のために必要な訓練を行います' },
    { id: 13, name: '自立訓練(生活訓練)', description: '自立した日常生活又は社会生活ができるよう、一定期間、生活能力の向上のために必要な訓練を行います' },
    { id: 14, name: '宿泊型自立訓練', description: '夜間も含め施設において、機能訓練、生活訓練等を実施するとともに、地域移行に向けた関係機関との連絡調整等を行います' },
    { id: 15, name: '就労移行支援', description: '一般企業等への就労を希望する方に、一定期間、就労に必要な知識及び能力の向上のために必要な訓練を行います' },
    { id: 16, name: '就労継続支援Ａ型', description: '一般企業等での就労が困難な方に、雇用契約を結び、生産活動その他の活動の機会を提供するとともに、その他の就労に必要な知識及び能力の向上のために必要な訓練を行います' },
    { id: 17, name: '就労継続支援Ｂ型', description: '一般企業等での就労が困難な方に、雇用契約を結ばず、生産活動その他の活動の機会を提供するとともに、その他の就労に必要な知識及び能力の向上のために必要な訓練を行います' },
    { id: 18, name: '就労定着支援', description: '生活介護、自立訓練、就労移行支援又は就労継続支援を利用して、通常の事業所に新たに雇用された方の就労の継続を図るため、企業、障害福祉サービス事業者、医療機関等との連絡調整を行うとともに、雇用に伴い生じる日常生活又は社会生活を営む上での各般の問題に関する相談、指導及び助言等の必要な支援を行います' }
  ],
  '障害児通所系サービス': [
    { id: 19, name: '児童発達支援', description: '未就学の障害のある子どもが主に通い、支援を受けるための施設です。日常生活の自立支援や機能訓練を行ったり、保育園や幼稚園のように遊びや学びの場を提供したりします' },
    { id: 20, name: '医療型児童発達支援', description: '未就学の障害のある子どもが主に通い、児童発達支援及び治療を行います' },
    { id: 21, name: '放課後等デイサービス', description: '就学中の障害のある子どもが、放課後や夏休み等の長期休暇中において、生活能力向上のための訓練等を継続的に提供することにより、学校教育と相まって障害のある子どもの自立を促進するとともに、放課後等の居場所づくりを行います' },
    { id: 22, name: '居宅訪問型児童発達支援', description: '重度の障害等の状態にある障害児であって、児童発達支援等の通所支援を利用するために外出することが著しく困難な障害児に発達支援を提供します' },
    { id: 23, name: '保育所等訪問支援', description: '障害児以外の児童との集団生活への適応のための専門的な支援その他の便宜を供与します' }
  ],
  '障害児入所系サービス': [
    { id: 24, name: '福祉型障害児入所施設', description: '障害のある子どもを入所させて、保護、日常生活の指導及び知識技能の付与を行います' },
    { id: 25, name: '医療型障害児入所施設', description: '障害のある子どもを入所させて、保護、日常生活の指導及び知識技能の付与並びに治療を行います' }
  ],
  '相談系サービス': [
    { id: 26, name: '地域相談支援(地域移行)', description: '障害者支援施設等に入所している障害者又は精神科病院に入院している精神障害者等に対し、住居の確保その他の地域における生活に移行するための活動に関する相談その他の便宜を供与します' },
    { id: 27, name: '地域相談支援(地域定着)', description: '居宅において単身等で生活する障害者に対し、常時の連絡体制を確保し、障害の特性に起因して生じた緊急の事態等に相談その他の便宜を供与します' },
    { id: 28, name: '計画相談支援', description: '障害福祉サービス等の利用計画の作成やモニタリング等を行います' },
    { id: 29, name: '障害児相談支援', description: '障害児通所支援等の利用計画の作成やモニタリング等を行います' }
  ]
}

// 利用可能状況の定義（データベースの列挙型に正確に対応）
const AVAILABILITY_STATUS = {
  'available': { label: '受け入れ可能', color: '#22c55e', bgColor: '#f0fdf4' },
  'unavailable': { label: '受け入れ不可', color: '#ef4444', bgColor: '#fef2f2' }
} as const

type AvailabilityStatus = keyof typeof AVAILABILITY_STATUS

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
  style?: React.CSSProperties
}> = ({ name, type = 'text', value, onChange, placeholder, required, disabled, min, max, style }) => {
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
        color: disabled ? '#6b7280' : '#111827',
        ...style
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

// サービス管理コンポーネント
const ServiceManagement: React.FC<{
  facilityId: string
  isProfileComplete: boolean
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void
  setActiveTab: (tab: 'profile' | 'facility' | 'services' | 'account') => void
}> = ({ facilityId, isProfileComplete, setMessage, setActiveTab }) => {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [serviceDetails, setServiceDetails] = useState<Record<number, {
    availability: AvailabilityStatus
    capacity: number | null
    current_users: number
  }>>({})

  // サービス情報を読み込み
  useEffect(() => {
    const loadServices = async () => {
      if (!facilityId) return

      setInitialLoading(true)
      try {
        const { data, error } = await supabase
          .from('facility_services')
          .select('*')
          .eq('facility_id', facilityId)

        if (error) {
          console.error('サービス情報取得エラー:', error)
          throw error
        }

        setServices(data || [])
        setSelectedServices(new Set(data?.map(s => s.service_id) || []))
        
        // サービス詳細情報を設定
        const details: Record<number, any> = {}
        data?.forEach(service => {
          details[service.service_id] = {
            availability: service.availability || 'unavailable',
            capacity: service.capacity,
            current_users: service.current_users || 0
          }
        })
        setServiceDetails(details)

      } catch (error: any) {
        console.error('サービス読み込みエラー:', error)
        setMessage({ 
          type: 'error', 
          text: `サービス情報の読み込みに失敗しました: ${error.message}` 
        })
      } finally {
        setInitialLoading(false)
      }
    }

    loadServices()
  }, [facilityId, setMessage])

  // サービス選択の切り替え
  const toggleService = (serviceId: number) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
      // サービス詳細も削除
      const newDetails = { ...serviceDetails }
      delete newDetails[serviceId]
      setServiceDetails(newDetails)
    } else {
      newSelected.add(serviceId)
      // デフォルトの詳細情報を追加
      setServiceDetails(prev => ({
        ...prev,
        [serviceId]: {
          availability: 'unavailable',
          capacity: null,
          current_users: 0
        }
      }))
    }
    setSelectedServices(newSelected)
  }

  // サービス詳細の更新
  const updateServiceDetail = (serviceId: number, field: string, value: any) => {
    setServiceDetails(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }))
  }

  // カテゴリの展開切り替え
  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName)
  }

  // サービス情報の保存
  const handleSaveServices = async () => {
    if (!facilityId) return

    setLoading(true)
    try {
      console.log('=== サービス情報保存開始 ===')
      console.log('Facility ID:', facilityId)
      console.log('Selected Services:', Array.from(selectedServices))
      
      // 既存のサービスを削除
      const { error: deleteError } = await supabase
        .from('facility_services')
        .delete()
        .eq('facility_id', facilityId)

      if (deleteError) {
        console.error('サービス削除エラー:', deleteError)
        throw new Error(`既存サービスの削除に失敗しました: ${deleteError.message}`)
      }

      // 選択されたサービスを挿入
      if (selectedServices.size > 0) {
        const servicesToInsert = Array.from(selectedServices).map(serviceId => {
          const details = serviceDetails[serviceId] || {
            availability: 'unavailable',
            capacity: null,
            current_users: 0
          }
          
          return {
            facility_id: parseInt(facilityId),
            service_id: serviceId,
            availability: details.availability,
            capacity: details.capacity,
            current_users: details.current_users,
            updated_at: new Date().toISOString()
          }
        })

        console.log('挿入するサービスデータ:', servicesToInsert)

        const { error: insertError } = await supabase
          .from('facility_services')
          .insert(servicesToInsert)

        if (insertError) {
          console.error('サービス挿入エラー:', insertError)
          throw new Error(`サービス情報の保存に失敗しました: ${insertError.message}`)
        }
      }

      setMessage({ type: 'success', text: 'サービス情報を更新しました' })
      setIsEditing(false)
      
      // データを再読み込み
      const { data } = await supabase
        .from('facility_services')
        .select('*')
        .eq('facility_id', facilityId)
      
      setServices(data || [])
      console.log('サービス更新完了')

    } catch (error: any) {
      console.error('サービス保存エラー:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'サービス情報の保存に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  // 編集キャンセル
  const handleCancelEdit = () => {
    setSelectedServices(new Set(services.map(s => s.service_id)))
    setExpandedCategory(null)
    
    // サービス詳細を元に戻す
    const details: Record<number, any> = {}
    services.forEach(service => {
      details[service.service_id] = {
        availability: service.availability || 'unavailable',
        capacity: service.capacity,
        current_users: service.current_users || 0
      }
    })
    setServiceDetails(details)
    setIsEditing(false)
  }

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #e5e7eb', 
          borderTop: '3px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p>サービス情報を読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
          <Award size={20} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          サービス管理
        </h3>
        
        {isProfileComplete ? (
          <MyPageButton
            variant={isEditing ? "secondary" : "primary"}
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            disabled={loading}
          >
            <Edit3 size={16} />
            {isEditing ? '編集をキャンセル' : '編集する'}
          </MyPageButton>
        ) : (
          <div style={{ 
            padding: '0.5rem 1rem',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#92400e'
          }}>
            事業所情報を完了してください
          </div>
        )}
      </div>

      {!isProfileComplete ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: '#fefbf0',
          borderRadius: '0.5rem',
          border: '1px solid #fbbf24'
        }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>
            サービス管理を利用するには
          </h4>
          <p style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            まず事業所の基本情報を完了させる必要があります
          </p>
          <MyPageButton 
            variant="primary" 
            onClick={() => setActiveTab('facility')}
          >
            事業所情報を完了する
          </MyPageButton>
        </div>
      ) : (
        <div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
            提供可能な障害福祉サービスを選択し、受入状況や定員を設定してください。
          </p>

          {isEditing ? (
            // 編集モード：アコーディオン形式でサービス選択
            <div style={{ marginBottom: '2rem' }}>
              {Object.entries(SERVICE_CATEGORIES).map(([categoryName, categoryServices]) => (
                <div key={categoryName} style={{ marginBottom: '1rem' }}>
                  <button
                    onClick={() => toggleCategory(categoryName)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: expandedCategory === categoryName ? '#f0fdf4' : '#f9fafb',
                      border: expandedCategory === categoryName ? '2px solid #22c55e' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: expandedCategory === categoryName ? '#166534' : '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{categoryName}</span>
                    <span style={{ 
                      transform: expandedCategory === categoryName ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▼
                    </span>
                  </button>

                  {expandedCategory === categoryName && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      padding: '1rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {categoryServices.map(service => (
                          <div
                            key={service.id}
                            style={{
                              padding: '1rem',
                              border: selectedServices.has(service.id) 
                                ? '1px solid #22c55e' 
                                : '1px solid #e5e7eb',
                              borderRadius: '0.5rem',
                              background: selectedServices.has(service.id) 
                                ? '#f0fdf4' 
                                : '#f9fafb'
                            }}
                          >
                            {/* サービス基本情報 */}
                            <div 
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleService(service.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedServices.has(service.id)}
                                  onChange={() => toggleService(service.id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <h5 style={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: 600, 
                                  color: selectedServices.has(service.id) ? '#166534' : '#374151',
                                  margin: 0 
                                }}>
                                  {service.name}
                                </h5>
                              </div>
                              <p style={{ 
                                fontSize: '0.75rem', 
                                color: selectedServices.has(service.id) ? '#166534' : '#6b7280',
                                margin: 0,
                                lineHeight: '1.4',
                                paddingLeft: '1.5rem',
                                marginBottom: selectedServices.has(service.id) ? '1rem' : 0
                              }}>
                                {service.description}
                              </p>
                            </div>

                            {/* サービス詳細設定 */}
                            {selectedServices.has(service.id) && (
                              <div style={{ 
                                paddingLeft: '1.5rem', 
                                borderTop: '1px solid #e5e7eb', 
                                paddingTop: '1rem' 
                              }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                  
                                  {/* 受入状況 */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                      受入状況
                                    </label>
                                    <select
                                      value={serviceDetails[service.id]?.availability || 'unavailable'}
                                      onChange={(e) => updateServiceDetail(service.id, 'availability', e.target.value as AvailabilityStatus)}
                                      style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        fontSize: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        background: 'white'
                                      }}
                                    >
                                      {Object.entries(AVAILABILITY_STATUS).map(([value, { label }]) => (
                                        <option key={value} value={value}>{label}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* 定員 */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                      定員（任意）
                                    </label>
                                    <MyPageInput
                                      name={`capacity_${service.id}`}
                                      type="number"
                                      value={serviceDetails[service.id]?.capacity?.toString() || ''}
                                      onChange={(e) => updateServiceDetail(service.id, 'capacity', e.target.value ? parseInt(e.target.value) : null)}
                                      placeholder="人数"
                                      min="0"
                                      style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                                    />
                                  </div>

                                  {/* 現在の利用者数 */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                      現在利用者数
                                    </label>
                                    <MyPageInput
                                      name={`current_users_${service.id}`}
                                      type="number"
                                      value={serviceDetails[service.id]?.current_users?.toString() || '0'}
                                      onChange={(e) => updateServiceDetail(service.id, 'current_users', parseInt(e.target.value) || 0)}
                                      placeholder="0"
                                      min="0"
                                      style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // 表示モード：選択されたサービスの表示
            selectedServices.size > 0 ? (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                  現在提供中のサービス ({selectedServices.size}件)
                </h4>
                
                {Object.entries(SERVICE_CATEGORIES).map(([categoryName, categoryServices]) => {
                  const categorySelectedServices = categoryServices.filter(service => selectedServices.has(service.id))
                  
                  if (categorySelectedServices.length === 0) return null

                  return (
                    <div key={categoryName} style={{ marginBottom: '2rem' }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#6b7280',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>
                        {categoryName}
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categorySelectedServices.map(service => {
                          const details = serviceDetails[service.id]
                          const availability = details?.availability || 'unavailable'
                          const statusInfo = AVAILABILITY_STATUS[availability]
                          
                          return (
                            <div 
                              key={service.id}
                              style={{
                                padding: '1rem',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <h6 style={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: 600, 
                                  color: '#374151',
                                  margin: '0 0 0.25rem 0'
                                }}>
                                  {service.name}
                                </h6>
                                <p style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6b7280',
                                  margin: 0,
                                  lineHeight: '1.4',
                                  maxWidth: '600px'
                                }}>
                                  {service.description}
                                </p>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {/* 利用状況 */}
                                {details?.capacity && (
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {details.current_users}/{details.capacity}人
                                  </div>
                                )}
                                
                                {/* ステータス */}
                                <div style={{
                                  padding: '0.25rem 0.75rem',
                                  background: statusInfo.bgColor,
                                  color: statusInfo.color,
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {statusInfo.label}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <Award size={32} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  まだサービスが登録されていません。<br />
                  「編集する」ボタンから提供可能なサービスを選択してください。
                </p>
              </div>
            )
          )}

          {isEditing && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
              <MyPageButton 
                variant="primary" 
                onClick={handleSaveServices}
                loading={loading}
              >
                <Save size={16} />
                {loading ? '保存中...' : 'サービス情報を保存'}
              </MyPageButton>
              <MyPageButton 
                variant="secondary" 
                onClick={handleCancelEdit}
                disabled={loading}
              >
                キャンセル
              </MyPageButton>
            </div>
          )}
        </div>
      )}
    </div>
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
          console.error('事業者プロファイル取得エラー:', facilityError)
          throw new Error(`事業者情報の取得に失敗しました: ${facilityError.message}`)
        }

        if (!facilityData?.success) {
          console.error('事業者プロファイル取得失敗:', facilityData)
          throw new Error('事業者情報が見つかりません')
        }

        const userData = facilityData.data.user_info || {}
        const facilityInfo = facilityData.data.facility_info || {}

        // プロファイル完了判定
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
          text: `プロファイル情報の読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
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

  // プロファイル更新処理
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setMessage(null)

    try {
      console.log('=== 事業者プロファイル更新開始 ===')
      
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
        console.error('プロファイル更新エラー:', updateError)
        throw new Error(`更新に失敗しました: ${updateError.message}`)
      }

      if (!updateResult?.success) {
        console.error('プロファイル更新失敗:', updateResult)
        throw new Error(updateResult?.message || '更新に失敗しました')
      }
      
      console.log('プロファイル更新成功:', updateResult)

      setMessage({ type: 'success', text: '事業者プロファイルを更新しました' })
      setIsEditing(false)
      
      const updatedProfile = {
        ...profileData,
        is_profile_complete: updateResult.is_profile_complete || false,
        is_active: updateResult.is_active || false
      }
      setProfileData(updatedProfile)
      setOriginalData(updatedProfile)

    } catch (error: any) {
      console.error('事業者プロファイル更新エラー:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'プロファイル更新に失敗しました' 
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

  const isLoggedIn = !!user

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Head>
        <title>事業者マイページ - ケアコネクト</title>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Building2 size={28} style={{ color: '#22c55e' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              事業者マイページ
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            事業所情報の管理・編集やサービス設定ができます
          </p>
          
          {/* プロファイル完了ステータス */}
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
                  {profileData.is_active ? '検索対象として公開中' : 'プロファイル完了'}
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#92400e' }}>プロファイル未完了</span>
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
                        placeholder="東京都渋谷区神南1-2-3 ビル名階数"
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
            <ServiceManagement 
              facilityId={profileData.facility_id}
              isProfileComplete={profileData.is_profile_complete}
              setMessage={setMessage}
              setActiveTab={setActiveTab}
            />
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