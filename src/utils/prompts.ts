// 引用機能専用のプロンプト処理ユーティリティ

export interface QuotedMessageInfo {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * 言語に応じたシステムプロンプトを取得
 */
export function getSystemPrompt(locale: string = 'en'): string {
  if (locale === 'ja') {
    return `あなたは親切で知識豊富なAIアシスタントです。ユーザーの質問の言語に合わせて回答してください。

ユーザーが過去のメッセージや特定のテキストを引用して質問した場合は、以下の点に注意して回答してください：

1. 引用された内容を正確に理解し、それに基づいて回答する
2. 引用部分が不明確な場合は、確認を求める
3. 引用内容に対する具体的な説明や関連情報を提供する
4. 引用された文脈を考慮して適切な詳しさで説明する
5. 必要に応じて、引用部分を参照しながら説明する

引用がない通常の質問の場合は、これまで通り親切で分かりやすい回答を心がけてください。

重要：ユーザーが日本語で質問した場合は日本語で、英語で質問した場合は英語で、その他の言語で質問した場合はその言語で回答してください。`;
  }

  return `You are a helpful and knowledgeable AI assistant. Please respond in the language that the user is using.

When a user quotes specific text from previous messages and asks questions, please pay attention to the following points:

1. Accurately understand the quoted content and respond based on it
2. If the quoted content is unclear, ask for clarification
3. Provide specific explanations and related information about the quoted content
4. Explain with appropriate detail considering the context of the quoted content
5. Reference the quoted content in your explanation when necessary

For regular questions without quotes, please continue to provide helpful and clear responses as usual.

Important: Please respond in English when the user asks in English, in Japanese when the user asks in Japanese, and in the same language when the user asks in other languages.`;
}

/**
 * 引用メッセージに対する専用プロンプトを生成
 */
export function buildQuotedPrompt(
  userMessage: string,
  quotedText: string,
  locale: string = 'en'
): string {
  const truncatedQuotedText =
    quotedText.length > 300 ? quotedText.substring(0, 300) + '...' : quotedText;

  if (locale === 'ja') {
    return `以下の部分を引用してお聞きします：

【引用】
"${truncatedQuotedText}"

【質問・コメント】
${userMessage}

この引用部分について回答してください。`;
  }

  return `I am quoting the following text:

【Quote】
"${truncatedQuotedText}"

【Question/Comment】
${userMessage}

Please respond about this quoted part.`;
}

/**
 * 引用メッセージのメタデータを含むプロンプトを生成
 */
export function buildEnhancedQuotedPrompt(
  userMessage: string,
  quotedText: string,
  quotedMessage?: QuotedMessageInfo,
  locale: string = 'en'
): string {
  const quoteType = quotedMessage
    ? getQuoteType(quotedText, quotedMessage.content)
    : 'partial';

  const isPartialQuote = quoteType === 'partial';
  const isFromUser = quotedMessage?.role === 'user';

  if (locale === 'ja') {
    const quoteTypeText = isPartialQuote ? '部分引用' : '全文引用';
    const senderText = isFromUser ? 'ユーザーのメッセージ' : 'AIの回答';

    return `【${quoteTypeText}：${senderText}より】
"${quotedText}"

上記の引用について：${userMessage}`;
  }

  const quoteTypeText = isPartialQuote ? 'Partial Quote' : 'Full Quote';
  const senderText = isFromUser ? 'User Message' : 'AI Response';

  return `【${quoteTypeText}: From ${senderText}】
"${quotedText}"

Regarding the above quote: ${userMessage}`;
}

/**
 * 引用タイプを判定する（部分引用 or 全文引用）
 */
function getQuoteType(
  quotedText: string,
  originalContent: string
): 'partial' | 'full' {
  const normalizedQuoted = quotedText.trim().replace(/\s+/g, ' ');
  const normalizedOriginal = originalContent.trim().replace(/\s+/g, ' ');

  if (normalizedQuoted === normalizedOriginal) {
    return 'full';
  }

  return 'partial';
}

// 下位互換性のため、元の定数を維持（deprecated）
export const SYSTEM_PROMPT_WITH_QUOTE = getSystemPrompt('ja');
