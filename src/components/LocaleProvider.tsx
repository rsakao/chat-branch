'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { useLocale } from '../hooks/useLocale';

interface LocaleProviderProps {
  children: ReactNode;
}

// 翻訳メッセージのキャッシュ
const messageCache = new Map<string, Record<string, unknown>>();

// メッセージをプリロード
async function preloadMessages(locale: string): Promise<Record<string, unknown>> {
  if (messageCache.has(locale)) {
    return messageCache.get(locale)!;
  }

  try {
    const messagesModule = await import(`../i18n/messages/${locale}.json`);
    const messages = messagesModule.default;
    messageCache.set(locale, messages);
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for ${locale}:`, error);
    // フォールバック: 日本語メッセージを読み込み
    if (locale !== 'ja') {
      return preloadMessages('ja');
    }
    throw error;
  }
}

export default function LocaleProvider({ children }: LocaleProviderProps) {
  const { locale, isLoading } = useLocale();
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        setIsMessagesLoading(true);
        const loadedMessages = await preloadMessages(locale);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Failed to load any messages:', error);
      } finally {
        setIsMessagesLoading(false);
      }
    }

    if (!isLoading) {
      loadMessages();
    }
  }, [locale, isLoading]);

  // 初期ロード中の最小限表示（ほぼ瞬時）
  if (isLoading) {
    return (
      <div className="app-container">
        <div className="app-header">
          <div className="header-left">
            <h1>Chat Branch</h1>
          </div>
        </div>
      </div>
    );
  }

  // 翻訳読み込み中（通常は数ミリ秒）
  if (isMessagesLoading || !messages) {
    return (
      <div className="app-container">
        <div className="app-header">
          <div className="header-left">
            <h1>Chat Branch</h1>
          </div>
          <div className="header-controls">
            <span className="status-text">Ready</span>
          </div>
        </div>
        <main className="main-content">
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#666',
            opacity: 0.7
          }}>
            <div style={{ 
              display: 'inline-block',
              width: '20px',
              height: '20px', 
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}