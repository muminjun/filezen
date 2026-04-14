'use client';

import { useTranslations } from 'next-intl';
import { ImageIcon, FolderIcon, LayoutGridIcon, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useUIContext } from '@/context/UIContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { useGlobalDrop } from '@/hooks/useGlobalDrop';
import { DropOverlay } from '@/components/layout/DropOverlay';

type Tab = 'image' | 'file' | 'collage' | 'convert';

interface DrawerLayoutProps {
  imageTab: React.ReactNode;
  fileTab: React.ReactNode;
  collageTab: React.ReactNode;
  convertTab: React.ReactNode;
}

export function DrawerLayout({ imageTab, fileTab, collageTab, convertTab }: DrawerLayoutProps) {
  const { activeTab, setActiveTab } = useUIContext();
  const t = useTranslations('drawer');
  const tc = useTranslations('collage');
  const locale = useLocale();
  useUndoRedo();
  useClipboardPaste();
  const { isDragging, fileType } = useGlobalDrop();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center border-r border-border bg-card py-4 gap-2">
        <Link
          href={`/${locale}`}
          className="mb-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary transition-transform hover:scale-105 active:scale-95"
        >
          <img src="/logo.svg" alt="FileZen" className="h-6 w-6" />
        </Link>

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
        <DrawerItem
          icon={<LayoutGridIcon size={20} />}
          label={tc('tab')}
          active={activeTab === 'collage'}
          onClick={() => setActiveTab('collage')}
        />
        <DrawerItem
          icon={<Wand2 size={20} />}
          label={t('convert')}
          active={activeTab === 'convert'}
          onClick={() => setActiveTab('convert')}
        />

        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top-right controls (desktop only) */}
        <div className="hidden sm:flex absolute top-4 right-6 z-50 items-center gap-2">
          <LanguageSwitcher />
        </div>

        {/* Mobile top bar */}
        <div className="sm:hidden flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <img src="/logo.svg" alt="FileZen" className="h-6 w-6" />
            <span className="text-sm font-bold tracking-tight">FileZen</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab === 'image' && imageTab}
          {activeTab === 'file' && fileTab}
          {activeTab === 'collage' && collageTab}
          {activeTab === 'convert' && convertTab}
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="sm:hidden flex flex-shrink-0 items-center justify-around border-t border-border bg-card px-2 pb-safe">
          <MobileNavItem
            icon={<ImageIcon size={22} />}
            label={t('images')}
            active={activeTab === 'image'}
            onClick={() => setActiveTab('image')}
          />
          <MobileNavItem
            icon={<FolderIcon size={22} />}
            label={t('files')}
            active={activeTab === 'file'}
            onClick={() => setActiveTab('file')}
          />
          <MobileNavItem
            icon={<LayoutGridIcon size={22} />}
            label={tc('tab')}
            active={activeTab === 'collage'}
            onClick={() => setActiveTab('collage')}
          />
          <MobileNavItem
            icon={<Wand2 size={22} />}
            label={t('convert')}
            active={activeTab === 'convert'}
            onClick={() => setActiveTab('convert')}
          />
        </nav>
      </main>
      <DropOverlay visible={isDragging} fileType={fileType} />
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
        'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
