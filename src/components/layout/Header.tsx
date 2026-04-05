'use client';

import { Image as ImageIcon, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const t = useTranslations('header');

  return (
    <header className="border-b border-muted-foreground/25 bg-muted/50 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">FileZen</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{t('description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
