// hooks/useAccountDeletion.ts - React Hook
import { useState } from 'react';
import { useRouter } from 'next/router';
import { deleteAccount, AccountDeletionError } from '@/lib/auth/deleteAccount';

export const useAccountDeletion = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteAccount = async (): Promise<boolean> => {
    if (isDeleting) return false;

    const confirmed = window.confirm(
      'アカウントを削除すると、すべてのデータが永久に削除されます。この操作は取り消せません。本当に削除しますか？'
    );

    if (!confirmed) return false;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      
      // 削除成功後、トップページにリダイレクト
      router.push('/');
      
      // 成功メッセージを表示（オプション）
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          alert('アカウントが正常に削除されました');
        }, 100);
      }
      
      return true;

    } catch (error) {
      console.error('アカウント削除エラー:', error);
      
      const errorMessage = error instanceof AccountDeletionError 
        ? error.message 
        : 'アカウント削除中にエラーが発生しました';
      
      setError(errorMessage);
      return false;

    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount: handleDeleteAccount,
    isDeleting,
    error,
    clearError: () => setError(null)
  };
};