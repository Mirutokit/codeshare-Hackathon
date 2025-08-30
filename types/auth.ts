// types/auth.ts - 型定義
export interface DeleteAccountResponse {
  message: string;
  deletedUserId: string;
}

export interface DeleteAccountError {
  error: string;
  details?: string;
}

export interface DatabaseCleanupResult {
  bookmarksDeleted: number;
  usersDetailsDeleted: number;
  publicUsersDeleted: number;
  authUserDeleted: boolean;
}