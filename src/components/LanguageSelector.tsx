'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '../hooks/useLocale';
import { localeConfig, Locale } from '../i18n/config';

export default function LanguageSelector() {
  const t = useTranslations('settings');
  const { locale, setLocale, availableLocales } = useLocale();

  return (
    <div className="language-selector">
      <label
        htmlFor="language-select"
        className="block text-sm font-medium mb-2"
      >
        {t('language')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {availableLocales.map((loc) => (
          <option key={loc} value={loc}>
            {localeConfig[loc].flag} {localeConfig[loc].name}
          </option>
        ))}
      </select>
    </div>
  );
}
