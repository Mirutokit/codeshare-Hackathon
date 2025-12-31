// hooks/useAuth.ts - 認証状態管理フック
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { getUserProfile } from '../lib/auth/auth-helpers';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('初期セッション取得エラー:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        // プロフィール取得
        if (session?.user) {
          const profileData = await getUserProfile(session.user.id);
          setProfile(profileData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('初期認証確認エラー:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);

        // プロフィール取得
        if (session?.user) {
          const profileData = await getUserProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('サインアウトエラー:', error);
        return false;
      }
      setUser(null);
      setSession(null);
      setProfile(null);
      return true;
    } catch (error) {
      console.error('サインアウトエラー:', error);
      return false;
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut: handleSignOut,
    isAuthenticated: !!session,
    isEmailConfirmed: !!user?.email_confirmed_at,
  };
};
