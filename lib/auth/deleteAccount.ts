// lib/auth/deleteAccount.ts - フロントエンド用関数
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { DeleteAccountResponse, DeleteAccountError } from '@/types/auth';

export class AccountDeletionError extends Error {
  constructor(message: string, public details?: string) {
    super(message);
    this.name = 'AccountDeletionError';
  }
}

export const deleteAccount = async (): Promise<DeleteAccountResponse> => {
  const supabase = createClientComponentClient();
  
  try {
    // 現在のセッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new AccountDeletionError('セッション取得エラー', sessionError.message);
    }
    
    if (!session?.access_token) {
      throw new AccountDeletionError('認証が必要です');
    }

    // 削除API呼び出し
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData: DeleteAccountError = await response.json();
      throw new AccountDeletionError(
        errorData.error || 'アカウント削除に失敗しました',
        errorData.details
      );
    }

    const result: DeleteAccountResponse = await response.json();
    console.log('アカウント削除成功:', result);
    
    // ローカルストレージとセッションストレージをクリア
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    return result;

  } catch (error) {
    console.error('アカウント削除エラー:', error);
    
    if (error instanceof AccountDeletionError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AccountDeletionError('予期しないエラーが発生しました', errorMessage);
  }
};