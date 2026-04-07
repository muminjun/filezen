'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { DEFAULT_ADJUSTMENT } from '@/lib/colorAdjustment';
import { CropSection } from './editor/CropSection';
import { AdjustSection } from './editor/AdjustSection';
import type { ColorAdjustment, CropData } from '@/lib/types';

const DEFAULT_CROP: CropData = {
  x: 0, y: 0, width: 1, height: 1,
  rotation: 0,
  aspectRatio: null,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EditDrawer({ isOpen, onClose }: Props) {
  const t = useTranslations('editDrawer');
  const {
    images,
    selectedIds,
    savedAdjustments,
    recentAdjustments,
    applyEditToSelected,
    saveAdjustment,
  } = useAppContext();

  const selectedImages = images.filter((img) => selectedIds.has(img.id));
  const previewImage   = selectedImages[0];

  const [adjustment, setAdjustment] = useState<ColorAdjustment>(
    previewImage?.colorAdjustment ?? { ...DEFAULT_ADJUSTMENT }
  );
  const [cropData, setCropData] = useState<CropData>(
    previewImage?.cropData ?? { ...DEFAULT_CROP }
  );

  const handleCropChange = useCallback((data: Partial<CropData>) => {
    setCropData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleAdjustChange = useCallback((adj: ColorAdjustment) => {
    setAdjustment(adj);
  }, []);

  const handleApply = useCallback(() => {
    applyEditToSelected({ colorAdjustment: adjustment, cropData });
    onClose();
  }, [adjustment, cropData, applyEditToSelected, onClose]);

  if (!previewImage) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 right-0 top-0 z-50 flex w-[380px] flex-col',
          'border-l border-[#2a2a2c] bg-[#1c1c1e]',
          'shadow-[-20px_0_60px_rgba(0,0,0,0.7)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center border-b border-[#2a2a2c] px-5 py-3.5">
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2c2c2e] text-[#aaa] transition-colors hover:bg-[#3a3a3c]"
          >
            <X size={14} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[15px] font-semibold text-white">{t('title')}</p>
            <p className="text-[11px] text-[#f5a623]">
              {selectedIds.size > 1
                ? t('bulkLabel', { count: selectedIds.size })
                : t('singleLabel')}
            </p>
          </div>
          <button
            onClick={handleApply}
            className="text-[15px] font-semibold text-[#0a84ff]"
          >
            {t('done')}
          </button>
        </div>

        {/* Bulk thumbnail strip */}
        {selectedImages.length > 1 && (
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#2a2a2c] bg-[#1a1a1c] px-5 py-2.5">
            <span className="text-[11px] text-[#555]">대상</span>
            {selectedImages.slice(0, 6).map((img) => (
              <div
                key={img.id}
                className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border-2 border-transparent first:border-[#0a84ff]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {selectedImages.length > 6 && (
              <span className="text-[11px] text-[#555]">+{selectedImages.length - 6}</span>
            )}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a3a3c transparent' }}>
          <CropSection
            cropData={cropData}
            onChange={handleCropChange}
            previewUrl={previewImage.previewUrl}
          />

          {/* 섹션 구분선 */}
          <div className="flex items-center gap-2 bg-[#1c1c1e] px-5 py-2">
            <div className="h-px flex-1 bg-[#2a2a2c]" />
            <span className="text-[10px] uppercase tracking-widest text-[#444]">
              {t('adjustSection')}
            </span>
            <div className="h-px flex-1 bg-[#2a2a2c]" />
          </div>

          <AdjustSection
            adjustment={adjustment}
            onChange={handleAdjustChange}
            previewUrl={previewImage.previewUrl}
            savedAdjustments={savedAdjustments}
            recentAdjustments={recentAdjustments}
            onSavePreset={(name) => saveAdjustment(name, adjustment)}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 gap-2.5 border-t border-[#2a2a2c] bg-[#1c1c1e] px-5 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[10px] bg-[#2c2c2e] py-3 text-[13px] font-semibold text-[#ddd] transition-opacity active:opacity-75"
          >
            {t('applyToThis')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-[10px] bg-[#0a84ff] py-3 text-[13px] font-semibold text-white transition-opacity active:opacity-75"
          >
            {t('applyToAll', { count: selectedIds.size })}
          </button>
        </div>
      </div>
    </>
  );
}
