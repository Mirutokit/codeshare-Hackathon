// components/AccountDeletionButton.tsx - コンポーネント例
import React from 'react';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';

interface AccountDeletionButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const AccountDeletionButton: React.FC<AccountDeletionButtonProps> = ({
  className = '',
  children = 'アカウントを削除'
}) => {
  const { deleteAccount, isDeleting, error, clearError } = useAccountDeletion();

  const handleClick = async () => {
    if (error) clearError();
    await deleteAccount();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isDeleting}
        className={`
          px-4 py-2 bg-red-600 text-white rounded-md
          hover:bg-red-700 disabled:bg-red-300
          disabled:cursor-not-allowed transition-colors
          ${className}
        `}
      >
        {isDeleting ? '削除中...' : children}
      </button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};