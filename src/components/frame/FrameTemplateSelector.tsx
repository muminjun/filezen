'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FrameTemplate } from '@/lib/frameTemplates';

interface Props {
  templates: FrameTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const CATEGORIES: Array<'photobooth' | 'social'> = ['photobooth', 'social'];

export function FrameTemplateSelector({ templates, selectedId, onSelect }: Props) {
  const t = useTranslations('frame');

  return (
    <div className="flex flex-shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 no-scrollbar">
      {CATEGORIES.map((cat, ci) => (
        <div
          key={cat}
          className={cn(
            'flex items-center gap-1',
            ci > 0 && 'ml-2 border-l border-border pl-2',
          )}
        >
          <span className="mr-1 whitespace-nowrap text-xs text-muted-foreground">
            {t(`categories.${cat}`)}
          </span>
          {templates
            .filter((tmpl) => tmpl.category === cat)
            .map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => onSelect(tmpl.id)}
                className={cn(
                  'flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  selectedId === tmpl.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t(`templates.${tmpl.id}`)}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
