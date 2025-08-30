// components/search/MapViewInner.tsx - スマホ対応地図コンポーネント
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { useRouter } from 'next/router';
import 'leaflet/dist/leaflet.css';


// Leafletのデフォルトマーカーアイコンの問題を修正
import L from 'leaflet';

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

// MapViewInnerのprops型定義を追加
interface MapViewInnerProps {
  facilities: Facility[];
  loading?: boolean;
  // 現在の検索パラメータを渡すためのprops
  searchParams?: {
    q?: string;
    district?: string;
    services?: string;
    available?: string;
    page?: string;
    view?: string;
  };
}

// アイコン設定の修正
const createFacilityIcon = () => {
  // デフォルトアイコンの問題を修正
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  // カスタムアイコン
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="25" height="35" viewBox="0 0 25 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 35 12.5 35C12.5 35 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#22c55e"/>
        <circle cx="12.5" cy="12.5" r="7" fill="white"/>
        <circle cx="12.5" cy="12.5" r="4" fill="#22c55e"/>
      </svg>
    `),
    shadowUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="25" height="15" viewBox="0 0 25 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12.5" cy="7.5" rx="12" ry="7" fill="rgba(0,0,0,0.2)"/>
      </svg>
    `),
    iconSize: [25, 35],
    iconAnchor: [12, 35],
    popupAnchor: [1, -34],
    shadowSize: [25, 15],
    shadowAnchor: [12, 15]
  });
};

// スマホかどうかを判定
const isMobile = () => {
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 地図の境界を自動調整するコンポーネント（スマホ対応）
const MapBounds: React.FC<{ facilities: Facility[] }> = ({ facilities }) => {
  const map = useMap();

  useEffect(() => {
    if (facilities.length > 0) {
      try {
        const bounds = new LatLngBounds(
          facilities.map(f => [f.latitude!, f.longitude!])
        );

        const mobile = isMobile();
        // 左右にも余白を取る
        const padding: [number, number] = mobile ? [40, 40] : [20, 20];

        if (facilities.length === 1) {
          map.setView([facilities[0].latitude!, facilities[0].longitude!], mobile ? 14 : 15);
        } else {
          map.fitBounds(bounds, { 
            padding: padding,
            maxZoom: mobile ? 15 : 16
          });
        }

        if (mobile) {
          // サイズ崩れ防止のため invalidateSize を少し遅延
          setTimeout(() => {
            map.invalidateSize();
          }, 300);
        }
      } catch (error) {
        console.error('地図の境界設定でエラー:', error);
        map.setView([35.6762, 139.6503], isMobile() ? 10 : 11);
      }
    } else {
      map.setView([35.6762, 139.6503], isMobile() ? 10 : 11);
    }
  }, [facilities, map]);

  return null;
};


// 事業所ポップアップの内容（スマホ対応・詳細ページ遷移機能付き）
const FacilityPopup: React.FC<{ 
  facility: Facility; 
  searchParams?: Record<string, string>; 
}> = ({ facility, searchParams = {} }) => {
  const router = useRouter();
  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];
  const mobile = isMobile();

  // 詳細ページへの遷移処理
  const handleViewDetails = () => {
    // 現在の検索パラメータをクエリストリングとして追加
    const query = { 
      id: facility.id.toString(),
      ...searchParams // 検索条件を引き継ぐ
    };

    router.push({
      pathname: '/facilities/[id]',
      query: query
    });
  };

  return (
    <div style={{ 
      maxWidth: mobile ? '250px' : '280px', 
      fontSize: mobile ? '0.8rem' : '0.875rem',
      padding: mobile ? '0.25rem' : '0'
    }}>
      <h3 style={{ 
        fontSize: mobile ? '0.9rem' : '1rem', 
        fontWeight: 'bold', 
        color: '#111827',
        marginBottom: '0.5rem',
        lineHeight: 1.3
      }}>
        {facility.name}
      </h3>
      
      <p style={{ 
        color: '#6b7280', 
        fontSize: mobile ? '0.7rem' : '0.75rem',
        marginBottom: '0.75rem'
      }}>
        {facility.district}
      </p>
      
      {facility.description && (
        <p style={{ 
          color: '#374151',
          fontSize: mobile ? '0.7rem' : '0.75rem',
          lineHeight: 1.4,
          marginBottom: '0.75rem'
        }}>
          {facility.description.length > (mobile ? 60 : 80)
            ? facility.description.slice(0, mobile ? 60 : 80) + '...' 
            : facility.description}
        </p>
      )}

      {facility.appeal_points && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ 
            fontSize: mobile ? '0.7rem' : '0.75rem', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            ✨ アピールポイント
          </div>
          <p style={{ 
            fontSize: mobile ? '0.7rem' : '0.75rem', 
            color: '#22c55e', 
            fontWeight: '500',
            lineHeight: 1.3
          }}>
            {facility.appeal_points.length > (mobile ? 40 : 60)
              ? facility.appeal_points.slice(0, mobile ? 40 : 60) + '...' 
              : facility.appeal_points}
          </p>
        </div>
      )}

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ 
          fontSize: mobile ? '0.7rem' : '0.75rem', 
          fontWeight: '500', 
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          提供サービス
        </div>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: mobile ? '0.125rem' : '0.25rem'
        }}>
          {availableServices.slice(0, mobile ? 2 : 3).map((service, index) => (
            <span
              key={index}
              style={{
                padding: mobile ? '0.1rem 0.25rem' : '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontSize: mobile ? '0.55rem' : '0.625rem',
                fontWeight: '500',
                background: '#dcfce7',
                color: '#166534'
              }}
            >
              ○ {service.service?.name || 'サービス'}
            </span>
          ))}
          {unavailableServices.slice(0, mobile ? 1 : 2).map((service, index) => (
            <span
              key={`unavailable-${index}`}
              style={{
                padding: mobile ? '0.1rem 0.25rem' : '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontSize: mobile ? '0.55rem' : '0.625rem',
                fontWeight: '500',
                background: '#f3f4f6',
                color: '#6b7280'
              }}
            >
              × {service.service?.name || 'サービス'}
            </span>
          ))}
          {(availableServices.length + unavailableServices.length) > (mobile ? 3 : 5) && (
            <span style={{
              padding: mobile ? '0.1rem 0.25rem' : '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: mobile ? '0.55rem' : '0.625rem',
              background: '#e5e7eb',
              color: '#6b7280'
            }}>
              他{(availableServices.length + unavailableServices.length) - (mobile ? 3 : 5)}件
            </span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        {facility.phone_number && (
          <p style={{ 
            fontSize: mobile ? '0.7rem' : '0.75rem', 
            color: '#6b7280', 
            marginBottom: '0.125rem',
            wordBreak: 'break-all'
          }}>
            📞 {facility.phone_number}
          </p>
        )}
        {facility.website_url && (
          <p style={{ 
            fontSize: mobile ? '0.7rem' : '0.75rem', 
            marginBottom: '0.125rem' 
          }}>
            🌐 <a 
              href={facility.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#2563eb', textDecoration: 'none' }}
              onMouseOver={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
              onMouseOut={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
            >
              ウェブサイト
            </a>
          </p>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleViewDetails}
          style={{
            background: '#22c55e',
            color: 'white',
            padding: mobile ? '0.3rem 0.8rem' : '0.375rem 1rem',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: mobile ? '0.7rem' : '0.75rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            width: mobile ? '100%' : 'auto'
          }}
          onMouseOver={(e) => (e.target as HTMLElement).style.background = '#16a34a'}
          onMouseOut={(e) => (e.target as HTMLElement).style.background = '#22c55e'}
        >
          詳細を見る
        </button>
      </div>
    </div>
  );
};

// 実際の地図コンポーネント（スマホ対応・検索パラメータ対応）
const MapViewInner: React.FC<MapViewInnerProps> = ({ 
  facilities, 
  loading = false,
  searchParams = {}
}) => {
  const [facilityIcon, setFacilityIcon] = useState<L.Icon | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setMobile(isMobile());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // アイコンの初期化
  useEffect(() => {
    try {
      const icon = createFacilityIcon();
      setFacilityIcon(icon);
    } catch (error) {
      console.error('アイコン作成エラー:', error);
      setMapError('地図アイコンの読み込みに失敗しました');
    }
  }, []);

  // 東京都の中心座標（デフォルト表示位置）
  const tokyoCenter: [number, number] = [35.6762, 139.6503];

  console.log('MapViewInner レンダリング:', { 
    facilities: facilities.length,
    loading,
    facilityIcon: !!facilityIcon,
    mobile,
    searchParams
  });

  // エラー状態の表示
  if (mapError) {
    return (
      <div style={{
        height: mobile ? '400px' : '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: '0.75rem',
        border: '1px solid #fecaca',
        color: '#dc2626',
        margin: '0', // スマホでは左右の余白を削除
        padding: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ textAlign: 'center' }}>{mapError}</p>
        <button 
          onClick={() => {
            setMapError(null);
            window.location.reload();
          }}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          再読み込み
        </button>
      </div>
    );
  }

  // アイコンがまだ読み込まれていない場合
  if (!facilityIcon) {
    return (
      <div style={{
        height: mobile ? '400px' : '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        color: '#6b7280',
        margin: '0',
        padding: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>地図を準備中...</p>
      </div>
    );
  }

  try {
    return (
      <div style={{
        margin: '0.25rem',
        borderRadius: mobile ? '0' : '0.75rem',
        overflow: 'hidden',
        border: mobile ? 'none' : '1px solid #e5e7eb'
      }}>
        <MapContainer
          center={tokyoCenter}
          zoom={mobile ? 10 : 11}
          style={{ 
            height: mobile ? '400px' : '600px',
            width: '100%'
          }}
          scrollWheelZoom={true}
          zoomControl={true}
          touchZoom={true} // タッチズーム有効
          doubleClickZoom={true} // ダブルタップズーム有効
          dragging={true} // ドラッグ有効
          boxZoom={false} // ボックスズーム無効（スマホでは不要）
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            tileSize={256}
            zoomOffset={0}
          />
          
          {/* 地図の境界を自動調整 */}
          <MapBounds facilities={facilities} />
          
          {/* 施設マーカー */}
          {facilities.map((facility) => (
            <Marker
              key={facility.id}
              position={[facility.latitude!, facility.longitude!]}
              icon={facilityIcon}
            >
              <Popup 
                maxWidth={mobile ? 250 : 300} 
                closeButton={true}
                autoPan={true}
                keepInView={true}
                autoPanPadding={[10, 10]}
              >
                <FacilityPopup 
                  facility={facility} 
                  searchParams={searchParams}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('地図レンダリングエラー:', error);
    return (
      <div style={{
        height: mobile ? '400px' : '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: mobile ? '0' : '0.75rem',
        border: mobile ? 'none' : '1px solid #fecaca',
        color: '#dc2626',
        margin : '0',
        padding: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ textAlign: 'center' }}>地図の読み込みに失敗しました</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          再読み込み
        </button>
      </div>
    );
  }
};

export default MapViewInner;