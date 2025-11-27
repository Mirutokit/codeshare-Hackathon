import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuthContext } from '@/components/providers/AuthProvider';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    user_type: 'user' | 'facility';
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  facility_id: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
  };
  facility?: {
    name: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
  };
}

export function useMessages() {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // 会話一覧を取得
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 会話データを取得（RLSポリシーで自動フィルタリング）
      // 利用者：user_id = auth.uid() の会話
      // 事業者：facilities.user_id または facilities.profile_id = auth.uid() の会話
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      if (!conversationData || conversationData.length === 0) {
        setConversations([]);
        return;
      }

      // 各会話に対して、ユーザー情報、事業所情報、最後のメッセージを取得
      const conversationsWithDetails = await Promise.all(
        conversationData.map(async (conv) => {
          // ユーザー情報を取得（usersテーブルから）
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', conv.user_id)
            .single();

          if (userError) {
            console.error('ユーザー情報取得エラー:', userError, 'user_id:', conv.user_id);
          }

          // 事業所情報を取得
          const { data: facilityData, error: facilityError } = await supabase
            .from('facilities')
            .select('name')
            .eq('id', conv.facility_id)
            .single();

          if (facilityError) {
            console.error('事業所情報取得エラー:', facilityError, 'facility_id:', conv.facility_id);
          }

          // 最後のメッセージを取得
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id, is_read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // この会話の未読メッセージ数を取得
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)  // 自分が送信したメッセージは除外
            .eq('is_read', false);       // 未読のみ

          console.log('会話詳細:', {
            conversation_id: conv.id,
            user_id: conv.user_id,
            userData: userData,
            facilityData: facilityData,
            unreadCount: unreadCount
          });

          return {
            ...conv,
            user: userData,
            facility: facilityData,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (err: any) {
      setError(err.message);
      console.error('会話一覧取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 特定の会話のメッセージを取得
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // メッセージ基本データを取得
      const { data: messageData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 送信者情報を別途取得（usersテーブルから）
      const messagesWithSender = await Promise.all(
        (messageData || []).map(async (message) => {
          const { data: senderData } = await supabase
            .from('users')
            .select('full_name, user_type')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            sender: senderData
          };
        })
      );

      setMessages(messagesWithSender);

      // 自分宛の未読メッセージを既読にする
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

    } catch (err: any) {
      setError(err.message);
      console.error('メッセージ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 会話を作成または取得（簡略化版）
  const getOrCreateConversation = useCallback(async (
    userId: string, 
    facilityId: number
  ) => {
    try {
      // 既存の会話を確認
      const { data: existingConv, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .single();

      if (existingConv) {
        return existingConv.id;
      }

      // 新しい会話を作成
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          facility_id: facilityId
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConv.id;
    } catch (err: any) {
      console.error('会話作成エラー:', err);
      throw err;
    }
  }, []);

  // メッセージを送信（簡略化版）
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string
  ) => {
    if (!user) throw new Error('ログインが必要です');

    try {
      // 会話情報を取得してreceiver_idを特定
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('user_id, facility_id')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // receiver_idを決定（送信者と異なる側）
      const recipient_id = convData.user_id === user.id
        ? convData.facility_id.toString()
        : convData.user_id;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipient_id,
          content: content,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // 会話の最終メッセージ時刻を更新
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // メッセージリストを更新
      await fetchMessages(conversationId);

      return data;
    } catch (err: any) {
      console.error('メッセージ送信エラー:', err);
      throw err;
    }
  }, [user, fetchMessages]);

  // 未読メッセージ数を取得
  const getUnreadCount = useCallback(async () => {
    if (!user) return 0;

    try {
      // ユーザーの会話IDを取得
      const { data: userConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (!userConversations || userConversations.length === 0) {
        return 0;
      }

      const conversationIds = userConversations.map(c => c.id);

      // 未読メッセージ数を取得
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (err: any) {
      console.error('未読数取得エラー:', err);
      return 0;
    }
  }, [user]);

  // Realtimeセットアップ
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('新しいメッセージ:', payload.new);
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('新しい会話:', payload.new);
          fetchConversations();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchConversations]);

  // 初期データ読み込み
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    getUnreadCount,
    setMessages
  };
}