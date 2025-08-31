// pages/index.tsx - 検索状態復元機能付きサービス検索
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { getUserBookmarks } from '@/lib/supabase/bookmarks';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useDevice } from '../hooks/useDevice';
import { Bold } from 'lucide-react';

// 地図コンポーネントを動的インポート（SSR対応）
const MapView = dynamic(() => import('../components/search/MapView'), {
  ssr: false,
  loading: () => (
    <div className="map-loading" style={{
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      color: '#6b7280'
    }}>
      <div className="loading-spinner" style={{
        fontSize: '2rem',
        marginBottom: '1rem',
        animation: 'spin 2s linear infinite'
      }}>
        🗺️
      </div>
      <p style={{ fontSize: '0.875rem' }}>地図を読み込み中...</p>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}) as React.ComponentType<{
  facilities: Facility[];
  loading?: boolean;
  onFacilitySelect?: (facility: Facility) => void;
}>;

// ToggleSwitchコンポーネント
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  leftIcon?: string;
  rightIcon?: string;
  disabled?: boolean;
}> = ({ checked, onChange, leftLabel, rightLabel, leftIcon, rightIcon, disabled = false }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <span style={{ 
        fontSize: '0.875rem', 
        fontWeight: !checked ? '600' : '400',
        color: !checked ? '#22c55e' : '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {leftIcon && <span>{leftIcon}</span>}
        {leftLabel}
      </span>
      
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '52px',
          height: '28px',
          backgroundColor: checked ? '#22c55e' : '#d1d5db',
          borderRadius: '14px',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          border: '1px solid ' + (checked ? '#16a34a' : '#9ca3af')
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            position: 'absolute',
            top: '1px',
            left: checked ? '26px' : '1px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
      
      <span style={{ 
        fontSize: '0.875rem', 
        fontWeight: checked ? '600' : '400',
        color: checked ? '#22c55e' : '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {rightIcon && <span>{rightIcon}</span>}
        {rightLabel}
      </span>
    </div>
  );
};

// 型定義
interface Service {
  id: number;
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
}

interface SearchResponse {
  facilities: Facility[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SearchFilters {
  query: string;
  district: string;
  serviceIds: number[];
  availabilityOnly: boolean;
}

// URLパラメータエンコード/デコード関数
const encodeSearchFilters = (filters: SearchFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (filters.query) params.q = filters.query;
  if (filters.district) params.district = filters.district;
  if (filters.serviceIds.length > 0) params.services = filters.serviceIds.join(',');
  if (filters.availabilityOnly) params.available = '1';
  
  return params;
};

const decodeSearchFilters = (query: Record<string, string | string[] | undefined>): SearchFilters => {
  const getString = (value: string | string[] | undefined): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0] || '';
    return '';
  };

  return {
    query: getString(query.q),
    district: getString(query.district),
    serviceIds: query.services 
      ? getString(query.services).split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      : [],
    availabilityOnly: getString(query.available) === '1'
  };
};

// Updated SERVICE_CATEGORIES based on your CSV data - Replace the existing SERVICE_CATEGORIES in your code
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
};

// SearchFilterコンポーネント（検索状態復元対応）- アコーディオン方式
const SearchFilterComponent: React.FC<{
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  initialFilters?: SearchFilters;
}> = ({ onSearch, loading = false, initialFilters }) => {
  const [query, setQuery] = useState(initialFilters?.query || '');
  const [district, setDistrict] = useState(initialFilters?.district || '');
  const [selectedServices, setSelectedServices] = useState<number[]>(initialFilters?.serviceIds || []);
  const [availabilityOnly, setAvailabilityOnly] = useState(initialFilters?.availabilityOnly || false);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // アコーディオン用
  const { isMobile } = useDevice(); // デバイス判定フックを使用

  // 初期値が設定された場合の処理
  useEffect(() => {
    if (initialFilters) {
      setQuery(initialFilters.query);
      setDistrict(initialFilters.district);
      setSelectedServices(initialFilters.serviceIds);
      setAvailabilityOnly(initialFilters.availabilityOnly);
      // サービス選択がある場合は展開表示
      if (initialFilters.serviceIds.length > 0) {
        setShowServiceFilter(true);
      }
    }
  }, [initialFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ 
      query, 
      district, 
      serviceIds: selectedServices,
      availabilityOnly 
    });
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const clearServices = () => {
    setSelectedServices([]);
  };

  // カテゴリの展開/収縮
  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // 東京都の全市区町村リスト
  const districts = [
    // 特別区（23区）
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区',
    // 多摩地域の市
    '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市',
    '調布市', '町田市', '小金井市', '小平市', '日野市', '東村山市', '国分寺市',
    '国立市', '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市', '武蔵村山市',
    '多摩市', '稲城市', 'あきる野市', '西東京市',
    // 西多摩郡
    '瑞穂町', '日の出町', '檜原村', '奥多摩町',
    // 島嶼部
    '大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村',
    '八丈町', '青ヶ島村', '小笠原村'
  ];

  const allServices = Object.values(SERVICE_CATEGORIES).flat();

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="事業所名で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="filters-section">
        <h3 className="filters-title">検索条件</h3>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">地区</label>
            <select
              className="filter-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">すべての地区</option>
              <optgroup label="特別区">
                {districts.slice(0, 23).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="多摩地域市部">
                {districts.slice(23, 49).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="西多摩郡">
                {districts.slice(49, 53).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="島嶼部">
                {districts.slice(53).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              提供サービス 
              {selectedServices.length > 0 && (
                <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>
                  ({selectedServices.length}件選択中)
                </span>
              )}
            </label>
            <button
              type="button"
              className="filter-select"
              style={{ 
                textAlign: 'left',
                cursor: 'pointer',
                background: showServiceFilter ? '#f0fdf4' : 'white'
              }}
              onClick={() => setShowServiceFilter(!showServiceFilter)}
            >
              {selectedServices.length === 0 
                ? 'サービスを選択...' 
                : `${selectedServices.length}件のサービスを選択中`
              }
              <span style={{ float: 'right' }}>
                {showServiceFilter ? '▲' : '▼'}
              </span>
            </button>
          </div>
        </div>

        {/* サービス選択パネル（アコーディオン方式） */}
        {showServiceFilter && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            {/* ヘッダー部分 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem' 
            }}>
              <span className="filter-label">サービスを選択してください</span>
              <button
                type="button"
                onClick={clearServices}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                すべてクリア
              </button>
            </div>

            {/* 選択済みサービスを上部に表示 */}
            {selectedServices.length > 0 && (
              <div style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db'
              }}>
                <div style={{ 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  選択中のサービス ({selectedServices.length}件):
                </div>
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {selectedServices.map(serviceId => {
                    const service = allServices.find(s => s.id === serviceId);
                    return service ? (
                      <span
                        key={serviceId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          background: '#dcfce7',
                          color: '#166534',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {service.name}
                        <button
                          type="button"
                          onClick={() => handleServiceToggle(serviceId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#166534',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* カテゴリ別アコーディオン */}
            {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                {/* カテゴリヘッダー（クリック可能） */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: expandedCategory === category ? '#f3f4f6' : 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = expandedCategory === category ? '#f3f4f6' : 'white';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{category}</span>
                    {/* 選択されたサービス数を表示 */}
                    {(() => {
                      const selectedInCategory = services.filter(s => selectedServices.includes(s.id));
                      return selectedInCategory.length > 0 ? (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          background: '#22c55e',
                          color: 'white',
                          borderRadius: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {selectedInCategory.length}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <span style={{ 
                    transform: expandedCategory === category ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </span>
                </button>

                {/* カテゴリ内容（展開時のみ表示） */}
                {expandedCategory === category && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {services.map((service) => (
                        <label
                          key={service.id}
                          className="filter-checkbox-container"
                          style={{ 
                            padding: '0.75rem',
                            background: selectedServices.includes(service.id) ? '#dcfce7' : '#f9fafb',
                            borderRadius: '0.375rem',
                            border: selectedServices.includes(service.id) ? '2px solid #22c55e' : '1px solid #e5e7eb',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => {
                            if (!selectedServices.includes(service.id)) {
                              e.currentTarget.style.border = '1px solid #d1d5db';
                            }
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.border = selectedServices.includes(service.id) ? '2px solid #22c55e' : '1px solid #e5e7eb';
                          }}
                        >
                          <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 500, 
                              fontSize: '0.875rem',
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>
                              {service.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              lineHeight: 1.3
                            }}>
                              {service.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          alignItems: 'left', 
          justifyContent: 'center', 
          gap: '3rem', 
          marginTop: '1.5rem',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'left'
        }}>
          <label className="filter-checkbox-container">
            <input
              type="checkbox"
              className="filter-checkbox"
              style={{ 
                width: '16px',      
                height: '16px',     
                transform: 'scale(1.2)' 
              }}
              checked={availabilityOnly}
              onChange={(e) => setAvailabilityOnly(e.target.checked)}
            />
            <span className="filter-checkbox-label" style={{ fontSize: '1.25rem', fontWeight: '500' }}>空きのある事業所のみ</span>
          </label>
          <button
            type="submit"
            className="filter-search-button"
            disabled={loading}
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ページネーションコンポーネント
const Pagination: React.FC<{
  pagination: SearchResponse['pagination'];
  onPageChange: (page: number) => void;
  loading?: boolean;
}> = ({ pagination, onPageChange, loading = false }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, hasNext, hasPrev } = pagination;
  
  const getPageNumbers = () => {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, page - half);
    let end = Math.min(pages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageNumbers = getPageNumbers();

  const buttonStyle = (isActive: boolean = false, disabled: boolean = false) => ({
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    background: isActive ? '#22c55e' : disabled ? '#f9fafb' : 'white',
    color: isActive ? 'white' : disabled ? '#9ca3af' : '#374151',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: isActive ? '600' : '400',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s'
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column', // 縦方向に配置
      alignItems: 'center',    // 中央揃え
      gap: '0.5rem',          // 要素間のスペース
      marginTop: '2rem',
      marginLeft: '0rem',
      padding: '1rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || loading}
          style={buttonStyle(false, !hasPrev || loading)}
        >
          ← 前へ
        </button>

        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              disabled={loading}
              style={buttonStyle(false, loading)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span style={{ color: '#9ca3af', padding: '0 0.5rem' }}>...</span>
            )}
          </>
        )}

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            style={buttonStyle(pageNum === page, loading)}
          >
            {pageNum}
          </button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < pages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < pages - 1 && (
              <span style={{ color: '#9ca3af', padding: '0 0.5rem' }}>...</span>
            )}
            <button
              onClick={() => onPageChange(pages)}
              disabled={loading}
              style={buttonStyle(false, loading)}
            >
              {pages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || loading}
          style={buttonStyle(false, !hasNext || loading)}
        >
          次へ →
        </button>
      </div>
    </div>
  );
};

const FacilityCard: React.FC<{ 
  facility: Facility;
  isLoggedIn: boolean;
  isBookmarked: boolean;
  onBookmarkToggle: (facilityId: number) => void;
  searchParams?: string;
  isBookmarkMode?: boolean;
}> = ({ facility, isLoggedIn, isBookmarked, onBookmarkToggle, searchParams = '', isBookmarkMode = false }) => {
  const { isMobile } = useDevice(); // デバイス判定フックを使用
  
  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];
  
  // ブックマークモードの場合は特別なパラメータを追加
  const detailUrl = isBookmarkMode 
    ? `/facilities/${facility.id}?bookmark=1`
    : `/facilities/${facility.id}${searchParams ? `?${searchParams}` : ''}`;
  
  // スマホ版の簡略表示
  if (isMobile) {
    return (
      <div className="facility-card" style={{ 
        backgroundColor: 'white',
        borderRadius: '0.25rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '1rem',
        marginBottom: '0',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* 施設名とブックマーク */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              lineHeight: 1.3,
              flex: 1,
              overflowWrap: 'break-word',
              maxWidth: 'calc(100% - 15px)'
            }}>
              {facility.name}
            </h3>
            {isLoggedIn && (
              <button
                onClick={() => onBookmarkToggle(facility.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  color: isBookmarked ? '#eab308' : '#9ca3af',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                title={isBookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
              >
                {isBookmarked ? '★' : '☆'}
                <span style={{fontSize: '0.75rem', marginLeft: '0.25rem'}}>
                {isBookmarked ? '保存済み' : '保存'}
                </span>
                </button>
            )}
          </div>
          
          {/* 地区名 */}
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
           {facility.district}
          </p>

          {/* 提供サービス（簡略版） */}
          <div>
            <div style={{ 
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              提供サービス
            </div>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem'
            }}>
              {/* 利用可能なサービスを最大3つまで表示 */}
              {availableServices.slice(0, 3).map((service, index) => (
                <span
                  key={index}
                  className="service-tag available"
                >
                  ◯ {service.service?.name || 'サービス'}
                </span>
              ))}
              {/* 利用不可能なサービスを最大2つまで表示 */}
              {unavailableServices.slice(0, 2).map((service, index) => (
                <span
                  key={index}
                  className="service-tag unavailable"
                >
                  × {service.service?.name || 'サービス'}
                </span>
              ))}
              
              {/* サービス数が2つ以上ある場合は「他X件」を表示 */}
              {(availableServices.length + unavailableServices.length) > 3 && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  他{(availableServices.length + unavailableServices.length) - 3}件
                </span>
              )}
            </div>
          </div>

          {/* 詳細ボタン */}
          <Link href={detailUrl} passHref legacyBehavior>
            <a style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              padding: '0.75rem',
              background: '#22c55e',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s',
              marginTop: '0'
            }}>
              詳細を見る
            </a>
          </Link>
        </div>
      </div>
    );
  }

  // PC・タブレット版は既存の表示を維持
  return (
    <div className="facility-card">
      <div className="facility-image">
        {facility.image_url ? (
          <img src={facility.image_url} alt={facility.name} />
        ) : (
          <div className="no-image">🏢</div>
        )}
      </div>
      
      <div className="facility-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 className="facility-name" style={{ overflowWrap: 'break-word', maxWidth: 'calc(100% - 85px)' }}>{facility.name}</h3>
          {isLoggedIn && (
            <button
              onClick={() => onBookmarkToggle(facility.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                color: isBookmarked ? '#eab308' : '#9ca3af',
                fontSize: '1.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                if (!isBookmarked) {
                  e.currentTarget.style.color = '#eab308';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = isBookmarked ? '#eab308' : '#9ca3af';
              }}
              title={isBookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
            >
              {isBookmarked ? '★' : '☆'}
              <span style={{fontSize: '0.75rem', marginLeft: '0.25rem'}}>
                {isBookmarked ? '保存済み' : '保存'}
              </span>
            </button>
          )}
        </div>
        
        <p className="facility-district">- {facility.district} -</p>
        
        {facility.description && (
          <p className="facility-description">
            {facility.description.length > 120 
              ? facility.description.slice(0, 120) + '...' 
              : facility.description}
          </p>
        )}

        {facility.appeal_points && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="services-label">✨ アピールポイント</div>
            <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: '500' }}>
              {facility.appeal_points.length > 80 
                ? facility.appeal_points.slice(0, 80) + '...' 
                : facility.appeal_points}
            </p>
          </div>
        )}

        <div className="services-info">
          <div className="services-label">提供サービス</div>
          <div className="services-list">
            {availableServices.slice(0, 3).map((service, index) => (
              <span key={index} className="service-tag available">
                ◯ {service.service?.name || 'サービス'}
              </span>
            ))}
            {unavailableServices.slice(0, 2).map((service, index) => (
              <span key={`unavailable-${index}`} className="service-tag unavailable">
                × {service.service?.name || 'サービス'}
              </span>
            ))}
            {(availableServices.length + unavailableServices.length) > 3 && (
              <span className="more-services">
                他{(availableServices.length + unavailableServices.length) - 3}件
              </span>
            )}
          </div>
        </div>

        <div className="contact-info">
          {facility.phone_number && (
            <p>📞 {facility.phone_number}</p>
          )}
          {facility.website_url && (
            <p>
              🌐 <a href={facility.website_url} target="_blank" rel="noopener noreferrer">
                ウェブサイト
              </a>
            </p>
          )}
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            更新: {new Date(facility.updated_at).toLocaleDateString('ja-JP')}
          </p>
        </div>

        <div className="facility-actions">
          <Link href={detailUrl} passHref legacyBehavior>
            <a className="details-button" style={{ textDecoration: 'none' }}>
              詳細を見る
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}; 

// SearchResultsコンポーネント（検索状態保持対応）
const SearchResults: React.FC<{
  facilities: Facility[];
  pagination: SearchResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  isBookmarkMode: boolean;
  isLoggedIn: boolean;
  onBookmarkToggle: (facilityId: number) => void;
  isBookmarked: (facilityId: number) => boolean;
  searchParams?: string;
  isFirstVisit: boolean;
  handleCloseOverlay: () => void;
  isFirstVisitContinue: boolean;
}> = ({ 
  facilities, 
  pagination, 
  loading, 
  error, 
  onPageChange, 
  viewMode, 
  onViewModeChange,
  isBookmarkMode,
  isLoggedIn,
  onBookmarkToggle,
  isBookmarked,
  searchParams = '',
  isFirstVisit,
  handleCloseOverlay,
  isFirstVisitContinue
}) => {
  const router = useRouter();
  
  // 現在のURLから直接検索パラメータを取得
  const getCurrentSearchParams = (): string => {
    if (isBookmarkMode) return '';
    
    // router.queryから直接パラメータを構築
    const params = new URLSearchParams();
    
    const addParam = (key: string, queryKey: keyof typeof router.query) => {
      const value = router.query[queryKey];
      if (typeof value === 'string' && value) {
        params.append(key, value);
      } else if (Array.isArray(value) && value.length > 0 && value[0]) {
        params.append(key, value[0]);
      }
    };
    
    addParam('q', 'q');
    addParam('district', 'district'); 
    addParam('services', 'services');
    addParam('available', 'available');
    // ページ情報は1でなくても常に含める
    addParam('page', 'page');
    addParam('view', 'view');
    
    return params.toString();
  };

  const currentSearchParams = getCurrentSearchParams();

  // リストビューの場合のみloading判定を適用
  if (loading && viewMode === 'list') {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>{isBookmarkMode ? 'ブックマークを読み込み中...' : '検索中...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // 検索完了後に結果が0件の場合の表示（リストビューのみ）
  if (facilities.length === 0 && !loading && viewMode === 'list') {
    return (
      <div className="no-results">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3>{isBookmarkMode ? 'ブックマークした事業所がありません' : '検索結果がありません'}</h3>
        <p className="no-results-sub">
          {isBookmarkMode 
            ? '気になる事業所をブックマークしてみてください。'
            : '検索条件を変更して再度お試しください。'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="search-results">
      {/* 検索結果ヘッダーとビュー切替 */}
      <div className="view-toggle-container" style={{ marginBottom: '1.5rem' }}>
        <div className="results-header-with-toggle" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          position: 'relative',
          zIndex: (isFirstVisit && isFirstVisitContinue) ? 3000 : 'auto'
        }}>

        {/* 表示切替のチュートリアル吹き出し */}
        {isFirstVisit && isFirstVisitContinue && (
            <div
            style={{
                position: "absolute",
                bottom: "100%", // 対象要素の上に表示
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: "0.75rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem 1.5rem",
                whiteSpace: "nowrap",
                zIndex: 4000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                
                {/* 案内テキスト */}
                <p style={{ margin: 0, fontSize: '1rem', color: '#374151', fontWeight: 'bold' }}>
                リストと地図を切り替えることができます
                </p>

                {/* 終了ボタン */}
                <button
                onClick={handleCloseOverlay}
                className="tutorial-button-primary"
                style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                >
                チュートリアルを終了
                </button>
            </div>

            {/* 吹き出しの矢印（下向き） */}
            {/* 枠線用の矢印 */}
            <div
                style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginTop: '1px',
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid #e5e7eb",
                }}
            />
            {/* 本体用の矢印 */}
            <div
                style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid #ffffff",
                }}
            />
            {/* ボタンのホバー効果 */}
            <style jsx global>{`
                .tutorial-button-primary:hover {
                background-color: #16a34a !important;
                }
            `}</style>
            </div>
        )}

          <div className="results-title-container">
            <h2 className="results-title" style={{ margin: 0 }}>
              {isBookmarkMode ? 'ブックマーク' : '検索結果'} ({pagination?.total || facilities.length}件)
            </h2>
          </div>
          <div className="toggle-container">
            <ToggleSwitch
              checked={viewMode === 'map'}
              onChange={(checked) => onViewModeChange(checked ? 'map' : 'list')}
              leftLabel="リスト"
              rightLabel="地図"
              leftIcon=""
              rightIcon=""
              disabled={loading || isBookmarkMode}
            />
          </div>
        </div>
      </div>

      {/* 表示内容 */}
      {viewMode === 'map' ? (
        <MapView 
          facilities={facilities}
          loading={loading}
          onFacilitySelect={(facility) => {
            console.log('選択された事業所:', facility.name);
          }}
        />
      ) : (
        <>
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner">⏳</div>
              <p>検索中...</p>
            </div>
          )}
          
          {!loading && facilities.length > 0 && (
            <>
              <div className="facilities-grid">
                {facilities.map((facility) => (
                  <FacilityCard 
                    key={facility.id} 
                    facility={facility} 
                    isLoggedIn={isLoggedIn}
                    isBookmarked={isBookmarked(facility.id)}
                    onBookmarkToggle={onBookmarkToggle}
                    searchParams={currentSearchParams}
                    isBookmarkMode={isBookmarkMode}
                  />
                ))}
              </div>

              {/* ページネーション（リスト表示時のみ） */}
              {!isBookmarkMode && pagination && !loading && (
                <Pagination
                  pagination={pagination}
                  onPageChange={onPageChange}
                  loading={loading}
                />
              )}
            </>
          )}

          {!isLoggedIn && !isBookmarkMode && facilities.length > 0 && (
            <div style={{
              marginTop: '2rem',
              marginBottom: '1.25rem',
              padding: '1rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ color: '#2563eb', marginRight: '0.75rem'}}>💡</div>
                <div>
                  <p style={{ color: '#1e40af', fontWeight: '500', margin: 0 }}>ブックマーク機能について</p>
                  <p style={{ color: '#1e40af', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
                    <Link href="/auth/userlogin" style={{ textDecoration: 'underline', color: '#1d4ed8' }}>
                      ログイン
                    </Link>
                    すると、気になる事業所をブックマークして後で確認できます。
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// メインページ（検索状態復元機能付き）
const HomePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuthContext();
  const { bookmarks, refreshBookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  const { isMobile } = useDevice(); // デバイス判定フックを使用
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false); // 初期状態はfalse
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null);
  const [initialFilters, setInitialFilters] = useState<SearchFilters | undefined>(undefined);
  const [searchParamsString, setSearchParamsString] = useState('');
  const [preservedSearchParams, setPreservedSearchParams] = useState(''); // 検索状態を保持
  const [isRestoringBookmarks, setIsRestoringBookmarks] = useState(false); // 重複実行防止用
  const [isFirstVisit, setIsFirstVisit] = useState(false); // 初回アクセス管理用
  const [isFirstVisitContinue, setIsFirstVisitContinue] = useState(false); // 初回アクセス管理用

  const isLoggedIn = !!user;

  // URLパラメータから検索条件を復元
  useEffect(() => {
    if (router.isReady) {
      // ブックマークから戻ってきた場合の判定
      if (router.query.from_bookmark === '1' && isLoggedIn && !isRestoringBookmarks) {
        console.log('ブックマークから戻ってきました');
        setIsRestoringBookmarks(true);
        
        // URLをクリア
        router.replace('/', undefined, { shallow: true });
        
        // 直接Supabaseからブックマークを取得
        const restoreBookmarksDirectly = async () => {
          try {
            setIsBookmarkMode(true);
            setLoading(true);
            setError(null);
            setHasSearched(true);
            
            console.log('Supabaseからブックマークを直接取得...');
            console.log('現在のユーザーID:', user?.id);
            
            if (!user?.id) {
              throw new Error('ユーザーが見つかりません');
            }
            
            // 直接Supabaseからブックマークデータを取得
            const bookmarkData = await getUserBookmarks(user.id);
            console.log('取得したブックマークデータ:', bookmarkData);

            if (!bookmarkData || bookmarkData.length === 0) {
              console.log('ブックマークが0件');
              setFacilities([]);
              setPagination(null);
              setLoading(false);
              setIsRestoringBookmarks(false);
              return;
            }

            // ブックマークした事業所のIDを抽出
            const bookmarkedFacilityIds = bookmarkData.map((bookmark) => parseInt(bookmark.facility));
            console.log('ブックマーク事業所ID:', bookmarkedFacilityIds);

            // 事業所詳細を取得
            const facilityParams = new URLSearchParams();
            facilityParams.append('facility_ids', JSON.stringify(bookmarkedFacilityIds));
            
            console.log('事業所取得API呼び出し:', `/api/search/facilities?${facilityParams.toString()}`);
            
            const facilityResponse = await fetch(`/api/search/facilities?${facilityParams.toString()}`);
            
            if (!facilityResponse.ok) {
              const errorText = await facilityResponse.text();
              console.error('事業所取得APIエラー:', errorText);
              throw new Error(`事業所取得エラー: ${facilityResponse.status}`);
            }

            const facilityData: SearchResponse = await facilityResponse.json();
            
            console.log(`事業所取得完了: ${facilityData.facilities?.length || 0} 件`);

            if (facilityData.facilities && facilityData.facilities.length > 0) {
              setFacilities(facilityData.facilities);
              setPagination(facilityData.pagination);
            } else {
              setFacilities([]);
              setPagination(null);
              setError('ブックマークした事業所が見つかりませんでした。');
            }
            
          } catch (err) {
            console.error('ブックマーク復元エラー:', err);
            setError(err instanceof Error ? err.message : 'ブックマークの取得中にエラーが発生しました');
            setFacilities([]);
            setPagination(null);
          } finally {
            setLoading(false);
            setIsRestoringBookmarks(false);
          }
        };
        
        restoreBookmarksDirectly();
        return;
      }

      // URLに検索パラメータがある場合のみ復元処理を実行
      const hasSearchParams = Object.keys(router.query).some(key => 
        ['q', 'district', 'services', 'available', 'page', 'view'].includes(key)
      );
      
      if (hasSearchParams) {
        const filters = decodeSearchFilters(router.query);
        const page = parseInt((router.query.page as string) || '1');
        const viewParam = router.query.view as string;
        if (viewParam === 'map') {
          setViewMode('map');
        } else if (viewParam === 'list') {
          setViewMode('list');
        }

        console.log('📄 URLから検索条件を復元:', { filters, page, viewParam });
        
        setInitialFilters(filters);
        setLastSearchFilters(filters);
        setHasSearched(true);
        
        // 自動検索実行（URL更新なし）- ページ情報も含める
        executeSearchWithoutUrlUpdate(filters, page);
      } else if (!hasSearched && !isBookmarkMode && !isRestoringBookmarks) {
        // URLにパラメータがなく、まだ検索していない場合は初期状態を設定
        console.log('📋 初期画面を表示');
        setInitialFilters(undefined);
        setLastSearchFilters(null);
        setHasSearched(false);
        setLoading(false);
        setFacilities([]);
        setPagination(null);
        setError(null);
        setSearchParamsString('');
      }
    }
  }, [router.isReady, isLoggedIn, isRestoringBookmarks]);

  const handleBookmarkToggle = async (facilityId: number) => {
    if (!isLoggedIn) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }

    try {
      const facilityIdStr = facilityId.toString();
      const isCurrentlyBookmarked = isBookmarked(facilityIdStr);
      
      await toggleBookmark(facilityIdStr);
      
      console.log(`${isCurrentlyBookmarked ? '削除' : '追加'}しました: ${facilityId}`);
      
      if (isBookmarkMode) {
        setTimeout(async () => {
          await handleShowBookmarks();
        }, 200);
      }
      
    } catch (error) {
      console.error('❌ ブックマーク操作エラー:', error);
      alert('ブックマーク操作中にエラーが発生しました。');
    }
  };

  const handleShowBookmarks = async () => {
    if (!isLoggedIn || !user?.id) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }
    
    if (isBookmarkMode && loading) {
      return;
    }
    
    setIsBookmarkMode(true);
    setLoading(true);
    setError(null);
    setHasSearched(true);
    console.log('ブックマーク表示開始...');
    
    router.replace('/', undefined, { shallow: true });
    
    try {
      console.log('Supabaseからブックマークを直接取得...');
      console.log('現在のユーザーID:', user.id);
      
      // 直接Supabaseからブックマークデータを取得
      const bookmarkData = await getUserBookmarks(user.id);
      console.log('取得したブックマークデータ:', bookmarkData);

      if (!bookmarkData || bookmarkData.length === 0) {
        console.log('ブックマークが0件');
        setFacilities([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      // ブックマークした事業所のIDを抽出
      const bookmarkedFacilityIds = bookmarkData.map((bookmark) => parseInt(bookmark.facility));
      console.log('ブックマーク事業所ID:', bookmarkedFacilityIds);

      // 事業所詳細を取得
      const facilityParams = new URLSearchParams();
      facilityParams.append('facility_ids', JSON.stringify(bookmarkedFacilityIds));
      
      console.log('事業所取得API呼び出し:', `/api/search/facilities?${facilityParams.toString()}`);
      
      const facilityResponse = await fetch(`/api/search/facilities?${facilityParams.toString()}`);
      
      if (!facilityResponse.ok) {
        const errorText = await facilityResponse.text();
        console.error('事業所取得APIエラー:', errorText);
        throw new Error(`事業所取得エラー: ${facilityResponse.status}`);
      }

      const facilityData: SearchResponse = await facilityResponse.json();
      
      console.log(`事業所取得完了: ${facilityData.facilities?.length || 0} 件`);

      if (facilityData.facilities && facilityData.facilities.length > 0) {
        setFacilities(facilityData.facilities);
        setPagination(facilityData.pagination);
      } else {
        setFacilities([]);
        setPagination(null);
        setError('ブックマークした事業所が見つかりませんでした。');
      }
      
    } catch (err) {
      console.error('ブックマーク表示エラー:', err);
      setError(err instanceof Error ? err.message : 'ブックマークの取得中にエラーが発生しました');
      setFacilities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // 通常検索処理（URL更新対応）
  const executeSearch = async (
    filters: SearchFilters, 
    page: number = 1,
    forceViewMode?: 'list' | 'map'
  ) => {
    await executeSearchWithoutUrlUpdate(filters, page, forceViewMode);
    
    // URLパラメータを更新（検索条件を保持）
    const urlParams = encodeSearchFilters(filters);
    urlParams.page = page.toString();
    urlParams.view = forceViewMode || viewMode;
    
    const queryString = new URLSearchParams(urlParams).toString();
    console.log('🔗 URL更新:', queryString);
    setSearchParamsString(queryString);
    setPreservedSearchParams(queryString); // 検索パラメータを保持
    
    // URLを更新（ブラウザ履歴に追加せずに）
    const newUrl = queryString ? `/?${queryString}` : '/';
    router.replace(newUrl, undefined, { shallow: true });
  };

  // URL更新なしの検索処理
  const executeSearchWithoutUrlUpdate = async (
    filters: SearchFilters, 
    page: number = 1,
    forceViewMode?: 'list' | 'map'
  ) => {
    console.log('🔍 executeSearchWithoutUrlUpdate 開始:', { filters, page, forceViewMode });
    setLoading(true);
    setError(null);
    setIsBookmarkMode(false);

    try {
      const currentViewMode = forceViewMode || viewMode;
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.district) params.append('district', filters.district);
      if (filters.serviceIds?.length > 0) {
        params.append('service_ids', JSON.stringify(filters.serviceIds));
      }
      if (filters.availabilityOnly) params.append('availability_only', 'true');
      
      // 地図表示の場合は全件取得、リスト表示の場合はページング
      if (currentViewMode === 'map') {
        params.append('page', '1');
        params.append('limit', '1000'); // 大きな値で全件取得
      } else {
        params.append('page', page.toString());
        params.append('limit', '12');
      }

      console.log('📡 API呼び出し:', params.toString());

      const response = await fetch(`/api/search/facilities?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      console.log('✅ API応答:', { facilitiesCount: data.facilities?.length, pagination: data.pagination });

      setFacilities(data.facilities || []);
      // 地図表示の場合はページネーション情報をクリア
      setPagination(currentViewMode === 'map' ? null : data.pagination);
      
    } catch (err) {
      console.error('検索エラー:', err);
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました');
      setFacilities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    console.log('🔍 新しい検索を実行:', filters);
    setHasSearched(true);
    setLastSearchFilters(filters);
    await executeSearch(filters, 1);
  };

  const handlePageChange = async (page: number) => {
    if (!lastSearchFilters) return;
    console.log('📄 ページ変更:', page, 'filters:', lastSearchFilters);
    await executeSearch(lastSearchFilters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ビューモード変更時
  const handleViewModeChange = async (mode: 'list' | 'map') => {
    if (isBookmarkMode && mode === 'map') {
      alert('ブックマーク表示では地図モードは利用できません。');
      return;
    }
    
    setViewMode(mode);

    // 既に検索結果がある場合は、新しいビューモードで再検索
    if (lastSearchFilters && hasSearched) {
      await executeSearch(lastSearchFilters, 1, mode);
    }
  };


  // 初回アクセス判定用キー
  const FIRST_VISIT_KEY = 'isFirstVisit';

  // 初回アクセス時のみ実行し、オーバーレイ表示を制御
  useEffect(() => {
    try {
      // localStorageが使える環境か確認（SSR対策）
      if (typeof window !== 'undefined' && !localStorage.getItem(FIRST_VISIT_KEY)) {
        console.log('🎉 初回アクセスです！');
        setIsFirstVisit(true); // オーバーレイ表示のトリガー
        localStorage.setItem(FIRST_VISIT_KEY, '1');
      }
    } catch (error) {
      console.error('初回アクセス判定エラー:', error);
    }
  }, []);

  const firstVisitContinue = () => {
    setIsFirstVisitContinue(true);
  };

  // オーバーレイを閉じるためのハンドラ
  const handleCloseOverlay = () => {
    setIsFirstVisit(false);
    // try {
    //   // オーバーレイを閉じたタイミングでフラグを保存
    //   localStorage.setItem(FIRST_VISIT_KEY, '1');
    // } catch (error) {
    //   console.error('localStorageへの保存エラー:', error);
    // }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>ケアコネクト - 東京都障害福祉サービス事業所検索</title>
        <meta 
          name="description" 
          content="東京都の障害福祉サービス事業所を検索して、適切なケアサービスを見つけましょう。" 
        />
      </Head>

      {/* 初回アクセス時のオーバーレイ表示 */}
      {isFirstVisit && (
        <div
          /*onClick={handleCloseOverlay}*/
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 2000,
            cursor: 'pointer',
          }}
        >
        </div>
      )}

      {/* 初回アクセス時のチュートリアル開始モーダル */}
      {isFirstVisit && !isFirstVisitContinue && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              border: '1px solid #e5e7eb',
              animation: 'fadeInModal 0.3s ease-out forwards'
            }}
          >
            <h2 style={{
              marginTop: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <span>💡</span>
              <div>
                <span style={{display: 'inline-block'}}>ケアコネクトへ</span><span style={{display: 'inline-block'}}>ようこそ！</span>
              </div>
            </h2>
            <p style={{
              color: '#4b5563',
              lineHeight: 1.6,
              fontSize: '1rem',
              marginTop: '1rem',
              marginBottom: '2.5rem'
            }}>
              <span style={{display: 'inline-block'}}>簡単なチュートリアルで、</span><span style={{display: 'inline-block'}}>使い方をご紹介します。</span>
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <button
                onClick={firstVisitContinue}
                className="tutorial-button-primary"
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "0.5rem",
                  backgroundColor: "#22c55e",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
              >
                チュートリアルを開始
              </button>

              <button
                onClick={handleCloseOverlay}
                className="tutorial-button-secondary"
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: '0.875rem',
                  transition: 'color 0.2s',
                  marginTop: '0.5rem'
                }}
              >
                スキップする
              </button>
            </div>
          </div>
          <style jsx global>{`
            .tutorial-button-primary:hover {
              background-color: #16a34a !important;
            }
            .tutorial-button-secondary:hover {
              color: #111827 !important;
            }
            @keyframes fadeInModal {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* ヘッダー */}
      <Header 
        isLoggedIn={isLoggedIn}
        signOut={signOut}
        variant="home"           // ホームページ仕様
        showContactButton={true} // お問い合わせボタン表示
      />

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8" style={{
        minHeight: isBookmarkMode ? 'calc(130vh - 200px)' : 'auto'
      }}>
        {isLoggedIn && isMobile && (

          <section style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '0.5rem' }}>
              <p style={{ 
                margin: 0, 
                fontSize: '1.125rem', 
                fontWeight: '500',
                color: '#374151' 
              }}>
                ようこそ、{user?.user_metadata?.full_name || user?.email}さん
              </p>
            </div>
          </section>
        )}
         {!(isMobile && isLoggedIn) && (

          <section style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '0.5rem' }}>
            </div>
          </section>
        )}
        
        {/* 検索セクション - タブ形式UI */}
        <div className="search-section">
          {/* タブヘッダー */}
          <div style={{ 
            borderBottom: '2px solid #f3f4f6',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              display: 'flex',
              gap: 0
            }}>
              {/* 事業所を検索タブ */}
              <button
                onClick={() => {
                  if (isBookmarkMode) {
                    setIsBookmarkMode(false);
                    setHasSearched(false);
                    setFacilities([]);
                    setPagination(null);
                    setError(null);
                    // URLをクリア
                    router.replace('/', undefined, { shallow: true });
                  }
                }}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem 0.5rem' : '1rem 2rem',
                  border: 'none',
                  background: !isBookmarkMode ? 'white' : '#f9fafb',
                  borderBottom: !isBookmarkMode ? '2px solid #22c55e' : '2px solid transparent',
                  borderTop: !isBookmarkMode ? '1px solid #e5e7eb' : 'none',
                  borderLeft: !isBookmarkMode ? '1px solid #e5e7eb' : 'none',
                  borderRight: !isBookmarkMode ? '1px solid #e5e7eb' : 'none',
                  borderRadius: !isBookmarkMode ? '0.5rem 0.5rem 0 0' : '0',
                  fontSize: isMobile ? '0.9rem' : '1.125rem',
                  fontWeight: !isBookmarkMode ? '600' : '400',
                  color: !isBookmarkMode ? '#22c55e' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  zIndex: !isBookmarkMode ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? '0.2rem' : '0.25rem'
                }}
              >
                <span style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>🔍</span>
                <span>事業所を検索</span>
              </button>

              {/* ブックマークタブ */}
              {isLoggedIn ? (
                <button
                  onClick={handleShowBookmarks}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.75rem 0.5rem' : '1rem 2rem',
                    border: 'none',
                    background: isBookmarkMode ? 'white' : '#f9fafb',
                    borderBottom: isBookmarkMode ? '2px solid #22c55e' : '2px solid transparent',
                    borderTop: isBookmarkMode ? '1px solid #e5e7eb' : 'none',
                    borderLeft: isBookmarkMode ? '1px solid #e5e7eb' : 'none',
                    borderRight: isBookmarkMode ? '1px solid #e5e7eb' : 'none',
                    borderRadius: isBookmarkMode ? '0.5rem 0.5rem 0 0' : '0',
                    fontSize: isMobile ? '0.9rem' : '1.125rem',
                    fontWeight: isBookmarkMode ? '600' : '400',
                    color: isBookmarkMode ? '#22c55e' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    zIndex: isBookmarkMode ? 2 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '0.2rem' : '0.25rem'
                  }}
                >
                  <span style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
                    {isBookmarkMode ? '★' : '☆'}
                  </span>
                  <span>ブックマーク</span>
                </button>
              ) : (
                // ログインしていない場合のブックマークタブ（視覚的フィードバック強化型）
                <div
                  onClick={() => router.push('/auth/userlogin')}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.75rem 0.5rem' : '1rem 2rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '2px solid #e2e8f0',
                    borderRadius: '0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '0.2rem' : '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                  }}
                >
                  <span style={{ 
                    fontSize: isMobile ? '1.1rem' : '1.3rem', 
                    opacity: 0.7,
                    color: '#64748b'
                  }}>
                    🔒
                  </span>
                  <span style={{ 
                    fontSize: isMobile ? '0.85rem' : '1.125rem',
                    fontWeight: '500',
                    color: '#475569'
                  }}>
                    ブックマーク
                  </span>
                  <span style={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: '#94a3b8',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    {isMobile ? 'ログインで利用' : 'ログインが必要です'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* タブコンテンツ */}
          <div
            style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0 0 0.5rem 0.5rem",
                border: "1px solid #e5e7eb",
                borderTop: "none",
                position: "relative",
                zIndex: (isFirstVisit && isFirstVisitContinue && !isBookmarkMode && !hasSearched) ? 3000 : "auto",
                borderTopLeftRadius: (isFirstVisit && isFirstVisitContinue && !isBookmarkMode && !hasSearched) ? '0.5rem' : '0',
                borderTopRightRadius: (isFirstVisit && isFirstVisitContinue && !isBookmarkMode && !hasSearched) ? '0.5rem' : '0'
            }}
            >
            {isBookmarkMode && (
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: '#fef3c7', 
                border: '1px solid #fbbf24', 
                borderRadius: '0.5rem' 
              }}>
                <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                  📌 ブックマークした事業所を表示しています
                </p>
              </div>
            )}

            {!isBookmarkMode && (
              <SearchFilterComponent 
                onSearch={handleSearch} 
                loading={loading}
                initialFilters={initialFilters}
              />
            )}


            {/* 検索入力のチュートリアル吹き出し */}
            {isFirstVisit && isFirstVisitContinue && !isBookmarkMode && !hasSearched && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginBottom: "0.75rem", // 吹き出しと検索ボックスの間隔を調整
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        padding: "1rem 1.5rem",
                        whiteSpace: "nowrap",
                        zIndex: 4000,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // 影を追加して目立たせる
              animation: 'fadeInModal 0.3s ease-out forwards'
                    }}
                >
                    {/* コンテンツのラッパー */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        
                        {/* メインの案内テキスト */}
                        <p style={{ margin: 0, fontSize: '1rem', color: '#374151', fontWeight: 'bold' }}>
                        「代々木」と入力して検索してみましょう
                        </p>

                        {/* スキップボタン */}
                        <button
                        onClick={handleCloseOverlay}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            textDecoration: 'underline',
                            padding: '0.25rem'
                        }}
                        >
                        チュートリアルをスキップ
                        </button>
                    </div>

                    {/* 吹き出しの矢印（下向き） */}
                    {/* 枠線用の矢印 */}
                    <div
                        style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: '1px',
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: "8px solid #e5e7eb",
                        }}
                    />
                    {/* 本体用の矢印 */}
                    <div
                        style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: "8px solid #ffffff"
                        }}
                    />
                </div>
            )}


          </div>
        </div>

        {/* 検索結果 */}
        {hasSearched && (
          <SearchResults 
            facilities={facilities} 
            pagination={pagination}
            loading={loading} 
            error={error}
            onPageChange={handlePageChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isBookmarkMode={isBookmarkMode}
            isLoggedIn={isLoggedIn}
            onBookmarkToggle={handleBookmarkToggle}
            isBookmarked={(facilityId: number) => isBookmarked(facilityId.toString())}
            isFirstVisit={isFirstVisit}
            handleCloseOverlay={handleCloseOverlay}
            isFirstVisitContinue={isFirstVisitContinue}
          />
        )}

        {/* 初期画面のウェルカムメッセージ */}
        {!hasSearched && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#374151' }}>
              東京都の障害福祉サービス事業所を検索
            </h3>
            <p style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              上記の検索条件を設定して「検索」ボタンをクリックしてください。<br />
              お住まいの地域や必要なサービスから、最適な事業所を見つけることができます。
            </p>
            {isLoggedIn && (
              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '0.5rem',
                display: 'inline-block'
              }}>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.875rem' }}>
                  💡 気になる事業所をブックマークして、後で確認することができます
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* フッター */}
      <Footer />
    </div>
  );
};

export default HomePage;