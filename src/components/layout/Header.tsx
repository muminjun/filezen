'use client';

import { Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '../LanguageSwitcher';

export function Header() {
  const t = useTranslations('header');

  return (
    <header className="border-b border-muted-foreground/25 bg-muted/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">FileZen</h1>
            <p className="text-xs text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
