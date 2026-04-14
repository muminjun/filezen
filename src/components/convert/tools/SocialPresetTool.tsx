'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBlob } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import {
  PLATFORMS,
  applyPreset,
  type CropMode,
  type SocialPreset,
} from '@/lib/socialPreset';
import JSZip from 'jszip';

interface SelectedPreset {
  platformKey: string;
  preset: SocialPreset;
}

export function SocialPresetTool() {
  const t = useTranslations('convert.social');

  const [files, setFiles] = useState<File[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<SelectedPreset[]>(() =>
    PLATFORMS.flatMap((p) => p.presets.map((preset) => ({ platformKey: p.key, preset })))
  );
  const [cropMode, setCropMode] = useState<CropMode>('center-crop');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))];
    });
  };

  const togglePreset = (platformKey: string, preset: SocialPreset) => {
    setSelectedPresets((prev) => {
      const exists = prev.some(
        (s) => s.platformKey === platformKey && s.preset === preset
      );
      if (exists) {
        return prev.filter(
          (s) => !(s.platformKey === platformKey && s.preset === preset)
        );
      }
      return [...prev, { platformKey, preset }];
    });
  };

  const allPresets = PLATFORMS.flatMap((p) =>
    p.presets.map((preset) => ({ platformKey: p.key, preset }))
  );
  const isAllSelected = selectedPresets.length === allPresets.length;

  const toggleAll = () => {
    setSelectedPresets(isAllSelected ? [] : allPresets);
  };

  const handleDownload = async () => {
    if (files.length === 0 || selectedPresets.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      for (const file of files) {
        for (const { platformKey, preset } of selectedPresets) {
          const output = await applyPreset(file, platformKey, preset, cropMode);
          zip.file(output.filename, output.blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'social-presets.zip');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip onFiles={handleFiles} disabled={isProcessing} multiple />

      {files.length > 0 ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 업로드된 파일 목록 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex flex-col gap-1">
            {files.map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{f.name}</span>
                <button
                  onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                  className="text-xs text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 크롭 방식 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('cropMode')}
            </span>
            <div className="flex gap-2">
              {(['center-crop', 'letter-box'] as CropMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCropMode(mode)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer',
                    cropMode === mode
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-card text-foreground hover:bg-muted/60'
                  )}
                >
                  {mode === 'center-crop' ? t('centerCrop') : t('letterBox')}
                </button>
              ))}
            </div>
          </div>

          {/* 플랫폼 & 프리셋 선택 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('platformLabel')}
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {isAllSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>

            {PLATFORMS.map((platform) => (
              <div key={platform.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-foreground">{platform.name}</span>
                {platform.presets.map((preset) => {
                  const isSelected = selectedPresets.some(
                    (s) => s.platformKey === platform.key && s.preset === preset
                  );
                  return (
                    <button
                      key={preset.label}
                      onClick={() => togglePreset(platform.key, preset)}
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
                      <span className="flex-1">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            disabled={isProcessing || selectedPresets.length === 0}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isProcessing && selectedPresets.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? t('downloading') : t('download')}
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
