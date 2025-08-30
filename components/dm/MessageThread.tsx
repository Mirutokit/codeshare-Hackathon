// components/dm/MessageThread.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useMessages, type Message, type Conversation } from '@/lib/hooks/useMessages';

interface MessageThreadProps {
  conversation: Conversation;
  onClose: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversation, onClose }) => {
  const { user } = useAuthContext();
  const { messages, fetchMessages, sendMessage, loading } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージを取得
  useEffect(() => {
    if (conversation.id) {
      fetchMessages(conversation.id);
    }
  }, [conversation.id, fetchMessages]);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    try {
      setSending(true);
      
      await sendMessage(conversation.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const getOtherPartyName = () => {
    if (!user) return '';
    
    // 利用者が見る場合は事業所名を表示
    return conversation.facility?.name || '事業所';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <User size={20} />
          </div>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: 600, 
              color: '#111827' 
            }}>
              {getOtherPartyName()}
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '0.875rem', 
              color: '#6b7280' 
            }}>
              {conversation.facility?.name && `事業所: ${conversation.facility.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        maxHeight: '400px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            メッセージを読み込み中...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#6b7280',
            padding: '2rem' 
          }}>
            まだメッセージがありません。
            <br />
            最初のメッセージを送信してみましょう！
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((message) => {
              const isMyMessage = message.sender_id === user?.id;
              
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: isMyMessage 
                      ? '1rem 1rem 0.25rem 1rem' 
                      : '1rem 1rem 1rem 0.25rem',
                    background: isMyMessage ? '#22c55e' : '#f3f4f6',
                    color: isMyMessage ? 'white' : '#111827'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {message.content}
                    </p>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.75rem',
                      opacity: 0.7
                    }}>
                      {new Date(message.created_at).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力 */}
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            outline: 'none',
            fontSize: '0.875rem'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          style={{
            padding: '0.75rem 1rem',
            background: !newMessage.trim() || sending ? '#d1d5db' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <Send size={16} />
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  );
};

export default MessageThread;
