import React from 'react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '90vw',
        width: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
          aria-label="閉じる"
        >✕</button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>ヘルプ</h2>
        <div style={{ fontSize: '1rem', color: '#374151' }}>
          <p>
            <b>ケアコネクトの使い方</b>
          </p>
          <ul style={{ paddingLeft: '1rem', marginBottom: '1rem' }}>
            <li>
              <b>事業所検索</b>：東京都内の障害福祉サービス事業所を検索できます。<br />
              キーワードや地域、サービス種別などで絞り込みが可能です。
            </li>
            <li>
              <b>ログイン・マイページ</b>：お気に入り事業所の管理やアカウント設定ができます。<br />
              利用者・事業者それぞれ専用のマイページがあります。
            </li>
            <li>
              <b>お問い合わせ</b>：ご不明点やご要望は「お問い合わせ」からご連絡ください。
            </li>
          </ul>
          <p>
            <b>よくある質問</b>
          </p>
          <ul style={{ paddingLeft: '1rem', marginBottom: '1rem' }}>
            <li>検索結果が表示されない場合は、条件を変更して再度お試しください。</li>
          </ul>
          <p>
            その他ご不明点は「お問い合わせ」よりお気軽にご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}

export default HelpModal