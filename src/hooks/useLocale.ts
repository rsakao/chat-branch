import { useState, useEffect } from 'react';
import { Locale, defaultLocale, locales } from '../i18n/config';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // クライアントサイドでのみローカルストレージから読み込み
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setLocaleState(savedLocale);
      }
      setIsLoading(false);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      // ページをリロードして言語変更を反映
      window.location.reload();
    }
  };

  return {
    locale,
    setLocale,
    isLoading,
    availableLocales: locales,
  };
}