'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBlob } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import {
  generateIconSet,
  ICON_OUTPUT_SPECS,
  type IconOutputSpec,
} from '@/lib/iconGenerator';
import JSZip from 'jszip';

const IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export function IconTool() {
  const t = useTranslations('convert.icon');
  const tUpload = useTranslations('convert.upload');

  const [file, setFile] = useState<File | null>(null);
  const [bgMode, setBgMode] = useState<'transparent' | 'solid'>('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedSpecs, setSelectedSpecs] = useState<IconOutputSpec[]>([...ICON_OUTPUT_SPECS]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = (files: File[]) => {
    if (files[0]) setFile(files[0]);
  };

  const toggleSpec = (spec: IconOutputSpec) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const isAllSelected = selectedSpecs.length === ICON_OUTPUT_SPECS.length;

  const toggleAll = () => {
    setSelectedSpecs(isAllSelected ? [] : [...ICON_OUTPUT_SPECS]);
  };

  const handleGenerate = async () => {
    if (!file || selectedSpecs.length === 0) return;
    setIsGenerating(true);
    try {
      const outputFiles = await generateIconSet(file, {
        bgColor: bgMode === 'transparent' ? null : bgColor,
        selectedSpecs,
      });
      const zip = new JSZip();
      for (const { filename, blob } of outputFiles) {
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'icon-set.zip');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip onFiles={handleFiles} accept={IMAGE_ACCEPT} formatHint={tUpload('formats')} disabled={isGenerating} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 파일 정보 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* 배경색 설정 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('bgLabel')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBgMode('transparent')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer',
                  bgMode === 'transparent'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:bg-muted/60'
                )}
              >
                {t('bgTransparent')}
              </button>
              <button
                onClick={() => setBgMode('solid')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer',
                  bgMode === 'solid'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:bg-muted/60'
                )}
              >
                {t('bgSolid')}
              </button>
              {bgMode === 'solid' && (
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border p-0.5"
                />
              )}
            </div>
          </div>

          {/* 출력 파일 선택 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('outputLabel')}
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {isAllSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {ICON_OUTPUT_SPECS.map((spec) => {
                const isSelected = selectedSpecs.includes(spec);
                return (
                  <button
                    key={spec.filename}
                    onClick={() => toggleSpec(spec)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-card text-foreground hover:bg-muted/60'
                    )}
                  >
                    <span
                      className={cn(
                        'h-3 w-3 flex-shrink-0 rounded border-2',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )}
                    />
                    <span className="flex-1">{spec.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      {spec.width}×{spec.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedSpecs.length === 0}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isGenerating && selectedSpecs.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            {isGenerating ? t('downloading') : t('download')}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
