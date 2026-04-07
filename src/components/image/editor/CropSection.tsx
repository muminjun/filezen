'use client';

import { useTranslations } from 'next-intl';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CropData } from '@/lib/types';

const ASPECT_RATIOS: Array<{ label: string; value: string | null; w: number; h: number }> = [
  { label: 'aspectFree', value: null,   w: 20, h: 20 },
  { label: '1:1',        value: '1:1',  w: 20, h: 20 },
  { label: '3:4',        value: '3:4',  w: 18, h: 24 },
  { label: '4:3',        value: '4:3',  w: 24, h: 18 },
  { label: '16:9',       value: '16:9', w: 28, h: 16 },
  { label: '9:16',       value: '9:16', w: 16, h: 28 },
];

interface Props {
  cropData:  CropData;
  onChange:  (data: Partial<CropData>) => void;
  onRotate:  () => void;
}

export function CropSection({ cropData, onChange, onRotate }: Props) {
  const t = useTranslations('editDrawer');

  return (
    <div className="flex items-end justify-between bg-[#1c1c1e] px-5 py-3">
      {ASPECT_RATIOS.map(({ label, value, w, h }) => {
        const isActive = cropData.aspectRatio === value;
        return (
          <button
            key={label}
            onClick={() => onChange({ aspectRatio: value })}
            className={cn(
              'flex flex-col items-center gap-1.5 cursor-pointer transition-opacity',
              isActive ? 'opacity-100' : 'opacity-40 hover:opacity-60'
            )}
          >
            <div
              className={cn(
                'border-[1.5px] rounded-[2px]',
                isActive ? 'border-[#0a84ff]' : 'border-[#777]'
              )}
              style={{ width: w, height: h }}
            />
            <span className={cn(
              'text-[10px]',
              isActive ? 'text-[#0a84ff] font-semibold' : 'text-[#777]'
            )}>
              {value ?? t('aspectFree')}
            </span>
          </button>
        );
      })}

      {/* 90° 회전 버튼 */}
      <button
        onClick={onRotate}
        title={t('rotate90')}
        className="flex flex-shrink-0 flex-col items-center gap-1.5 cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
      >
        <RotateCw size={16} className="text-[#777]" />
        <span className="text-[10px] text-[#777]">{t('rotate90')}</span>
      </button>
    </div>
  );
}
