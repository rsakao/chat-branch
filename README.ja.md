# Chat Branch

---

![Conversation Tree Example](docs/screenshots/chat-tree-example.png)

_例: 複数の枝を持つ会話ツリーのビュー。異なるトピックを並行して探索し、比較することができ、ツリーとして視覚化されています。_

---

[English](README.md) | [日本語](README.ja.md)

OpenAI APIを使用した会話分岐機能を持つチャットアプリケーション。ChatGPTのようですが、会話を分岐させて複数のトピックを並行して探索できます。

## Key Features

- **会話分岐**: 任意のメッセージから新しい会話フローを作成
- **ツリー視覚化**: 会話構造を視覚化（シンプルビューとアドバンスドビュー）
- **会話管理**: 複数の会話を管理し、切り替え
- **リアルタイムAI応答**: OpenAI APIを使用したリアルタイム応答
- **レスポンシブデザイン**: デスクトップおよびモバイルデバイスで動作
- **多言語サポート**: 日本語と英語のUI

## Tech Stack

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS + カスタムCSS
- **データベース**: SQLite（ローカル） / PostgreSQL（プロダクション）
- **ORM**: Prisma
- **AI**: OpenAI API (GPT-4o-mini)
- **UIコンポーネント**: Lucide React, React Hot Toast
- **ツリー視覚化**: React Flow
- **国際化**: next-intl

## 🗄️ データベース設定

### ローカル開発（SQLite）

```bash
DATABASE_URL="file:./dev.db"
```

### プロダクション環境（PostgreSQL）

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🔄 自動スキーマ切り替え

アプリケーションは`DATABASE_URL`に基づいてデータベースプロバイダーを自動的に切り替えます：

- SQLite: `DATABASE_URL="file:./dev.db"`
- PostgreSQL: `DATABASE_URL="postgresql://..."`

スキーマファイルは自動的に選択され、手動での切り替えは不要です。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

#### ローカル開発

`.env`ファイルを作成し、以下の環境変数を設定します：

> **重要**: Prismaはデフォルトで`.env`ファイルを読み取ります。`.env.local`を使用すると、Prismaがデータベース接続情報を読み取るのを防ぎます。

```env
# OpenAI APIキー（必須）
OPENAI_API_KEY=your_openai_api_key_here

# データベース設定（ローカル開発 - SQLite）
DATABASE_URL="file:./dev.db"
```

> **注意**: `.env`ファイルには機密情報が含まれているため、`.gitignore`に含めることを確認してください。

#### プロダクション環境（Vercel + PostgreSQL）

Vercelの環境変数に以下を追加します：

```env
# OpenAI APIキー（必須）
OPENAI_API_KEY=your_openai_api_key_here

# データベース設定（プロダクション - PostgreSQL）
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### 3. データベース初期化

#### ローカル開発（SQLite）

```bash
npx prisma generate
npx prisma db push
```

#### プロダクション環境（PostgreSQL）

```bash
# マイグレーションの作成
npx prisma migrate dev --name init

# プロダクションにマイグレーションをデプロイ
npx prisma migrate deploy
```

### 4. アプリケーションの起動

```bash
npm run dev
```

アプリケーションは`http://localhost:3000`で起動します。

## デプロイ

### Vercelへのデプロイ

1. **Vercelプロジェクトの作成**

   ```bash
   npm i -g vercel
   vercel
   ```

2. **PostgreSQLデータベースの準備**

   - Vercel Postgres、Supabase、PlanetScaleなどのサービスを使用
   - データベース接続URLを取得

3. **環境変数の設定**

   - Vercelダッシュボードで以下の環境変数を設定します：
     - `OPENAI_API_KEY`: OpenAI APIキー
     - `DATABASE_URL`: PostgreSQL接続URL

4. **ビルドコマンドの設定**

   - 自動マイグレーション実行のために、package.jsonに以下を追加することをお勧めします：

   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build",
       "vercel-build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

5. **デプロイ**
   ```bash
   vercel --prod
   ```

### 環境ごとの設定切り替え

アプリケーションは`DATABASE_URL`に基づいてデータベースプロバイダーを自動的に切り替えます：

- SQLite: `DATABASE_URL="file:./dev.db"`（ローカル開発）
- PostgreSQL: `DATABASE_URL="postgresql://..."`（プロダクション）

## 使用法

### 基本的な使用法

1. **新しい会話を作成**: 左のサイドバーで「新しい会話」ボタンをクリック
2. **メッセージを送信**: 下部のテキストエリアにメッセージを入力して送信
3. **会話を分岐**: 任意のメッセージで「分岐」ボタンをクリックして新しいトピックを開始
4. **ツリービュー**: 右のサイドバーで会話構造を確認し、ナビゲート

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/          # Chat API
│   │   └── conversations/ # Conversation Management API
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── ChatArea.tsx       # チャットエリア
│   ├── ConversationSidebar.tsx # 会話サイドバー
│   ├── ReactFlowTree.tsx  # React Flow Tree
│   ├── SettingsModal.tsx  # 設定モーダル
│   ├── TreeView.tsx       # ツリービュー
│   ├── LocaleProvider.tsx # 国際化プロバイダー
│   └── LanguageSelector.tsx # 言語セレクター
├── hooks/                 # カスタムフック
│   ├── useChat.ts         # チャット機能
│   ├── useConversations.ts # 会話管理
│   └── useLocale.ts       # 言語管理
├── i18n/                  # 国際化
│   ├── config.ts          # i18n設定
│   ├── request.ts         # next-intl設定
│   └── messages/          # 翻訳ファイル
│       ├── en.json        # 英語
│       └── ja.json        # 日本語
├── types/                 # TypeScript型定義
│   └── index.ts
└── utils/                 # ユーティリティ関数
    └── helpers.ts
```

## 開発

### 新機能の追加

1. `src/types/index.ts`に型定義を追加
2. 必要に応じて`src/app/api/`にAPIルートを作成
3. `src/components/`にコンポーネントを追加
4. `src/hooks/`にカスタムフックを追加
5. `src/i18n/messages/`に翻訳キーを追加

### データベーススキーマの変更

#### ローカル開発

```bash
# スキーマを編集した後
npx prisma db push
npx prisma generate
```

#### プロダクション環境

```bash
# マイグレーションの作成
npx prisma migrate dev --name description_of_change

# プロダクションに適用
npx prisma migrate deploy
```

### 翻訳の追加

1. `src/i18n/messages/en.json`と`src/i18n/messages/ja.json`に翻訳キーを追加
2. コンポーネントで`useTranslations`フックを使用
3. 言語切り替え機能をテスト

## トラブルシューティング

### データベースの問題

- **SQLiteがローカルで動作しない**: `DATABASE_URL="file:./dev.db"`が正しく設定されているか確認
- **VercelでPostgreSQLが動作しない**: 正しいPostgreSQL URLが設定されているか確認
- **マイグレーションエラー**: プロダクションでは常に`prisma migrate deploy`を使用し、`prisma db push`は使用しない

### 環境変数

- ローカル: `.env`ファイル
- Vercel: ダッシュボードの環境変数
- プロダクションには`OPENAI_API_KEY`と`DATABASE_URL`が必要

### 国際化の問題

- **翻訳が読み込まれない**: 翻訳ファイルが存在し、正しい構文であるか確認
- **言語が切り替わらない**: localStorageがアクセス可能で、ページが正しくリロードされるか確認

## License

MIT License

## Contributing

プルリクエストと問題報告を歓迎します。