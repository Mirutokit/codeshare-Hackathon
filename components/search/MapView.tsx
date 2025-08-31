// components/search/MapView.tsx - 修正版（検索パラメータ対応・スマホ縦長対応）
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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
         
         /* スマホ版の高さ調整 */
         @media (max-width: 768px) {
           .map-loading {
             height: 70vh !important;
           }
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

// メインMapViewコンポーネント（検索パラメータ対応・スマホ縦長対応）
const MapView: React.FC<{ 
 facilities: Facility[];
 loading?: boolean;
}> = ({ facilities, loading = false }) => {
 const router = useRouter();
 const [isClient, setIsClient] = useState(false);

 useEffect(() => {
   setIsClient(true);
 }, []);

 // 現在のクエリパラメータを取得（詳細ページ遷移用）
 const searchParams = useMemo(() => {
   const { id, ...params } = router.query; // idを除外
   
   // string型に変換してオブジェクトを作成
   const convertedParams: Record<string, string> = {};
   
   Object.entries(params).forEach(([key, value]) => {
     if (value) {
       if (Array.isArray(value)) {
         convertedParams[key] = value[0];
       } else {
         convertedParams[key] = value;
       }
     }
   });
   
   return convertedParams;
 }, [router.query]);

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
   isClient,
   searchParams
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
       {/* スマホ版の高さ調整CSS */}
       <style jsx>{`
         @media (max-width: 768px) {
           .map-loading {
             height: 70vh !important;
           }
         }
       `}</style>
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
       
       {/* 動的に読み込まれる地図コンポーネント（検索パラメータを渡す） */}
       <DynamicMap 
         facilities={validFacilities} 
         loading={loading} 
         searchParams={searchParams}
       />
       
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
           <span>{validFacilities.length}件の事業所を地図上に表示</span>
         </div>
       )}
       
       {/* レスポンシブ地図サイズ調整のCSS */}
       <style jsx global>{`
         /* DynamicMapコンポーネント内の地図の高さを調整 */
         .map-container .leaflet-container {
           height: 600px !important;
         }
         
         /* タブレット以下のサイズ */
         @media (max-width: 768px) {
           .map-container .leaflet-container {
             height: 70vh !important;
             min-height: 500px !important;
           }
           
           .map-no-results {
             padding: 2rem !important;
             min-height: 70vh;
             display: flex !important;
             flex-direction: column !important;
             justify-content: center !important;
           }
         }
         
         /* 小さいスマホサイズ */
         @media (max-width: 480px) {
           .map-container .leaflet-container {
             height: 65vh !important;
             min-height: 450px !important;
           }
           
           .map-no-results {
             padding: 1.5rem !important;
             min-height: 65vh;
           }
         }
       `}</style>
     </div>
   </div>
 );
};

export default MapView;