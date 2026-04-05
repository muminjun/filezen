import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale) {
    locale = defaultLocale;
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    return { locale, messages };
  } catch (error) {
    const messages = (await import('./messages/en.json')).default;
    return { locale: 'en', messages };
  }
});
