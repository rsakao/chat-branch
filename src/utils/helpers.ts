import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types';

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
}

// レガシー関数 - 新しいコンポーネントではConversationSidebar内の国際化対応関数を使用してください
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  // ブラウザの言語設定に基づいて表示を変更
  const isJapanese = typeof window !== 'undefined' 
    ? navigator.language.startsWith('ja') 
    : true;

  if (diffInMinutes < 1) return isJapanese ? 'たった今' : 'just now';
  if (diffInMinutes < 60) return isJapanese ? `${diffInMinutes}分前` : `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return isJapanese ? `${diffInHours}時間前` : `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return isJapanese ? `${diffInDays}日前` : `${diffInDays}d ago`;

  return date.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US');
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function buildPathToMessage(
  targetId: string,
  messages: Record<string, Message>
): string[] {
  const findPath = (messageId: string): string[] | null => {
    if (messageId === targetId) return [messageId];

    const message = messages[messageId];
    if (!message) return null;

    for (const childId of message.children || []) {
      const childPath = findPath(childId);
      if (childPath) return [messageId, ...childPath];
    }

    return null;
  };

  // ルートメッセージから開始して探索
  for (const messageId in messages) {
    const message = messages[messageId];
    if (!message.parentId) {
      // ルートメッセージ
      const path = findPath(messageId);
      if (path) return path;
    }
  }

  return [];
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-') && apiKey.length > 20;
}
