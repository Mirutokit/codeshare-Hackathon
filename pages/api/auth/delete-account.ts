// pages/api/auth/delete-account.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  DeleteAccountResponse, 
  DeleteAccountError, 
  DatabaseCleanupResult 
} from 'types/auth';

// 環境変数の取得（! をつけて undefined を除外）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase環境変数が設定されていません');
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteAccountResponse | DeleteAccountError>
) {
  console.log('=== DELETE ACCOUNT API START ===')
  console.log('Method:', req.method)
  console.log('Headers:', Object.keys(req.headers))
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authorization = req.headers.authorization;
    console.log('Authorization header exists:', !!authorization)
    console.log('Authorization header length:', authorization?.length)
    
    if (!authorization) {
      console.log('❌ Authorization header missing')
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authorization.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length)
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // クライアント用Supabase（ユーザー認証用）
    const supabaseClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Service Role用Supabase（管理者権限）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`アカウント削除開始: ユーザーID ${user.id}`);

    // 削除処理を順番に実行
    const cleanupResult = await performDatabaseCleanup(supabaseAdmin, user.id);

    console.log(`アカウント削除完了: ユーザーID ${user.id}`, cleanupResult);

    return res.status(200).json({
      message: 'アカウントが正常に削除されました',
      deletedUserId: user.id
    });

  } catch (error) {
    console.error('アカウント削除処理エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'サーバーエラーが発生しました',
      details: errorMessage
    });
  }
}



// データベース削除処理の関数
async function performDatabaseCleanup(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<DatabaseCleanupResult> {
  const result: DatabaseCleanupResult = {
    bookmarksDeleted: 0,
    usersDetailsDeleted: 0,
    publicUsersDeleted: 0,
    authUserDeleted: false
  };

  try {
    // 1. ブックマークデータを削除
    const { count: bookmarkCount, error: bookmarkError } = await supabaseAdmin
      .from('bookmark')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (bookmarkError) {
      console.warn('ブックマーク削除警告:', bookmarkError.message);
    } else {
      result.bookmarksDeleted = bookmarkCount || 0;
    }

    // 2. users_detailsテーブルから削除
    const { count: detailsCount, error: detailsError } = await supabaseAdmin
      .from('users_details')
      .delete({ count: 'exact' })
      .eq('id', userId);

    if (detailsError) {
      console.warn('users_details削除警告:', detailsError.message);
    } else {
      result.usersDetailsDeleted = detailsCount || 0;
    }

    // 3. public.usersテーブルから削除
    const { count: publicUsersCount, error: publicUsersError } = await supabaseAdmin
      .from('users')
      .delete({ count: 'exact' })
      .eq('id', userId);

    if (publicUsersError) {
      console.warn('public.users削除警告:', publicUsersError.message);
    } else {
      result.publicUsersDeleted = publicUsersCount || 0;
    }

    // 4. auth.usersテーブルから削除（最後に実行）
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('auth.users削除エラー:', authDeleteError);
      throw new Error(`認証ユーザー削除に失敗: ${authDeleteError.message}`);
    }

    result.authUserDeleted = true;
    return result;

  } catch (error) {
    console.error('データベース削除処理エラー:', error);
    throw error;
  }
}
