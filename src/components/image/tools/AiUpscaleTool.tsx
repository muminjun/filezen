'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { upscaleImage } from '@/lib/aiUpscale';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function AiUpscaleTool({ onClose }: Props) {
  const t = useTranslations('aiUpscale');
  const { images, selectedIds, replaceImageBlob } = useAppContext();
  const [scale,    setScale]    = useState<2 | 4>(2);
  const [status,   setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  const handleStart = useCallback(async () => {
    if (selectedImages.length === 0) return;
    setStatus('loading');
    setProgress(0);
    setErrorMsg('');

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        setCurrent(i + 1);
        const img = selectedImages[i];
        const blob = await upscaleImage(img.file, scale, (pct) => {
          const base = (i / selectedImages.length) * 100;
          const step = (1 / selectedImages.length) * 100;
          setProgress(Math.round(base + (pct / 100) * step));
        });
        const suffix = scale === 2 ? '-2x' : '-4x';
        const newName = img.file.name.replace(/\.[^.]+$/, `${suffix}.png`);
        replaceImageBlob(img.id, blob, newName);
      }
      setStatus('done');
    } catch (err) {
      console.error('AI upscale failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, replaceImageBlob, scale]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[320px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('title')}</h2>
        </div>

        <p className="mb-4 text-[12px] text-[#888] leading-relaxed">{t('hint')}</p>

        {status === 'idle' && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] text-[#888]">{t('scale')}</p>
            <div className="flex gap-2">
              {([2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-[13px] font-semibold transition-colors',
                    scale === s
                      ? 'bg-[#0a84ff] text-white'
                      : 'bg-[#2c2c2e] text-[#aaa] hover:bg-[#3a3a3c]',
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#aaa]">{selectedImages.length}장 선택됨</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#888]">
              <span>{progress < 5 ? t('loading') : t('processing', { current, total: selectedImages.length })}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#3a3a3c]">
              <div
                className="h-full rounded-full bg-[#0a84ff] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <p className="mb-4 text-[12px] text-[#30d158]">{t('done')}</p>
        )}

        {status === 'error' && (
          <p className="mb-4 text-[12px] text-[#ff453a] break-words">오류: {errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            {t('close')}
          </button>
          {status === 'idle' && (
            <button
              onClick={handleStart}
              disabled={selectedImages.length === 0}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                selectedImages.length > 0
                  ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
                  : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
              )}
            >
              {t('start')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
