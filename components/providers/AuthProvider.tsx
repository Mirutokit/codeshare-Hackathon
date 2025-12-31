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
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AUTH EVENT: ${event}`);
        if (session?.user) {
          const enrichedUser = await enrichUserWithType(session.user);
          setUser(enrichedUser);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }
        setLoading(false);
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 認証状態に応じたリダイレクトを管理する統合されたuseEffect
  useEffect(() => {
    if (loading) return; // 読み込み中はなにもしない

    if (user) { // ログイン後
      if (router.pathname.startsWith('/auth')) {
        const userType = user.user_metadata?.user_type;
        router.push(userType === 'facility' ? '/business/mypage' : '/');
      }
    } else { // ログアウト後
      if (!router.pathname.startsWith('/auth') && router.pathname !== '/') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('サインアウトエラー:', error);
        return { error };
      }
      // 状態は onAuthStateChange で自動的にクリアされます
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