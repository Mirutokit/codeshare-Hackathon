// components/search/MapView.tsx - 修正版（中央配置対応）
import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

// Leaflet関連のインポートを動的インポートの中で行う
const DynamicMap = dynamic(
 () => import('./MapViewInner'), 
 {
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
 }
);

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

// メインMapViewコンポーネント
const MapView: React.FC<{ 
 facilities: Facility[];
 loading?: boolean;
}> = ({ facilities, loading = false }) => {
 const [isClient, setIsClient] = useState(false);

 useEffect(() => {
   setIsClient(true);
 }, []);

 // 座標を持つ施設のみをフィルタリング
 const validFacilities = useMemo(() => 
   facilities.filter(f => f.latitude && f.longitude && 
                       !isNaN(f.latitude) && !isNaN(f.longitude)),
   [facilities]
 );

 console.log('MapView レンダリング:', { 
   facilities: facilities.length, 
   validFacilities: validFacilities.length, 
   loading,
   isClient
 });

 // クライアントサイドでない場合はローディングを表示
 if (!isClient) {
   return (
     <div style={{ 
       display: 'flex', 
       justifyContent: 'center',
       width: '100%' 
     }}>
       <div className="map-loading" style={{
         height: '600px',
         display: 'flex',
         flexDirection: 'column',
         alignItems: 'center',
         justifyContent: 'center',
         backgroundColor: '#f9fafb',
         borderRadius: '0.75rem',
         border: '1px solid #e5e7eb',
         color: '#6b7280',
         width: '100%',
         maxWidth: '1200px'
       }}>
         <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
         <p>地図を準備中...</p>
       </div>
     </div>
   );
 }

 return (
   <div style={{ 
     display: 'flex', 
     justifyContent: 'center',
     width: '100%' 
   }}>
     <div className="map-container" style={{ 
       width: '100%', 
       marginTop: '1rem',
       maxWidth: '1200px'
     }}>
       {/* 検索結果がない場合の表示 */}
       {validFacilities.length === 0 && !loading && (
         <div className="map-no-results" style={{
           textAlign: 'center',
           padding: '3rem',
           backgroundColor: '#f9fafb',
           borderRadius: '0.75rem',
           border: '1px solid #e5e7eb',
           marginBottom: '1rem'
         }}>
           <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
           <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
             地図に表示できる事業所がありません
           </h3>
           <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
             位置情報が登録されている事業所を検索してください
           </p>
         </div>
       )}
       
       {/* 動的に読み込まれる地図コンポーネント */}
       <DynamicMap facilities={validFacilities} loading={loading} />
       
       {/* 統計情報 */}
       {validFacilities.length > 0 && !loading && (
         <div className="map-stats" style={{
           textAlign: 'center',
           marginTop: '1rem',
           padding: '0.75rem',
           backgroundColor: '#f0fdf4',
           borderRadius: '0.5rem',
           color: '#166534',
           fontSize: '0.875rem',
           fontWeight: '500'
         }}>
           <span>📍 {validFacilities.length}件の事業所を地図上に表示</span>
         </div>
       )}
     </div>
   </div>
 );
};

export default MapView;