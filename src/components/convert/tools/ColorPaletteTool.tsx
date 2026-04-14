'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import {
  extractPalette,
  toCssVars,
  toJson,
  type PaletteColor,
} from '@/lib/colorPalette';

type ColorFormat = 'hex' | 'rgb' | 'hsl';

function formatColor(color: PaletteColor, format: ColorFormat): string {
  if (format === 'hex') return color.hex;
  if (format === 'rgb') return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
  return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
}

const IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export function ColorPaletteTool() {
  const t = useTranslations('convert.palette');
  const tUpload = useTranslations('convert.upload');

  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(8);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedBulk, setCopiedBulk] = useState<'json' | 'css' | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    if (files[0]) {
      setFile(files[0]);
      setPalette([]);
    }
  }, []);

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    setPalette([]);
    try {
      const result = await extractPalette(file, count);
      setPalette(result);
    } finally {
      setIsExtracting(false);
    }
  };

  const copyColor = async (color: PaletteColor, idx: number) => {
    await navigator.clipboard.writeText(formatColor(color, format));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyBulk = async (type: 'json' | 'css') => {
    const text = type === 'json' ? toJson(palette) : toCssVars(palette);
    await navigator.clipboard.writeText(text);
    setCopiedBulk(type);
    setTimeout(() => setCopiedBulk(null), 1500);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip onFiles={handleFiles} accept={IMAGE_ACCEPT} formatHint={tUpload('formats')} disabled={isExtracting} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 파일 정보 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* 색상 수 슬라이더 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('countLabel')}
              </span>
              <span className="text-sm font-semibold">{count}</span>
            </div>
            <input
              type="range"
              min={5}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          {/* 추출 버튼 */}
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isExtracting
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            {isExtracting ? t('extracting') : t('extract')}
          </button>

          {/* 팔레트 결과 */}
          {palette.length > 0 && (
            <>
              {/* 색상 표시 형식 토글 */}
              <div className="flex gap-1">
                {(['hex', 'rgb', 'hsl'] as ColorFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      format === f
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* 색상 스와치 */}
              <div className="flex flex-col gap-1.5">
                {palette.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyColor(color, idx)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-all hover:bg-muted/60 active:scale-95 cursor-pointer"
                  >
                    <div
                      className="h-8 w-8 flex-shrink-0 rounded-md border border-border shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="flex-1 text-sm font-mono text-foreground">
                      {formatColor(color, format)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {copiedIdx === idx ? t('copied') : '복사'}
                    </span>
                  </button>
                ))}
              </div>

              {/* 일괄 복사 */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyBulk('json')}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-all cursor-pointer"
                >
                  {copiedBulk === 'json' ? t('copied') : t('copyJson')}
                </button>
                <button
                  onClick={() => copyBulk('css')}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-all cursor-pointer"
                >
                  {copiedBulk === 'css' ? t('copied') : t('copyCss')}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
