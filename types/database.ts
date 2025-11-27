// types/database.ts - データベース型定義

// 基本的な列挙型
export type UserType = 'facility' | 'user'

export type TokyoDistrict = 
  // 23区
  '千代田区' | '中央区' | '港区' | '新宿区' | '文京区' | '台東区' | '墨田区' | 
  '江東区' | '品川区' | '目黒区' | '大田区' | '世田谷区' | '渋谷区' | '中野区' | 
  '杉並区' | '豊島区' | '北区' | '荒川区' | '板橋区' | '練馬区' | '足立区' | 
  '葛飾区' | '江戸川区' |
  // 市部
  '八王子市' | '立川市' | '武蔵野市' | '三鷹市' | '青梅市' | '府中市' | '昭島市' | 
  '調布市' | '町田市' | '小金井市' | '小平市' | '日野市' | '東村山市' | '国分寺市' | 
  '国立市' | '福生市' | '狛江市' | '東大和市' | '清瀬市' | '東久留米市' | '武蔵村山市' | 
  '多摩市' | '稲城市' | '羽村市' | 'あきる野市' | '西東京市' |
  // 西多摩郡
  '瑞穂町' | '日の出町' | '檜原村' | '奥多摩町' |
  // 島しょ部
  '大島町' | '利島村' | '新島村' | '神津島村' | '三宅村' | '御蔵島村' | 
  '八丈町' | '青ヶ島村' | '小笠原村'

export type DisabilityType = '身体障害' | '知的障害' | '精神障害' | '発達障害' | '難病等' | 'その他'

export type ServiceCategory = 
  '訪問系サービス' | 
  '日中活動系サービス' | 
  '施設系サービス' | 
  '居住系サービス' | 
  '訓練系・就労系サービス' | 
  '障害児通所系サービス' | 
  '障害児入所系サービス' | 
  '相談系サービス'

export type AvailabilityStatus = 'available' | 'unavailable'

export const T_DISTRICTS: TokyoDistrict[] = [
  '千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区',
  '品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区','豊島区',
  '北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区',
  '八王子市','立川市','武蔵野市','三鷹市','青梅市','府中市','昭島市',
  '調布市','町田市','小金井市','小平市','日野市','東村山市','国分寺市',
  '国立市','福生市','狛江市','東大和市','清瀬市','東久留米市','武蔵村山市',
  '多摩市','稲城市','羽村市','あきる野市','西東京市',
  '瑞穂町','日の出町','檜原村','奥多摩町',
  '大島町','利島村','新島村','神津島村','三宅村','御蔵島村',
  '八丈町','青ヶ島村','小笠原村'
]

// プロフィール関連の型
export interface Profile {
  id: string
  user_type: UserType
  email: string
  full_name?: string
  phone_number?: string
  district?: TokyoDistrict
  created_at: string
  updated_at: string
}

// 利用者プロフィール
export interface UserProfile {
  id: number
  profile_id: string
  age?: number
  gender?: string
  disability_types?: DisabilityType[]
  disability_grade?: string
  guardian_name?: string
  guardian_phone?: string
  emergency_contact?: string
  medical_info?: string
  transportation_needs?: string
  other_requirements?: string
  receive_notifications: boolean
  created_at: string
  updated_at: string
}

// 事業所
export interface Facility {
  id: number
  profile_id?: string
  name: string
  description?: string
  appeal_points?: string
  address: string
  district: TokyoDistrict
  latitude?: number
  longitude?: number
  phone_number?: string
  website_url?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  services?: Service[]
}

// サービス定義
export interface ServiceDefinition {
  id: number
  category: ServiceCategory
  name: string
  description?: string
  created_at: string
}

// 事業所サービス
export interface FacilityService {
  id: number
  facility_id: number
  service_id: number
  availability: AvailabilityStatus
  capacity?: number
  current_users: number
  updated_at: string
  service?: ServiceDefinition
}

// index.tsxで使用されているService型（FacilityServiceのエイリアス）
export type Service = FacilityService

// 利用者希望サービス
export interface UserDesiredService {
  id: number
  user_id: number
  service_id: number
  priority: number
  created_at: string
}

// ブックマーク
export interface Bookmark {
  id: number
  user_id: number
  facility_id: number
  created_at: string
}

// メッセージ
export interface Message {
  id: number
  conversation_id: string
  sender_id: string
  recipient_id: string
  receiver_id?: string  // useMessagesとの互換性のため
  facility_id?: number
  user_id?: number
  content: string
  is_read: boolean
  created_at: string
  updated_at?: string
}

// 通知設定
export interface NotificationSetting {
  id: number
  user_id: number
  district?: TokyoDistrict
  service_id?: number
  email: string
  is_active: boolean
  created_at: string
}

// 活動ログ
export interface ActivityLog {
  id: number
  user_id: string
  action: string
  resource_type?: string
  resource_id?: number
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// 検索レスポンス（index.tsxで使用）
export interface SearchResponse {
  facilities: Facility[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 認証関連の型
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    user_type?: UserType
    full_name?: string
    [key: string]: any
  }
}

// フォームデータの型
export interface UserRegistrationData {
  user_type: 'user'
  full_name: string
  phone_number?: string | null   // ← null を許可
  district?: TokyoDistrict | null
  user_details: {
    age?: number | null
    gender?: string | null
    disability_types?: DisabilityType[]
    disability_grade?: string | null
    guardian_name?: string | null
    guardian_phone?: string | null
    emergency_contact?: string | null
    medical_info?: string | null
    transportation_needs?: string | null
    other_requirements?: string | null
    receive_notifications: boolean
  }
}

export interface FacilityRegistrationData {
  user_type: 'facility'
  full_name: string
  phone_number?: string | null   // ← null を許可
  district?: TokyoDistrict | null
  facility_details: {
    name: string
    description?: string | null
    appeal_points?: string | null
    address: string
    district: TokyoDistrict
    phone_number?: string | null
    website_url?: string | null
  }
}

export type RegistrationData = UserRegistrationData | FacilityRegistrationData

// API エラーレスポンス
export interface ApiError {
  error: string
  message?: string
  details?: any
}

// 検索フィルター
export interface SearchFilters {
  query?: string
  district?: string
  serviceIds?: number[]
  availabilityOnly?: boolean
  page?: number
  limit?: number
}