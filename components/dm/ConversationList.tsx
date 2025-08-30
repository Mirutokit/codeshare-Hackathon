// components/dm/ConversationList.tsx
import React from 'react';
import { MessageCircle, User } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { type Conversation } from '@/lib/hooks/useMessages';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  loading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  selectedConversationId,
  loading = false
}) => {
  const { user } = useAuthContext();

  const getOtherPartyInfo = (conversation: Conversation) => {
    if (!user) return { name: '', subtitle: '' };
    
    // 利用者用のDMシステムなので、常に事業所名を表示
    return {
      name: conversation.facility?.name || '事業所',
      subtitle: ''
    };
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        会話を読み込み中...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <MessageCircle size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#374151' }}>
          メッセージがありません
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          事業所の詳細ページからメッセージを送信してみましょう
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <h2 style={{
        margin: '0 0 1rem 1rem',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#111827'
      }}>
        メッセージ
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {conversations.map((conversation) => {
          const otherParty = getOtherPartyInfo(conversation);
          const isSelected = conversation.id === selectedConversationId;
          const isUnread = conversation.last_message && 
                          conversation.last_message.sender_id !== user?.id;

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: 'none',
                background: isSelected ? '#f0fdf4' : 'transparent',
                borderLeft: isSelected ? '4px solid #22c55e' : '4px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* アバター */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isSelected ? '#22c55e' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'white' : '#6b7280',
                flexShrink: 0
              }}>
                <User size={24} />
              </div>

              {/* 内容 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: isUnread ? 600 : 500,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {otherParty.name}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    flexShrink: 0
                  }}>
                    {formatLastMessageTime(conversation.last_message_at)}
                  </span>
                </div>

                {otherParty.subtitle && (
                  <p style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {otherParty.subtitle}
                  </p>
                )}

                {conversation.last_message && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {conversation.last_message.sender_id === user?.id ? '自分: ' : ''}
                      {conversation.last_message.content}
                    </p>
                    {isUnread && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
