import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  // ローカルストレージやクッキーから言語設定を取得する関数
  // クライアントサイドでは直接ローカルストレージにアクセス
  // サーバーサイドではデフォルト言語を使用
  const locale =
    typeof window !== 'undefined'
      ? localStorage.getItem('locale') || defaultLocale
      : defaultLocale;

  // 有効な言語かチェック
  const validLocale = locales.includes(locale as Locale)
    ? locale
    : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
