# Care Connect

<img width="1280" height="720" alt="logo3" src="https://github.com/user-attachments/assets/83717aa7-c33e-4f64-8093-e996aec2285e" />

## 関連リンク 

[説明資料](https://www.canva.com/design/DAG2rB_Px9s/4yV3ZJZcQUK3jZ0obRT1nA/view?utm_content=DAG2rB_Px9s&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h6dc62b06f7)

[プレスリリース](https://odhackathon.metro.tokyo.lg.jp/collection/64/?year=2025) 

[プロトタイプ公開URL](https://codeshare-hackathon-bw6g.vercel.app/) 

## プロジェクト概要

「Care Connect」は、東京都内の障害福祉サービス事業所を検索し、詳細情報を閲覧できるWebアプリケーションです。利用者は、事業所名、地区、提供サービスの種類、空き状況などの条件で事業所を絞り込み検索できます。

## 主な機能

*   **事業所検索**: 事業所名、地区、提供サービス、空き状況による詳細な検索機能。
*   **事業所情報表示**: 各事業所の詳細情報（説明、アピールポイント、提供サービス、連絡先、画像など）をカード形式で表示。
*   **ユーザー認証**: Supabaseを利用したユーザー認証機能（ブックマーク、メッセージ機能など、今後の拡張を想定）。
*   **API連携**: 検索結果は `/api/search/facilities` エンドポイントから取得。

## 技術スタック

*   **フレームワーク**: [Next.js](https://nextjs.org/) (React, TypeScript)
*   **UI/UX**:
    *   [Tailwind CSS](https://tailwindcss.com/): 高速なUI開発のためのユーティリティファーストCSSフレームワーク
    *   [Framer Motion](https://www.framer.com/motion/): Reactのためのアニメーションライブラリ
    *   [Lucide React](https://lucide.dev/): 軽量でカスタマイズ可能なアイコンセット
    *   [react-hot-toast](https://react-hot-toast.com/): シンプルで美しい通知ライブラリ
*   **バックエンド & データベース**: [Supabase](https://supabase.com/): オープンソースのFirebase代替（認証、データベース）
*   **地図**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/): インタラクティブな地図表示
*   **グラフ**: [Chart.js](https://www.chartjs.org/) & [React-Chartjs-2](https://react-chartjs-2.js.org/): データ可視化のためのグラフ描画
*   **フォーム**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/): フォーム管理とスキーマバリデーション
*   **その他**:
    *   `@sendgrid/mail`: メール送信
    *   `csv-parser`: CSVデータの解析

## ディレクトリ構成

```
.
├── components/             # UIコンポーネント
│   ├── layout/             # 共通レイアウトコンポーネント(現在空)
│   ├── search/             # 検索関連のコンポーネント (FacilityCard, SearchResultsなど)
│   └── ui/                 # 汎用的なUI要素 (Button, Card, Inputなど（現在toggleswitchのみ）)
├── hooks/                  # カスタムReactフック
├── lib/                    # ユーティリティ関数や外部サービス連携ロジック
│   ├── supabase/           # Supabaseクライアントの初期化と関連ロジック (client.ts, server.ts)
│   └── utils/              # 汎用ユーティリティ (constants, helpers, validationなど)
├── pages/                  # Next.jsのページコンポーネントとAPIルート
│   ├── api/                # APIルート (例: search/facilities.ts)
│   ├── auth/               # 認証関連ページ
│   ├── _app.tsx            # アプリケーションのエントリーポイント
│   ├── index.tsx           # メインの事業所検索ページ
│   └── search-test.tsx     # 検索機能のテスト用ページ
├── public/                 # 静的ファイル (画像など)
├── scripts/                # supabaseへの接続、地区やサービスの設定、重複登録対策のユニークキー
├── styles/                 # グローバルスタイルやTailwind CSSの設定
├── types/                  # TypeScriptの型定義
├── wamnet.csv              # 事業所データ（CSV形式）
├── next.config.ts          # Next.jsの設定ファイル
├── package.json            # プロジェクトの依存関係とスクリプト
└── README.md               # このドキュメント
```

## セットアップ方法

1.  **リポジトリのクローン**:
    ```bash
    git clone https://github.com/your-username/care-connect.git
    cd care-connect
    ```
    (注: `your-username` は実際のGitHubユーザー名または組織名に置き換えてください)

2.  **依存関係のインストール**:
    ```bash
    npm install
    # または yarn install / pnpm install / bun install
    ```

3.  **環境変数の設定**:
    プロジェクトルートに `.env.local` ファイルを作成し、Supabaseの環境変数を設定します。

5.  **開発サーバーの起動**:
    ```bash
    npm run dev
    # または yarn dev / pnpm dev / bun dev
    ```
    ブラウザで `http://localhost:3000` を開くとアプリケーションが表示されます。

## 各ファイルのコード概要

### `pages/index.tsx`

アプリケーションのメインページです。

*   `SearchFilter` コンポーネントをレンダリングし、事業所名、地区、サービス、空き状況による検索フォームを提供します。
*   検索条件に基づいて `/api/search/facilities` エンドポイントにAPIリクエストを送信し、検索結果を取得します。
*   `SearchResults` コンポーネントを使用して、取得した事業所情報を表示します。
*   初回アクセス時には、統計情報、提供サービスの一覧、アカウント作成を促すCTA（Call To Action）セクションが表示されます。

### `pages/search-test.tsx`

検索機能のテストを目的としたシンプルなページです。

*   事業所名による検索入力フィールドと検索ボタンを提供します。
*   `/api/search/facilities` エンドポイントを呼び出し、検索結果をJSON形式で表示します。開発中のデバッグやAPIの動作確認に利用されます。

### `lib/supabase/client.ts`

クライアントサイド（ブラウザ）でSupabaseクライアントを初期化するための設定ファイルです。

*   `@supabase/auth-helpers-nextjs` の `createClientComponentClient` を使用して、Next.jsのクライアントコンポーネントからSupabaseにアクセスするためのクライアントインスタンスを作成しエクスポートします。

### `lib/supabase/server.ts`

サーバーサイド（Next.jsのAPIルートやサーバーコンポーネント）でSupabaseクライアントを初期化するための設定ファイルです。

*   `@supabase/ssr` の `createServerClient` を使用し、サーバー環境からSupabaseに安全にアクセスするためのクライアントインスタンスを作成します。クッキーを介して認証情報を管理します。

### `components/search/FacilityCard.tsx`

個々の事業所情報を表示するための再利用可能なReactコンポーネントです。

*   事業所の名前、地区、説明、アピールポイント、提供サービス、電話番号、ウェブサイト、画像などの情報を整形して表示します。
*   `Link` コンポーネントを使用して、事業所の詳細ページへのナビゲーションを提供します。
*   ブックマークやメッセージ送信などのアクションボタンも含まれています。
*   内部で `Badge`, `Button`, `Card` といった汎用UIコンポーネントを使用しています。

### `components/search/SearchSection.tsx`

検索フォームとフィルターオプションを提供するコンポーネントです。

*   `useSearch` カスタムフックを利用して検索ロジックを管理します。
*   事業所名、地区、サービスカテゴリ、空き状況で絞り込みを行うための入力フィールドと選択肢を提供します。
*   検索ボタンをクリックすると、親コンポーネントに検索結果を渡します。
*   (注: `pages/index.tsx` では `SearchFilter` が使用されており、この `SearchSection` は `pages/search-test.tsx` で使用されているか、あるいは代替の実装として存在します。)
