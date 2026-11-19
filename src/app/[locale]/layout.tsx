import { AppProvider } from '@/context/AppContext';
import { FileProvider } from '@/context/FileContext';
import { UIProvider } from '@/context/UIContext';
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/ui/Toast';
import { ConvertProvider } from '@/context/ConvertContext';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { SITE_URL } from '@/lib/site';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}/${locale}/`,
      languages: {
        'en': `${SITE_URL}/en/`,
        'ko': `${SITE_URL}/ko/`,
        'x-default': `${SITE_URL}/en/`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/`,
      siteName: 'FileZen',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og.png`,
          width: 1200,
          height: 630,
          alt: 'FileZen — All-in-One File Toolkit',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [`${SITE_URL}/og.png`],
    },
    icons: {
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo.svg`,
      apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo.svg`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
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
  setRequestLocale(locale);

  // Dynamically import messages based on locale
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    messages = (await import('@/messages/en.json')).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <UIProvider>
        <AppProvider>
          <FileProvider>
            <ConvertProvider>
              <ToastProvider>
                {children}
                <ToastContainer />
              </ToastProvider>
            </ConvertProvider>
          </FileProvider>
        </AppProvider>
      </UIProvider>
    </NextIntlClientProvider>
  );
}
