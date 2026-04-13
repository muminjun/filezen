'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ExifSection({ enabled, onChange }: Props) {
  const t = useTranslations('editDrawer');

  return (
    <div className="px-5 py-4 border-t border-[#2a2a2c]">
      <p className="mb-3 text-[11px] uppercase tracking-widest text-[#555]">
        {t('exifSection')}
      </p>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
          enabled
            ? 'bg-[#1a3a2a] border border-[#2a5a3a]'
            : 'bg-[#2c2c2e] border border-transparent hover:bg-[#3a3a3c]',
        )}
      >
        <ShieldCheck
          size={16}
          className={enabled ? 'text-[#30d158]' : 'text-[#888]'}
        />
        <div className="flex-1 min-w-0">
          <p className={cn('text-[13px] font-medium', enabled ? 'text-[#30d158]' : 'text-[#ddd]')}>
            {t('exifStrip')}
          </p>
          <p className="mt-0.5 text-[11px] text-[#666] leading-snug">
            {t('exifStripHint')}
          </p>
        </div>
        {/* Toggle pill */}
        <div
          className={cn(
            'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors',
            enabled ? 'bg-[#30d158]' : 'bg-[#3a3a3c]',
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </div>
      </button>
    </div>
  );
}
