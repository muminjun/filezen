'use client';

import { useTranslations } from 'next-intl';
import { FolderOpen } from 'lucide-react';

export function FilePage() {
  const t = useTranslations('filePage');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <FolderOpen size={48} className="text-muted-foreground/40" />
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('comingSoon')}</p>
      </div>
    </div>
  );
}
