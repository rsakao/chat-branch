'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { useLocale } from '../hooks/useLocale';

interface LocaleProviderProps {
  children: ReactNode;
}

export default function LocaleProvider({ children }: LocaleProviderProps) {
  const { locale, isLoading } = useLocale();
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const messagesModule = await import(`../i18n/messages/${locale}.json`);
        setMessages(messagesModule.default);
      } catch (error) {
        console.error('Failed to load messages:', error);
        // フォールバック: 日本語メッセージを読み込み
        const fallbackModule = await import('../i18n/messages/ja.json');
        setMessages(fallbackModule.default);
      }
    }

    if (!isLoading) {
      loadMessages();
    }
  }, [locale, isLoading]);

  if (isLoading || !messages) {
    return <div>Loading...</div>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}