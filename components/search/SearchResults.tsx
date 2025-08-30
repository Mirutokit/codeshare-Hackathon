import React from 'react';
import Link from 'next/link';
import FacilityCard from './FacilityCard';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { useAuth } from '@/lib/hooks/useAuth';

interface FacilityWithServices {
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
  facility_services?: Array<{
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
  }>;
  services?: Array<{
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
  }>;
}

interface SearchResultsProps {
  facilities: FacilityWithServices[];
  loading: boolean;
  error: string | null;
  viewMode?: 'list' | 'map';
  isBookmarkMode?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  facilities,
  loading,
  error,
  viewMode = 'list',
  isBookmarkMode = false,
}) => {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, loading: bookmarkLoading } = useBookmarks();
  
  const isLoggedIn = !!user;

  // FacilityCardに渡すためのデータ変換
  const convertFacilityData = (facility: FacilityWithServices) => {
    return {
      ...facility,
      services: facility.facility_services || facility.services || []
    };
  };

  // ブックマークボタンのクリック処理
  const handleBookmarkToggle = async (facilityId: number) => {
    if (!isLoggedIn) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }

    try {
      await toggleBookmark(facilityId.toString());
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
      alert('ブックマーク操作に失敗しました。');
    }
  };

  // メッセージボタンのクリック処理（将来の実装用）
  const handleMessageClick = (facilityId: number) => {
    if (!isLoggedIn) {
      alert('メッセージ機能を使用するにはログインが必要です。');
      return;
    }
    
    console.log(`メッセージを送信: 事業所ID ${facilityId}`);
  };

  if (loading) {
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
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {isBookmarkMode 
            ? 'ブックマークの取得に失敗しました。'
            : '検索条件を変更してもう一度お試しください。'
          }
        </p>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="no-results">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3>
          {isBookmarkMode 
            ? 'ブックマークした事業所がありません'
            : '検索結果がありません'
          }
        </h3>
        <p className="no-results-sub">
          {isBookmarkMode 
            ? '気になる事業所をブックマークしてみてください。'
            : '検索条件を変更してもう一度お試しください。'
          }
        </p>
      </div>
    );
  }

  // リスト表示モード
  if (viewMode === 'list') {
    return (
      <div className="search-results">
        <div className="results-header">
          <h3 className="results-title">
            {isBookmarkMode 
              ? `ブックマークした事業所 (${facilities.length}件)`
              : `検索結果 (${facilities.length}件)`
            }
          </h3>
          {isBookmarkMode && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              ブックマークした事業所を表示しています
            </p>
          )}
        </div>

        <div className="facilities-grid">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={convertFacilityData(facility)}
              onBookmark={handleBookmarkToggle}
              onMessage={handleMessageClick}
              isBookmarked={isBookmarked(facility.id.toString())}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>

        {/* ブックマーク機能の説明（未ログイン時） */}
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
              <div style={{ color: '#2563eb', marginRight: '0.75rem' }}>💡</div>
              <div>
                <p style={{ color: '#1e40af', fontWeight: '500', margin: 0 }}>ブックマーク機能について</p>
                <p style={{ color: '#1e40af', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
                  <Link href="/login" style={{ textDecoration: 'underline', color: '#1d4ed8' }}>
                    ログイン
                  </Link>
                  すると、気になる事業所をブックマークして後で確認できます。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default SearchResults;