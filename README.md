# AI Branch Chat App

AI分岐チャットアプリは、ユーザーの入力に応じて分岐するチャットフローを作成・管理できるWebアプリケーションです。

## Features

- チャットフローの分岐設計
- OpenAI API連携
- PrismaによるDB管理
- Next.js + TypeScript構成
- 多言語対応（日本語/英語）

## Getting Started

### 1. 必要なもの

- Node.js (v18以上推奨)
- npm
- PostgreSQL または SQLite

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定してください。

```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
```

### 3. 依存パッケージのインストール

```
npm install
```

### 4. DBマイグレーション

```
npx prisma migrate dev
```

### 5. 開発サーバー起動

```
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## Usage

### チャットフローの作成

1. トップページから「新規チャットフロー作成」
2. ノード（質問や分岐）を追加
3. 各ノードにAIプロンプトや分岐条件を設定
4. 保存してテスト

### OpenAI API連携

- `.env` の `OPENAI_API_KEY` にAPIキーを設定
- チャットノードでAI応答を利用可能

### DB管理

- PrismaでDBスキーマ管理
- `prisma/schema.prisma` を編集し、`npx prisma migrate dev` で反映

## Scripts

- `npm run dev` : 開発サーバー起動
- `npm run build` : 本番ビルド
- `npm run start` : 本番サーバー起動
- `npm run format` : Prettierによるコード整形
- `npm run format:check` : フォーマットチェック
- `npm run sync-readme` : READMEの同期（多言語対応用）

## 環境ごとの設定切り替え

アプリケーションは `DATABASE_URL` に基づいてデータベースプロバイダーを自動的に切り替えます：

- SQLite: `DATABASE_URL="file:./dev.db"`（ローカル開発）
- PostgreSQL: `DATABASE_URL="postgresql://..."`（プロダクション）

## License

This project is licensed under the MIT License.
