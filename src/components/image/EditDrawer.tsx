'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import ReactCrop, { type Crop, type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { DEFAULT_ADJUSTMENT, buildCssFilter } from '@/lib/colorAdjustment';
import { CropSection } from './editor/CropSection';
import { AdjustSection } from './editor/AdjustSection';
import type { ColorAdjustment, CropData } from '@/lib/types';

const DEFAULT_CROP: CropData = {
  x: 0, y: 0, width: 1, height: 1,
  rotation: 0,
  aspectRatio: null,
};

const ASPECT_MAP: Record<string, number> = {
  '1:1': 1,
  '3:4': 3 / 4,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
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

  const [initialAdj]  = useState<ColorAdjustment>(() => ({ ...DEFAULT_ADJUSTMENT, ...(previewImage?.colorAdjustment ?? {}) }));
  const [initialCrop] = useState<CropData>(() => previewImage?.cropData ?? { ...DEFAULT_CROP });

  const [adjustment, setAdjustment] = useState<ColorAdjustment>({ ...initialAdj });
  const [cropData,   setCropData]   = useState<CropData>({ ...initialCrop });
  const [crop,       setCrop]       = useState<Crop>({
    unit: '%',
    x: initialCrop.x * 100,
    y: initialCrop.y * 100,
    width: initialCrop.width * 100,
    height: initialCrop.height * 100,
  });
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const imgRef     = useRef<HTMLImageElement>(null);

  const hasChanges = useCallback((): boolean => {
    const adjChanged = (Object.keys(adjustment) as (keyof ColorAdjustment)[])
      .some((k) => adjustment[k] !== (initialAdj[k] ?? 0));
    const cropChanged =
      cropData.x !== initialCrop.x ||
      cropData.y !== initialCrop.y ||
      cropData.width !== initialCrop.width ||
      cropData.height !== initialCrop.height ||
      cropData.aspectRatio !== initialCrop.aspectRatio;
    return adjChanged || cropChanged;
  }, [adjustment, cropData, initialAdj, initialCrop]);

  const handleXClick = useCallback(() => {
    if (hasChanges()) {
      setShowDiscardModal(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  const handleDiscard = useCallback(() => {
    setAdjustment({ ...initialAdj });
    setCropData({ ...initialCrop });
    setCrop({
      unit: '%',
      x: initialCrop.x * 100,
      y: initialCrop.y * 100,
      width: initialCrop.width * 100,
      height: initialCrop.height * 100,
    });
    setShowDiscardModal(false);
    onClose();
  }, [initialAdj, initialCrop, onClose]);

  const handleApply = useCallback(() => {
    applyEditToSelected({ colorAdjustment: adjustment, cropData });
    onClose();
  }, [adjustment, cropData, applyEditToSelected, onClose]);

  const handleApplyToThis = useCallback(() => {
    applyEditToSelected({ colorAdjustment: adjustment, cropData });
    onClose();
  }, [adjustment, cropData, applyEditToSelected, onClose]);

  const handleCropSectionChange = useCallback((data: Partial<CropData>) => {
    setCropData((prev) => ({ ...prev, ...data }));
    if (data.aspectRatio !== undefined) {
      const newAspect = data.aspectRatio ? ASPECT_MAP[data.aspectRatio] : undefined;
      if (newAspect && imgRef.current) {
        const { width: iw, height: ih } = imgRef.current;
        // widthPct / heightPct = newAspect * ih / iw (rendered pixel ratio)
        const ratio = newAspect * ih / iw;
        let cropW: number, cropH: number;
        if (ratio * 80 <= 100) {
          cropH = 80;
          cropW = ratio * cropH;
        } else {
          cropW = 80;
          cropH = cropW / ratio;
        }
        setCrop({
          unit: '%',
          x: (100 - cropW) / 2,
          y: (100 - cropH) / 2,
          width: cropW,
          height: cropH,
        });
      } else {
        setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
      }
    }
  }, []);

  const handleReactCropChange = useCallback((_: Crop, pct: PercentCrop) => {
    setCrop(pct);
    setCropData((prev) => ({
      ...prev,
      x: pct.x / 100,
      y: pct.y / 100,
      width: pct.width / 100,
      height: pct.height / 100,
    }));
  }, []);

  const handleHandleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    if (e.touches[0].clientY - dragStartY.current > 80) {
      dragStartY.current = null;
      if (hasChanges()) {
        setShowDiscardModal(true);
      } else {
        onClose();
      }
    }
  }, [hasChanges, onClose]);

  const handleHandleTouchEnd = useCallback(() => {
    dragStartY.current = null;
  }, []);

  if (!previewImage) return null;

  const cssFilter = buildCssFilter(adjustment);
  const aspect = cropData.aspectRatio ? ASPECT_MAP[cropData.aspectRatio] : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={handleXClick}
      />

      {/* Drawer — desktop: right panel, mobile: bottom sheet */}
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-[#1c1c1e]',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          // Desktop layout
          'bottom-0 right-0 top-0 border-l border-[#2a2a2c]',
          'shadow-[-20px_0_60px_rgba(0,0,0,0.7)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          // Mobile overrides
          'max-[680px]:!left-0 max-[680px]:!right-0 max-[680px]:!top-auto',
          'max-[680px]:!h-[78vh] max-[680px]:!w-full',
          'max-[680px]:!rounded-t-[16px]',
          'max-[680px]:!border-l-0 max-[680px]:!border-t max-[680px]:!border-[#2a2a2c]',
          'max-[680px]:!translate-x-0',
          isOpen ? 'max-[680px]:!translate-y-0' : 'max-[680px]:!translate-y-full',
        )}
        style={{ width: 'clamp(380px, 45vw, 560px)' }}
      >
        {/* Mobile drag handle */}
        <div
          className="hidden max-[680px]:flex justify-center pt-2.5 pb-1 touch-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-[#3a3a3c]" />
        </div>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center border-b border-[#2a2a2c] px-5 py-3.5">
          <button
            onClick={handleXClick}
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
                  style={{
                    transform: [
                      img.rotation ? `rotate(${img.rotation}deg)` : '',
                      img.flipped ? 'scaleX(-1)' : '',
                    ].filter(Boolean).join(' ') || undefined,
                  }}
                />
              </div>
            ))}
            {selectedImages.length > 6 && (
              <span className="text-[11px] text-[#555]">+{selectedImages.length - 6}</span>
            )}
          </div>
        )}

        {/* Preview area — ReactCrop with color filter */}
        <div className="flex h-[44vh] flex-shrink-0 items-center justify-center overflow-hidden bg-black max-[680px]:h-[30vh]">
          <ReactCrop
            crop={crop}
            onChange={handleReactCropChange}
            aspect={aspect}
            className="max-h-full max-w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={previewImage.previewUrl}
              alt="preview"
              style={{
                filter: cssFilter || undefined,
                transform: (() => {
                  const totalRot = ((previewImage.rotation + (cropData.rotation ?? 0)) % 360 + 360) % 360;
                  const parts = [
                    totalRot ? `rotate(${totalRot}deg)` : '',
                    previewImage.flipped ? 'scaleX(-1)' : '',
                  ].filter(Boolean);
                  return parts.length ? parts.join(' ') : undefined;
                })(),
              }}
              className="max-h-[44vh] max-w-full object-contain max-[680px]:max-h-[30vh]"
            />
          </ReactCrop>
        </div>

        {/* Single scroll: RatioPresets → Divider → AdjustSection */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a3a3c transparent' }}
        >
          <CropSection
            cropData={cropData}
            onChange={handleCropSectionChange}
            onRotate={() => setCropData((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
          />

          {/* Section divider */}
          <div className="flex items-center gap-2 border-y border-[#2a2a2c] bg-[#161618] px-5 py-2">
            <div className="h-px flex-1 bg-[#2a2a2c]" />
            <span className="text-[10px] uppercase tracking-widest text-[#444]">
              {t('adjustSection')}
            </span>
            <div className="h-px flex-1 bg-[#2a2a2c]" />
          </div>

          <AdjustSection
            adjustment={adjustment}
            onChange={setAdjustment}
            savedAdjustments={savedAdjustments}
            recentAdjustments={recentAdjustments}
            onSavePreset={(name) => saveAdjustment(name, adjustment)}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 gap-2.5 border-t border-[#2a2a2c] bg-[#1c1c1e] px-5 py-3">
          <button
            onClick={handleApplyToThis}
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

      {/* Discard changes modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="w-[270px] overflow-hidden rounded-[14px] bg-[#2c2c2e]">
            <div className="px-4 py-5 text-center">
              <p className="mb-1 text-[17px] font-semibold text-white">
                {t('discardTitle')}
              </p>
              <p className="text-[13px] text-[#aaa]">{t('discardMessage')}</p>
            </div>
            <div className="flex flex-col border-t border-[#3a3a3c]">
              <button
                onClick={handleDiscard}
                className="border-b border-[#3a3a3c] py-3.5 text-[17px] font-semibold text-[#ff453a] transition-colors hover:bg-[#3a3a3c]"
              >
                {t('discardConfirm')}
              </button>
              <button
                onClick={() => setShowDiscardModal(false)}
                className="py-3.5 text-[17px] text-[#0a84ff] transition-colors hover:bg-[#3a3a3c]"
              >
                {t('discardCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
