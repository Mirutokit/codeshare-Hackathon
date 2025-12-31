// components/providers/AuthProvider.tsx - 完成版
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpAsFacility: (email: string, password: string, fullName: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const enrichUserWithType = async (user: User): Promise<User> => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();
      if (userData?.user_type) {
        return { ...user, user_metadata: { ...user.user_metadata, user_type: userData.user_type } };
      }
    } catch (error) {
      console.error('ユーザータイプの取得に失敗:', error);
    }
    return user;
  };

  useEffect(() => {
    let isMounted = true;

    // 初期セッション取得
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('初期セッション取得エラー:', error);
          setUser(null);
          setSession(null);
        } else if (session?.user) {
          const enrichedUser = await enrichUserWithType(session.user);
          setUser(enrichedUser);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('認証初期化エラー:', error);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AUTH EVENT: ${event}`);

        if (!isMounted) return;

        if (session?.user) {
          const enrichedUser = await enrichUserWithType(session.user);
          setUser(enrichedUser);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }
      }
    );

    // 複数タブ間でのセッション同期を監視
    const handleStorageChange = async (e: StorageEvent) => {
      console.log('Storage change detected:', e.key);

      // Supabaseのセッション関連のキーが変更された場合
      if (e.key?.includes('supabase.auth.token') || e.key === null) {
        console.log('Session storage changed, refreshing session...');

        // セッションを再取得
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('セッション再取得エラー:', error);
          setUser(null);
          setSession(null);
        } else if (session?.user) {
          const enrichedUser = await enrichUserWithType(session.user);
          setUser(enrichedUser);
          setSession(session);
        } else {
          console.log('Session cleared, logging out...');
          setUser(null);
          setSession(null);
        }
      }
    };

    // storageイベントリスナーを追加（他のタブでの変更を検知）
    // クライアント側でのみ実行
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  // 認証状態に応じたリダイレクトを管理する統合されたuseEffect
  useEffect(() => {
    if (loading || isRedirecting) return; // 読み込み中またはリダイレクト中はなにもしない

    const handleRedirect = async () => {
      if (user) { // ログイン後
        if (router.pathname.startsWith('/auth')) {
          setIsRedirecting(true);
          const userType = user.user_metadata?.user_type;
          const targetPath = userType === 'facility' ? '/business/mypage' : '/';
          await router.replace(targetPath);
          setIsRedirecting(false);
        }
      } else { // ログアウト後
        if (!router.pathname.startsWith('/auth') && router.pathname !== '/') {
          setIsRedirecting(true);
          await router.replace('/');
          setIsRedirecting(false);
        }
      }
    };

    handleRedirect();
  }, [user, loading, router.pathname]); // router.pathname のみを監視

  const signInWithEmail = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, user_type: 'user' } },
    });
  };
  
  const signUpAsFacility = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, user_type: 'facility' } },
    });

    if (error) return { data, error };

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (data.user) {
      const { error: facilityError } = await supabase.from('facilities').insert({
        user_id: data.user.id,
        name: `${fullName}の事業所`,
        is_active: false,
      });

      if (facilityError) {
        console.error('Facility creation failed:', facilityError);
        return { data, error: new Error('認証は成功しましたが、事業者プロファイルの作成に失敗しました。') };
      }
    }
    return { data, error };
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('サインアウトエラー:', error);
        return { error };
      }

      // 念のため、LocalStorageから全てのSupabase関連のキーを削除
      // クライアント側でのみ実行
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          console.log('Removing localStorage key:', key);
          localStorage.removeItem(key);
        });
      }

      // 即座にセッション状態をクリア
      setUser(null);
      setSession(null);

      console.log('Sign out completed successfully');
      // 状態は onAuthStateChange でも自動的にクリアされます
      return { error: null };
    } catch (error) {
      console.error('サインアウト失敗:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signUpWithEmail,
    signInWithEmail,
    signUpAsFacility,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};