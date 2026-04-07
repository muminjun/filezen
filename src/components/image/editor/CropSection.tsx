'use client';

import { useTranslations } from 'next-intl';
import { RotateCw, FlipHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CropData } from '@/lib/types';

const ASPECT_RATIOS: Array<{ label: string; value: string | null; w: number; h: number }> = [
  { label: 'aspectFree', value: null,   w: 20, h: 20 },
  { label: '1:1',        value: '1:1',  w: 20, h: 20 },
  { label: '4:3',        value: '4:3',  w: 24, h: 18 },
  { label: '3:4',        value: '3:4',  w: 18, h: 24 },
  { label: '16:9',       value: '16:9', w: 28, h: 16 },
  { label: '9:16',       value: '9:16', w: 16, h: 28 },
];

interface Props {
  cropData:    CropData;
  onChange:    (data: Partial<CropData>) => void;
  previewUrl:  string;
}

export function CropSection({ cropData, onChange, previewUrl }: Props) {
  const t = useTranslations('editDrawer');

  const cropStyle: React.CSSProperties = {
    transform: `rotate(${cropData.rotation}deg)`,
    backgroundImage: `url(${previewUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: `${-cropData.x * 100}% ${-cropData.y * 100}%`,
  };

  return (
    <div className="flex flex-col">
      {/* 이미지 + 크롭 오버레이 */}
      <div className="flex items-center justify-center bg-black px-5 py-5">
        <div className="relative" style={{ width: 260, height: 195 }}>
          <div className="absolute inset-0 rounded-sm" style={cropStyle} />
          {/* 3×3 그리드 */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/20" />
            ))}
          </div>
          {/* 크롭 경계선 */}
          <div className="pointer-events-none absolute inset-0 border border-white/80" />
          {/* 모서리 핸들 */}
          {(['tl','tr','bl','br'] as const).map((pos) => (
            <div
              key={pos}
              className={cn(
                'absolute h-5 w-5 border-white border-solid',
                pos === 'tl' && '-left-px -top-px border-l-[3px] border-t-[3px]',
                pos === 'tr' && '-right-px -top-px border-r-[3px] border-t-[3px]',
                pos === 'bl' && '-bottom-px -left-px border-b-[3px] border-l-[3px]',
                pos === 'br' && '-bottom-px -right-px border-b-[3px] border-r-[3px]',
              )}
            />
          ))}
        </div>
      </div>

      {/* 각도 룰러 */}
      <div className="bg-black px-5 pb-3 pt-1">
        <p className="mb-1 text-center text-[11px] text-[#0a84ff]">
          {cropData.rotation === 0 ? '0°' : `${cropData.rotation > 0 ? '+' : ''}${cropData.rotation}°`}
          <span className="ml-1.5 text-[#3a3a3c]">{t('cropSection')}</span>
        </p>
        <input
          type="range"
          min="-45"
          max="45"
          value={cropData.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full cursor-pointer accent-[#0a84ff]"
          style={{ height: 3 }}
        />
        <div className="mt-1 flex justify-between text-[9px] text-[#444]">
          <span>-45°</span><span>-30°</span><span>-15°</span>
          <span className="text-[#0a84ff]">0°</span>
          <span>15°</span><span>30°</span><span>45°</span>
        </div>
      </div>

      {/* 크롭 버튼 + 비율 */}
      <div className="flex items-center justify-between border-t border-[#1a1a1c] bg-black px-5 py-2.5">
        {/* 회전/반전/초기화 */}
        <div className="flex gap-1.5">
          {[
            { icon: <RotateCw size={14} />, label: t('rotate90'),  action: () => onChange({ rotation: ((cropData.rotation + 90) % 360) as number }) },
            { icon: <FlipHorizontal size={14} />, label: t('flipH'), action: () => {} },
            { icon: <RotateCcw size={14} />, label: t('reset'),    action: () => onChange({ rotation: 0, x: 0, y: 0, width: 1, height: 1, aspectRatio: null }) },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2c2c2e] text-white transition-colors hover:bg-[#3a3a3c]">
                {icon}
              </div>
              <span className="text-[9px] text-[#666]">{label}</span>
            </button>
          ))}
        </div>

        {/* 비율 프리셋 */}
        <div className="flex items-end gap-1.5">
          {ASPECT_RATIOS.map(({ label, value, w, h }) => (
            <button
              key={label}
              onClick={() => onChange({ aspectRatio: value })}
              className={cn(
                'flex flex-col items-center gap-1 cursor-pointer transition-opacity',
                cropData.aspectRatio === value ? 'opacity-100' : 'opacity-40'
              )}
            >
              <div
                className={cn(
                  'border-[1.5px] rounded-[2px]',
                  cropData.aspectRatio === value ? 'border-[#0a84ff]' : 'border-[#777]'
                )}
                style={{ width: w, height: h }}
              />
              <span className={cn(
                'text-[9px]',
                cropData.aspectRatio === value ? 'text-[#0a84ff]' : 'text-[#777]'
              )}>
                {value ?? t('aspectFree')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
