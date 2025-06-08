# 多言語化対応実装ガイド

このドキュメントでは、Chat Branchアプリケーションの多言語化対応（国際化、i18n）の実装内容について説明します。

## 実装した機能

### 🌐 言語サポート
- **日本語 (ja)**: デフォルト言語
- **英語 (en)**: 追加言語

### 🎛️ 言語切り替え機能
- 設定画面での言語選択
- ローカルストレージに設定を保存
- 即座に言語切り替え（ページリロード）

### 📱 UI多言語化
- すべてのボタンテキスト
- エラーメッセージとステータス表示
- モーダルダイアログ
- サイドバーとメニュー項目
- 設定画面のラベルとオプション

### 📖 README多言語化
- 英語標準のREADME.md
- 日本語版README.ja.md
- 言語選択リンクを各READMEの先頭に配置

### 🤖 自動README同期
- OpenAI APIを使用した自動翻訳
- ローカル実行コマンド
- GitHub Actions による自動同期

## 技術実装

### 使用ライブラリ
- **next-intl**: Next.js用の国際化ライブラリ
- **OpenAI API**: README自動翻訳用

### ファイル構造
```
src/
├── i18n/
│   ├── config.ts              # 言語設定・定義
│   ├── request.ts             # next-intl設定
│   └── messages/
│       ├── en.json            # 英語翻訳
│       └── ja.json            # 日本語翻訳
├── components/
│   ├── LocaleProvider.tsx     # 国際化プロバイダー
│   └── LanguageSelector.tsx   # 言語選択コンポーネント
└── hooks/
    └── useLocale.ts           # 言語管理フック

scripts/
└── sync-readme.js             # README同期スクリプト

.github/workflows/
└── sync-readme.yml            # README同期自動化
```

### 翻訳キーの構造
```json
{
  "app": { "title": "Chat Branch" },
  "header": { "settings": "設定" },
  "sidebar": { "newConversation": "新規会話" },
  "chat": { "placeholder": "メッセージを入力..." },
  "tree": { "title": "会話ツリー" },
  "settings": { "language": "言語" },
  "messages": { "branchCreated": "新しいブランチを作成しました" },
  "delete": { "confirmTitle": "会話の削除" }
}
```

## 使用方法

### 開発者向け

#### 新しい翻訳の追加
1. `src/i18n/messages/ja.json` と `src/i18n/messages/en.json` に翻訳キーを追加
2. コンポーネントで `useTranslations` フックを使用
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('section');
  return <button>{t('buttonText')}</button>;
}
```

#### README同期
```bash
# ローカルでREADME同期を実行
npm run sync-readme

# 変更チェックのみ
npm run sync-readme:check
```

### エンドユーザー向け

#### 言語切り替え方法
1. 右上の「設定」ボタンをクリック
2. 「言語」セクションで希望の言語を選択
3. 選択すると自動的にページが再読み込みされ、新しい言語で表示

## 自動化機能

### GitHub Actions による README 同期
- **トリガー**: README.md または README.ja.md の変更
- **動作**: 変更されたファイルを検出し、もう一方の言語に自動翻訳
- **結果**: 自動コミットまたはプルリクエスト作成

### 設定方法
1. GitHub リポジトリの Secrets に `OPENAI_API_KEY` を追加
2. README ファイルを編集してコミット
3. GitHub Actions が自動的に翻訳と同期を実行

## 開発時の注意点

### コンポーネントの多言語化
- ハードコーディングされたテキストは使用しない
- 必ず `useTranslations` フックを使用
- 翻訳キーは階層構造で整理

### 動的テキストの処理
```tsx
// パラメータありの翻訳
t('delete.conversationTitle', { title: conversationTitle })

// 条件分岐
{isLoading ? t('status.generating') : t('status.ready')}
```

### ローカルストレージの扱い
- 言語設定は `localStorage` に保存
- サーバーサイドでは常にデフォルト言語を使用
- クライアントサイドで動的に言語を読み込み

## トラブルシューティング

### よくある問題

#### 翻訳が表示されない
- 翻訳ファイルの JSON 構文をチェック
- 翻訳キーのパスが正しいか確認
- `LocaleProvider` が適切にコンポーネントをラップしているか確認

#### 言語切り替えが機能しない
- ローカルストレージが有効か確認
- ページリロードが正常に実行されるか確認
- ブラウザのコンソールでエラーをチェック

#### README同期が失敗する
- `OPENAI_API_KEY` 環境変数が設定されているか確認
- API キーに十分な権限があるか確認
- ネットワーク接続とAPI制限をチェック

## 今後の拡張

### 追加可能な機能
- より多くの言語サポート（中国語、韓国語、スペイン語等）
- 地域別設定（日付・時刻フォーマット）
- 右から左へのテキスト（RTL）サポート
- 複数形処理の改善
- 翻訳の品質向上（コンテキスト情報の追加）

### 実装のベストプラクティス
- 翻訳キーは意味のある名前を使用
- コンポーネント単位で翻訳を分割
- 定期的な翻訳レビューとアップデート
- アクセシビリティを考慮した多言語対応

## 結論

Chat Branch アプリケーションの多言語化対応により、日本語と英語のユーザーが同等の体験を得られるようになりました。自動化されたREADME同期機能により、ドキュメントの多言語対応も効率的に管理できます。

この実装は OSS 公開に向けた重要なステップであり、国際的なユーザーベースの拡大に貢献します。