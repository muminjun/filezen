'use client';

import { useTranslations } from 'next-intl';
import { RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';

const ROTATION_OPTIONS: Array<{ degrees: 90 | 180 | 270 | 360; label: string }> = [
  { degrees: 90, label: '90°' },
  { degrees: 180, label: '180°' },
  { degrees: 270, label: '270°' },
  { degrees: 360, label: '↺' },
];

export function RotationToolbar() {
  const t = useTranslations('gallery');
  const { selectedFileIds, rotateSelectedFiles } = useAppContext();

  if (selectedFileIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-primary font-medium">
        <RotateCw className="h-4 w-4" />
        <span>{t('rotateSelected', { count: selectedFileIds.length })}</span>
      </div>

      <div className="flex gap-1">
        {ROTATION_OPTIONS.map(({ degrees, label }) => (
          <Button
            key={degrees}
            variant={degrees === 360 ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => rotateSelectedFiles(degrees)}
            title={
              degrees === 360
                ? t('rotationReset')
                : t('rotationApply', { degrees })
            }
          >
            {label}
          </Button>
        ))}
      </div>

      <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
        {t('rotationHint')}
      </span>
    </div>
  );
}
