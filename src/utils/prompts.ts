// 引用機能専用のプロンプト処理ユーティリティ

export interface QuotedMessageInfo {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

/**
 * 引用メッセージに対する専用プロンプトを生成
 */
export function buildQuotedPrompt(
  userMessage: string,
  quotedText: string,
  quotedMessage?: QuotedMessageInfo
): string {
  // 引用テキストが長い場合は省略
  const truncatedQuotedText = quotedText.length > 300 
    ? quotedText.substring(0, 300) + '...'
    : quotedText

  const prompt = `以下の部分を引用してお聞きします：

【引用】
"${truncatedQuotedText}"

【質問・コメント】
${userMessage}

この引用部分について回答してください。`

  return prompt
}

/**
 * システムプロンプトに引用機能の説明を追加
 */
export const SYSTEM_PROMPT_WITH_QUOTE = `あなたは親切で知識豊富なAIアシスタントです。日本語で分かりやすく回答してください。

ユーザーが過去のメッセージや特定のテキストを引用して質問した場合は、以下の点に注意して回答してください：

1. 引用された内容を正確に理解し、それに基づいて回答する
2. 引用部分が不明確な場合は、確認を求める
3. 引用内容に対する具体的な説明や関連情報を提供する
4. 引用された文脈を考慮して適切な詳しさで説明する
5. 必要に応じて、引用部分を参照しながら説明する

引用がない通常の質問の場合は、これまで通り親切で分かりやすい回答を心がけてください。`

/**
 * 引用の種類を判定
 */
export function getQuoteType(quotedText: string, originalContent: string): 'partial' | 'full' {
  return quotedText.length < originalContent.length ? 'partial' : 'full'
}

/**
 * 引用メッセージのメタデータを含むプロンプトを生成
 */
export function buildEnhancedQuotedPrompt(
  userMessage: string,
  quotedText: string,
  quotedMessage?: QuotedMessageInfo
): string {
  const quoteType = quotedMessage 
    ? getQuoteType(quotedText, quotedMessage.content)
    : 'partial'

  const quoteTypeText = quoteType === 'partial' ? '部分引用' : '全文引用'
  const senderText = quotedMessage?.role === 'user' ? 'ユーザーのメッセージ' : 'AIの回答'

  const prompt = `【${quoteTypeText}：${senderText}より】
"${quotedText}"

上記の引用について：${userMessage}`

  return prompt
} 