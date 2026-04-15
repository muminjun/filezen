// src/components/image/tools/BgReplaceTool.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { replaceBackground, BgReplaceMode } from '@/lib/bgReplace';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function BgReplaceTool({ onClose }: Props) {
  const t = useTranslations('bgReplace');
  const { images, selectedIds, replaceImageBlob } = useAppContext();

  const [mode,          setMode]          = useState<BgReplaceMode>('color');
  const [color1,        setColor1]        = useState('#ffffff');
  const [color2,        setColor2]        = useState('#000000');
  const [gradientAngle, setGradientAngle] = useState(90);
  const [bgImageFile,   setBgImageFile]   = useState<File | undefined>();
  const [status,        setStatus]        = useState<Status>('idle');
  const [progress,      setProgress]      = useState(0);
  const [errorMsg,      setErrorMsg]      = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  const handleStart = useCallback(async () => {
    if (selectedImages.length === 0) return;
    setStatus('loading');
    setProgress(0);
    setErrorMsg('');

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        const blob = await replaceBackground(
          img.file,
          { mode, color1, color2, gradientAngle, bgImageFile },
          (pct) => {
            const base = (i / selectedImages.length) * 100;
            const step = (1 / selectedImages.length) * 100;
            setProgress(Math.round(base + (pct / 100) * step));
          },
        );
        const newName = img.file.name.replace(/\.[^.]+$/, '-bgreplaced.png');
        replaceImageBlob(img.id, blob, newName);
      }
      setStatus('done');
    } catch (err) {
      console.error('BG replace failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, replaceImageBlob, mode, color1, color2, gradientAngle, bgImageFile]);

  const MODES: BgReplaceMode[] = ['color', 'gradient', 'image'];
  const MODE_LABELS: Record<BgReplaceMode, string> = {
    color:    t('modeColor'),
    gradient: t('modeGradient'),
    image:    t('modeImage'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[340px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('title')}</h2>
        </div>

        <p className="mb-4 text-[12px] text-[#888] leading-relaxed">{t('hint')}</p>

        {status === 'idle' && (
          <>
            <div className="mb-4 flex gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors',
                    mode === m
                      ? 'bg-[#0a84ff] text-white'
                      : 'bg-[#2c2c2e] text-[#aaa] hover:bg-[#3a3a3c]',
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {mode === 'color' && (
              <div className="mb-4 flex items-center gap-3">
                <label className="text-[12px] text-[#aaa]">{t('color1')}</label>
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
                />
              </div>
            )}

            {mode === 'gradient' && (
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <label className="w-16 text-[12px] text-[#aaa]">{t('color1')}</label>
                  <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-[12px] text-[#aaa]">{t('color2')}</label>
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-[12px] text-[#aaa]">{t('gradientAngle')}</label>
                  <input type="range" min={0} max={360} value={gradientAngle}
                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                    className="flex-1 accent-[#0a84ff]" />
                  <span className="w-10 text-right text-[12px] text-[#aaa]">{gradientAngle}°</span>
                </div>
              </div>
            )}

            {mode === 'image' && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBgImageFile(e.target.files?.[0])}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl bg-[#2c2c2e] py-2 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
                >
                  {bgImageFile ? bgImageFile.name : t('uploadBg')}
                </button>
              </div>
            )}

            <p className="mb-4 text-[11px] text-[#aaa]">{selectedImages.length}장 선택됨</p>
          </>
        )}

        {status === 'loading' && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#888]">
              <span>{progress < 10 ? t('removing') : t('compositing')}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#3a3a3c]">
              <div className="h-full rounded-full bg-[#0a84ff] transition-all" style={{ width: `${progress}%` }} />
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
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors">
            {t('close')}
          </button>
          {status === 'idle' && (
            <button
              onClick={handleStart}
              disabled={selectedImages.length === 0 || (mode === 'image' && !bgImageFile)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                selectedImages.length > 0 && (mode !== 'image' || bgImageFile)
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
