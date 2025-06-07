# Vercelデプロイガイド

このガイドでは、AI分岐チャットアプリをVercelにデプロイし、PostgreSQLデータベースを設定する手順を説明します。

## 前提条件

- Vercelアカウント
- GitHubリポジトリ
- PostgreSQLデータベース（Vercel Postgres、Supabase、PlanetScale等）
- OpenAI APIキー

## ステップ1: PostgreSQLデータベースの準備

### Vercel Postgresを使用する場合

1. Vercelダッシュボードにログイン
2. プロジェクトの「Storage」タブに移動
3. 「Create Database」→「Postgres」を選択
4. データベース名を入力して作成
5. 接続情報をコピー

### 他のプロバイダーを使用する場合

- **Supabase**: [supabase.com](https://supabase.com)でプロジェクト作成
- **PlanetScale**: [planetscale.com](https://planetscale.com)でデータベース作成
- **Neon**: [neon.tech](https://neon.tech)でプロジェクト作成

いずれの場合も、PostgreSQL接続URLを取得してください。

## ステップ2: Vercelプロジェクトの設定

### 1. リポジトリをVercelにインポート

```bash
# Vercel CLIを使用する場合
npm i -g vercel
vercel
```

または、Vercelダッシュボードから「New Project」→GitHubリポジトリを選択

### 2. 環境変数の設定

Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI APIキー |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL接続URL |

### 3. ビルド設定の確認

Vercelが自動的に以下の設定を検出することを確認：

- **Build Command**: `npm run vercel-build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## ステップ3: デプロイの実行

### 初回デプロイ

1. Vercelダッシュボードで「Deploy」をクリック
2. ビルドプロセスを監視：
   - スキーマの自動切り替え
   - Prismaクライアントの生成
   - データベースマイグレーション
   - Next.jsアプリのビルド

### デプロイ後の確認

デプロイが完了したら：

1. 提供されたURLでアプリにアクセス
2. 新しい会話を作成してテスト
3. AI応答が正常に動作することを確認

## ステップ4: カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Domains」タブに移動
2. カスタムドメインを追加
3. DNSレコードを設定

## トラブルシューティング

### よくある問題と解決策

#### 1. ビルドエラー: "Prisma Client not found"

**原因**: Prismaクライアントが正しく生成されていない

**解決策**:
```bash
# 環境変数でPrismaクライアントの生成を強制
PRISMA_GENERATE_DATAPROXY=true
```

#### 2. マイグレーションエラー

**原因**: データベースへの接続が失敗している

**解決策**:
- `DATABASE_URL`が正しく設定されているか確認
- データベースが起動しているか確認
- 接続権限があるか確認

#### 3. OpenAI APIエラー

**原因**: APIキーが正しく設定されていない

**解決策**:
- `OPENAI_API_KEY`が正しく設定されているか確認
- APIキーが有効で残高があるか確認

### ログの確認

Vercelダッシュボードの「Functions」タブでAPI関数のログを確認できます。

## セキュリティ

### 環境変数の管理

- 本番環境では必ずVercelの環境変数機能を使用
- APIキーやデータベース認証情報をコードに含めない
- `.env`ファイルは`.gitignore`で除外されていることを確認

### データベースセキュリティ

- PostgreSQLデータベースはSSL接続を使用
- 必要最小限の権限でデータベースユーザーを作成
- 定期的にバックアップを取得

## モニタリング

### Vercel Analytics

1. Vercelダッシュボードで「Analytics」を有効化
2. パフォーマンスとエラーを監視

### カスタムモニタリング

- OpenAI API使用量の監視
- データベース接続数の監視
- エラーレート の追跡

## スケーリング

### データベース

- PostgreSQLデータベースのスケーリング設定
- 接続プールの最適化
- インデックスの最適化

### Vercel

- Function実行時間の最適化（現在30秒に設定）
- Edge Functionsの活用検討

## バックアップとリストア

### データベースバックアップ

```bash
# PostgreSQLダンプの作成
pg_dump $DATABASE_URL > backup.sql

# リストア
psql $DATABASE_URL < backup.sql
```

### 設定のバックアップ

- 環境変数設定のドキュメント化
- Vercel設定ファイル（`vercel.json`）のバージョン管理

## 更新とメンテナンス

### アプリケーション更新

1. ローカルでテスト
2. スキーマ変更がある場合はマイグレーション作成
3. GitHubにプッシュ
4. Vercelで自動デプロイ

### 依存関係の更新

```bash
# セキュリティ更新の確認
npm audit

# 依存関係の更新
npm update
```

## サポート

問題が発生した場合：

1. [Vercelドキュメント](https://vercel.com/docs)を確認
2. [Prismaドキュメント](https://www.prisma.io/docs)を確認
3. GitHubのIssuesで報告

---

このガイドに従って、安全で高性能なAI分岐チャットアプリをVercelにデプロイできます。 