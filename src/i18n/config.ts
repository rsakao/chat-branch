export const locales = ['ja', 'en'] as const;
export const defaultLocale = 'ja' as const;

export type Locale = (typeof locales)[number];

export const localeConfig = {
  ja: {
    name: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
  },
} as const;
