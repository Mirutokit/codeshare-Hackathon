// pages/api/facilities/[id].ts - Service Role Key使用版
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Service Role Key を使用（登録APIと同じ方式）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 管理者権限のSupabaseクライアント
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // IDの検証
  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return res.status(400).json({ error: '無効な事業所IDです' });
  }

  // Supabase設定確認
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase環境変数が設定されていません');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const facilityId = parseInt(id);
    
    console.log(`=== 事業所詳細API Service Role版開始 (ID: ${facilityId}) ===`);

    // 事業所の基本情報とサービス情報を一括取得
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select(`
        *,
        facility_services(
          id,
          service_id,
          availability,
          capacity,
          current_users,
          services(
            name,
            category,
            description
          )
        )
      `)
      .eq('id', facilityId)
      .single();

    console.log('取得結果:', {
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        servicesCount: facility.facility_services?.length || 0
      } : null,
      error: facilityError
    });

    if (facilityError) {
      console.error('事業所取得エラー:', facilityError);
      
      if (facilityError.code === 'PGRST116') {
        return res.status(404).json({ error: '事業所が見つかりません' });
      }
      
      return res.status(500).json({ 
        error: '事業所情報の取得に失敗しました',
        debug: process.env.NODE_ENV === 'development' ? facilityError : undefined
      });
    }

    if (!facility) {
      return res.status(404).json({ error: '事業所が見つかりません' });
    }

    // 非アクティブな事業所は表示しない
    if (!facility.is_active) {
      return res.status(404).json({ error: '事業所が見つかりません' });
    }

    // サービス情報の整形（登録APIの構造に合わせる）
    const services = (facility.facility_services || []).map(fs => ({
      id: fs.id,
      service_id: fs.service_id,
      availability: fs.availability,
      capacity: fs.capacity,
      current_users: fs.current_users || 0,
      service: fs.services // ネストしたservicesオブジェクト
    }));

    console.log('整形後のサービス情報:', {
      servicesCount: services.length,
      availableCount: services.filter(s => s.availability === 'available').length,
      unavailableCount: services.filter(s => s.availability === 'unavailable').length,
      sampleService: services[0] || null
    });

    // レスポンスデータを整形
    const responseData = {
      ...facility,
      services: services, // facility_services から services に名前を変更
      // 詳細ページ用の追加情報
      operating_hours: facility.operating_hours || null,
      established_date: facility.established_date || null,
      organization_type: facility.organization_type || null,
      staff_count: facility.staff_count || null,
      accessibility_features: facility.accessibility_features || [],
      transportation_info: facility.transportation_info || null,
      fees_info: facility.fees_info || null,
      contact_person: facility.contact_person || null,
      email: facility.email || null,
    };

    // facility_services プロパティを削除（混乱を避けるため）
    delete responseData.facility_services;

    console.log('最終レスポンス:', {
      id: responseData.id,
      name: responseData.name,
      servicesCount: responseData.services.length
    });

    console.log(`=== 事業所詳細API Service Role版完了 ===\n`);

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('予期しないエラー:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      debug: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
}

// APIルート設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};