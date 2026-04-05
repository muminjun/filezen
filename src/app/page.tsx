'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 브라우저 언어 감지
    const browserLanguage = navigator.language.split('-')[0].toLowerCase();
    const supportedLocales = ['en', 'ko'];
    const locale = supportedLocales.includes(browserLanguage) ? browserLanguage : 'en';

    // 감지된 언어로 리다이렉트
    router.push(`/${locale}`);
  }, [router]);

  return null;
}
