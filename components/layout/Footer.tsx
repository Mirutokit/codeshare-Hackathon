// components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { useDevice } from '../../hooks/useDevice';

const Footer: React.FC = () => {
  const { isMobile } = useDevice();

  return (
    <footer style={{
      backgroundColor: '#f9fafb',
      borderTop: '1px solid #e5e7eb',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      marginTop: 'auto' // フレックスレイアウトでフッターを下に押し下げる
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '1.5rem' : '2rem'
      }}>
        {/* ロゴセクション */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            backgroundColor: '#22c55e',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: isMobile ? '1rem' : '1.25rem'
          }}>
            C
          </div>
          <span style={{ 
            fontSize: isMobile ? '1rem' : '1.25rem', 
            fontWeight: '600', 
            color: '#111827' 
          }}>
            ケアコネクト
          </span>
        </Link>

        {/* モバイル版：縦並びレイアウト */}
        {isMobile ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            textAlign: 'center',
            width: '100%'
          }}>
            {/* データ出典 */}
            <div style={{ 
              fontSize: '0.75rem',
              color: '#6b7280',
              lineHeight: 1.4
            }}>
              <a 
                href="https://www.wam.go.jp/content/wamnet/pcpub/top/sfkopendata/" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#22c55e',
                  textDecoration: 'none'
                }}
              >
                障害福祉サービス等情報公表システムデータの<br />オープンデータより抜粋して作成
              </a>
            </div>
            
            {/* コピーライト */}
            <div style={{ 
              color: '#6b7280', 
              fontSize: '0.75rem'
            }}>
              © 2025 ケアコネクト. All rights reserved.
            </div>
          </div>
        ) : (
          /* デスクトップ版：横並びレイアウト */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.5rem'
          }}>
            {/* データ出典 */}
            <div style={{ 
              fontSize: '0.8rem',
              color: '#6b7280',
              textAlign: 'right'
            }}>
              <a 
                href="https://www.wam.go.jp/content/wamnet/pcpub/top/sfkopendata/" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#22c55e',
                  textDecoration: 'none'
                }}
              >
                障害福祉サービス等情報公表システムデータのオープンデータより抜粋して作成
              </a>
            </div>
            
            {/* コピーライト */}
            <div style={{ 
              color: '#6b7280', 
              fontSize: '0.875rem'
            }}>
              © 2025 ケアコネクト. All rights reserved.
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;