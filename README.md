# AI分岐チャット

OpenAI APIを使用した会話分岐機能付きチャットアプリケーションです。ChatGPTのようなUIで、会話を途中で分岐させて複数の話題を並行して進めることができます。

## 主な機能

- **会話分岐**: 任意のメッセージから新しい会話の流れを作成
- **ツリー表示**: 会話の構造を視覚的に表示（シンプル表示・高度表示）
- **会話管理**: 複数の会話を管理し、切り替え可能
- **リアルタイムAI応答**: OpenAI APIを使用したリアルタイム応答
- **レスポンシブデザイン**: デスクトップ・モバイル対応

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS + カスタムCSS
- **データベース**: SQLite + Prisma ORM
- **AI**: OpenAI API (GPT-4o-mini)
- **UI コンポーネント**: Lucide React, React Hot Toast
- **ツリー表示**: React Flow

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# OpenAI API Key (必須)
OPENAI_API_KEY=your_openai_api_key_here

# Database URL
DATABASE_URL="file:./dev.db"
```

### 3. データベースの初期化

```bash
npx prisma generate
npx prisma db push
```

### 4. アプリケーションの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 使用方法

### 基本的な使い方

1. **新しい会話を作成**: 左サイドバーの「新規会話」ボタンをクリック
2. **メッセージを送信**: 下部のテキストエリアにメッセージを入力して送信
3. **会話を分岐**: 任意のメッセージの「分岐」ボタンをクリックして新しい話題を開始
4. **ツリー表示**: 右サイドバーで会話の構造を確認・ナビゲート

### 分岐機能

- 任意のメッセージから新しい会話の流れを作成できます
- 分岐した会話は独立して進行し、元の会話に戻ることも可能です
- ツリー表示で全体の構造を把握できます

### ツリー表示モード

- **自動選択**: メッセージ数に応じて最適な表示方法を選択
- **シンプル表示**: テキストベースの階層表示
- **高度表示**: React Flowを使用したインタラクティブなノード表示

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   │   ├── chat/          # チャット API
│   │   └── conversations/ # 会話管理 API
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── ChatArea.tsx       # チャットエリア
│   ├── ConversationSidebar.tsx # 会話サイドバー
│   ├── ReactFlowTree.tsx  # React Flow ツリー
│   ├── SettingsModal.tsx  # 設定モーダル
│   └── TreeView.tsx       # ツリー表示
├── hooks/                 # カスタムフック
│   ├── useChat.ts         # チャット機能
│   └── useConversations.ts # 会話管理
├── types/                 # TypeScript型定義
│   └── index.ts
└── utils/                 # ユーティリティ関数
    └── helpers.ts
```

## 開発

### 新機能の追加

1. 型定義を `src/types/index.ts` に追加
2. 必要に応じてAPIルートを `src/app/api/` に作成
3. コンポーネントを `src/components/` に追加
4. カスタムフックを `src/hooks/` に追加

### データベーススキーマの変更

```bash
# スキーマを編集後
npx prisma db push
npx prisma generate
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。
