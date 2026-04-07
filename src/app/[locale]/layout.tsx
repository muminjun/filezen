import { AppProvider } from '@/context/AppContext';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ko: '/ko',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://filezen.app/${locale}`, // Placeholder URL
      siteName: 'FileZen',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Dynamically import messages based on locale
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    messages = (await import('@/messages/en.json')).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProvider>
        {children}
      </AppProvider>
    </NextIntlClientProvider>
  );
}
