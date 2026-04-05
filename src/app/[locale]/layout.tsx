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

  return (
    <NextIntlClientProvider locale={locale}>
      <AppProvider>
        {children}
      </AppProvider>
    </NextIntlClientProvider>
  );
}
