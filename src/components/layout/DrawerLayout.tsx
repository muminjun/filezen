'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImageIcon, FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type Tab = 'image' | 'file';

interface DrawerLayoutProps {
  imageTab: React.ReactNode;
  fileTab: React.ReactNode;
}

export function DrawerLayout({ imageTab, fileTab }: DrawerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const t = useTranslations('drawer');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Drawer */}
      <aside className="flex w-14 flex-shrink-0 flex-col items-center border-r border-border bg-card py-4 gap-2">
        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <img src="/logo.svg" alt="FileZen" className="h-6 w-6" />
        </div>

        <DrawerItem
          icon={<ImageIcon size={20} />}
          label={t('images')}
          active={activeTab === 'image'}
          onClick={() => setActiveTab('image')}
        />
        <DrawerItem
          icon={<FolderIcon size={20} />}
          label={t('files')}
          active={activeTab === 'file'}
          onClick={() => setActiveTab('file')}
        />

        <div className="mt-auto flex flex-col items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'image' ? imageTab : fileTab}
      </main>
    </div>
  );
}

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function DrawerItem({ icon, label, active, onClick }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
    </button>
  );
}
