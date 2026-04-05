import { AppProvider } from '@/context/AppContext';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

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
