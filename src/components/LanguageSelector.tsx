'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '../hooks/useLocale';
import { localeConfig, Locale } from '../i18n/config';

interface LanguageSelectorProps {
  value: Locale;
  onChange: (locale: Locale) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const t = useTranslations('settings');
  const { availableLocales } = useLocale();

  return (
    <div className="form-group">
      <label className="form-label">{t('language')}</label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="form-control"
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