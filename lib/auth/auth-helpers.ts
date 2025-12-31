// lib/auth/auth-helpers.ts - 認証ヘルパー関数
import { supabase } from '../supabase/client';

// 認証状態をチェックする関数
export const checkAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('認証状態チェックエラー:', error);
      throw error;
    }
    return { 
      session, 
      user: session?.user || null,
      isAuthenticated: !!session 
    };
  } catch (error) {
    console.error('認証状態チェック失敗:', error);
    return { 
      session: null, 
      user: null, 
      isAuthenticated: false 
    };
  }
};

// ユーザープロフィールを取得する関数
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('プロフィール取得失敗:', error);
    return null;
  }
};

// サインアウト関数
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('サインアウトエラー:', error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error('サインアウト失敗:', error);
    return false;
  }
};

// エラーメッセージの日本語化
export const getLocalizedErrorMessage = (error: any): string => {
  if (!error || !error.message) {
    return '不明なエラーが発生しました';
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません';
  }
  
  if (message.includes('email not confirmed')) {
    return 'メールアドレスが認証されていません。送信されたメールから認証を完了してください。';
  }
  
  if (message.includes('user already registered')) {
    return 'このメールアドレスは既に登録されています';
  }
  
  if (message.includes('password should be at least 6 characters')) {
    return 'パスワードは6文字以上で入力してください';
  }
  
  if (message.includes('invalid email')) {
    return '有効なメールアドレスを入力してください';
  }
  
  if (message.includes('too many requests')) {
    return 'リクエストが多すぎます。しばらく時間をおいて再度お試しください。';
  }

  return error.message || 'エラーが発生しました';
};