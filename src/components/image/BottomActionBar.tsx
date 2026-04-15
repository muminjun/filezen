'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, Download, FlipHorizontal, Pencil, FileText, Wand2, Undo2, Redo2, Sparkles, ImageIcon } from 'lucide-react';
import { BgRemoveTool } from './tools/BgRemoveTool';
import { AiUpscaleTool } from './tools/AiUpscaleTool';
import { BgReplaceTool } from './tools/BgReplaceTool';
import { ImageToPdfTool } from './tools/ImageToPdfTool';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const PRESET_DEGREES = [90, 180, 270] as const;
const ROTATION_LABEL_KEYS = {
  90: 'rotate90',
  180: 'rotate180',
  270: 'rotate270',
} as const;

interface Props {
  onEditClick: () => void;
}

export function BottomActionBar({ onEditClick }: Props) {
  const t = useTranslations('actionBar');
  const {
    selectedIds,
    rotateSelected,
    flipSelected,
    downloadAsZip,
    isDownloading,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useAppContext();
  const [customAngle, setCustomAngle] = useState('');
  const [showBgRemove, setShowBgRemove] = useState(false);
  const [showAiUpscale, setShowAiUpscale] = useState(false);
  const [showBgReplace, setShowBgReplace] = useState(false);
  const [showImgToPdf, setShowImgToPdf] = useState(false);

  const hasSelection = selectedIds.size > 0;

  const handleApplyCustom = () => {
    const deg = parseInt(customAngle, 10);
    if (isNaN(deg) || !hasSelection) return;
    rotateSelected(deg);
    setCustomAngle('');
  };

  return (
    <>
      {/* ── Mobile toolbar ── */}
      <div className="sm:hidden flex flex-shrink-0 items-center gap-1.5 border-t border-border bg-card px-3 py-2">
        {/* Selection badge */}
        <span className={cn(
          'min-w-[28px] rounded-full px-2 py-0.5 text-center text-[11px] font-semibold tabular-nums transition-colors',
          hasSelection ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {selectedIds.size}
        </span>

        {/* Rotate buttons */}
        <div className="flex flex-1 items-center justify-center gap-1">
          {PRESET_DEGREES.map((deg) => (
            <button
              key={deg}
              onClick={() => hasSelection && rotateSelected(deg)}
              disabled={!hasSelection}
              title={t(ROTATION_LABEL_KEYS[deg])}
              className={cn(
                'flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95',
                hasSelection
                  ? 'bg-muted text-foreground hover:bg-muted/80'
                  : 'opacity-35 text-muted-foreground cursor-not-allowed'
              )}
            >
              <RotateCw size={11} className="flex-shrink-0" />
              {deg}°
            </button>
          ))}

          {/* Undo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            title="실행 취소 (Ctrl+Z)"
            className={cn(
              'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
              canUndo
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'opacity-35 text-muted-foreground cursor-not-allowed'
            )}
          >
            <Undo2 size={14} />
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={!canRedo}
            title="다시 실행 (Ctrl+Shift+Z)"
            className={cn(
              'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
              canRedo
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'opacity-35 text-muted-foreground cursor-not-allowed'
            )}
          >
            <Redo2 size={14} />
          </button>

          {/* Flip */}
          <button
            onClick={flipSelected}
            disabled={!hasSelection}
            title={t('flipHorizontal')}
            className={cn(
              'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
              hasSelection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'opacity-35 text-muted-foreground cursor-not-allowed'
            )}
          >
            <FlipHorizontal size={14} />
          </button>

          {/* Edit */}
          <button
            onClick={onEditClick}
            disabled={!hasSelection}
            title={t('edit')}
            className={cn(
              'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
              hasSelection
                ? 'text-primary border border-primary/30 hover:bg-primary/10'
                : 'opacity-35 text-muted-foreground cursor-not-allowed border border-border'
            )}
          >
            <Pencil size={14} />
          </button>
        </div>

        {/* BG Remove */}
        <button
          onClick={() => setShowBgRemove(true)}
          disabled={!hasSelection}
          title={t('bgRemove')}
          className={cn(
            'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
            hasSelection
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'opacity-35 text-muted-foreground cursor-not-allowed',
          )}
        >
          <Wand2 size={14} />
        </button>

        {/* AI Upscale */}
        <button
          onClick={() => setShowAiUpscale(true)}
          disabled={!hasSelection}
          title={t('aiUpscale')}
          className={cn(
            'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
            hasSelection
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'opacity-35 text-muted-foreground cursor-not-allowed',
          )}
        >
          <Sparkles size={14} />
        </button>

        {/* BG Replace */}
        <button
          onClick={() => setShowBgReplace(true)}
          disabled={!hasSelection}
          title={t('bgReplace')}
          className={cn(
            'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
            hasSelection
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'opacity-35 text-muted-foreground cursor-not-allowed',
          )}
        >
          <ImageIcon size={14} />
        </button>

        {/* Download */}
        <button
          onClick={downloadAsZip}
          disabled={!hasSelection || isDownloading}
          className={cn(
            'flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95',
            hasSelection && !isDownloading
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <Download size={12} className="flex-shrink-0" />
          ZIP
        </button>

        {/* Image to PDF */}
        <button
          onClick={() => setShowImgToPdf(true)}
          disabled={!hasSelection}
          title={t('imageToPdf')}
          className={cn(
            'flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95',
            hasSelection
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <FileText size={12} className="flex-shrink-0" />
          PDF
        </button>
      </div>

      {/* ── Desktop toolbar ── */}
      <div className="hidden sm:flex h-[52px] flex-shrink-0 items-center gap-2 border-t border-border bg-card px-4 overflow-x-auto no-scrollbar shadow-sm">
        <span className="min-w-[90px] flex-shrink-0 text-xs text-muted-foreground">
          {hasSelection
            ? t('selectedCount', { count: selectedIds.size })
            : t('noneSelected')}
        </span>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="실행 취소 (Ctrl+Z)"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              canUndo
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'cursor-not-allowed text-muted-foreground opacity-40'
            )}
          >
            <Undo2 size={12} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="다시 실행 (Ctrl+Shift+Z)"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              canRedo
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'cursor-not-allowed text-muted-foreground opacity-40'
            )}
          >
            <Redo2 size={12} />
          </button>
        </div>

        <div className="h-5 w-px flex-shrink-0 bg-border" />

        <div className="flex flex-shrink-0 items-center gap-2">
          {PRESET_DEGREES.map((deg) => (
            <button
              key={deg}
              onClick={() => hasSelection && rotateSelected(deg)}
              disabled={!hasSelection}
              title={t(ROTATION_LABEL_KEYS[deg])}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
                hasSelection
                  ? 'bg-muted hover:bg-muted/80 text-foreground'
                  : 'cursor-not-allowed text-muted-foreground opacity-40'
              )}
            >
              <RotateCw size={12} className="flex-shrink-0" />
              {deg}°
            </button>
          ))}
        </div>

        <div className="h-5 w-px flex-shrink-0 bg-border" />

        <div className="flex flex-shrink-0 items-center gap-1">
          <input
            type="number"
            value={customAngle}
            onChange={(e) => setCustomAngle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCustom()}
            disabled={!hasSelection}
            placeholder={t('customAngle')}
            className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
          />
          <span className="text-xs text-muted-foreground">°</span>
          <button
            onClick={handleApplyCustom}
            disabled={!hasSelection || customAngle === ''}
            className={cn(
              'rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection && customAngle !== ''
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'cursor-not-allowed text-muted-foreground opacity-40'
            )}
          >
            {t('apply')}
          </button>
        </div>

        <div className="h-5 w-px flex-shrink-0 bg-border" />

        <button
          onClick={flipSelected}
          disabled={!hasSelection}
          title={t('flipHorizontal')}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
            hasSelection
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          <FlipHorizontal size={12} className="flex-shrink-0" />
          {t('flipHorizontal')}
        </button>

        <div className="h-5 w-px flex-shrink-0 bg-border" />

        <button
          onClick={onEditClick}
          disabled={!hasSelection}
          title={t('edit')}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
            hasSelection
              ? 'border border-primary/30 text-primary hover:bg-primary/10'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          ✏️ {t('edit')}
        </button>

        <div className="h-5 w-px flex-shrink-0 bg-border" />

        <div className="flex flex-shrink-0 items-center gap-2">
          <Select value={outputFormat} onValueChange={(val) => setOutputFormat(val as any)}>
            <SelectTrigger className="h-8 w-[100px] text-xs cursor-pointer">
              <SelectValue placeholder={t('format')}>
                {outputFormat === 'original'
                  ? t('original')
                  : outputFormat === 'png'
                  ? 'PNG'
                  : outputFormat === 'jpeg'
                  ? 'JPEG'
                  : 'WebP'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">{t('original')}</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>

          {(outputFormat === 'jpeg' || outputFormat === 'webp') && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] text-muted-foreground uppercase">{t('quality')}</span>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-mono w-6 text-center">{quality}%</span>
            </div>
          )}
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2 pl-2">
          <button
            onClick={() => setShowAiUpscale(true)}
            disabled={!hasSelection}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
            )}
          >
            <Sparkles size={14} className="flex-shrink-0" />
            {t('aiUpscale')}
          </button>
          <button
            onClick={() => setShowBgReplace(true)}
            disabled={!hasSelection}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
            )}
          >
            <ImageIcon size={14} className="flex-shrink-0" />
            {t('bgReplace')}
          </button>
          <button
            onClick={() => setShowBgRemove(true)}
            disabled={!hasSelection}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
            )}
          >
            <Wand2 size={14} className="flex-shrink-0" />
            {t('bgRemove')}
          </button>
          <button
            onClick={() => setShowImgToPdf(true)}
            disabled={!hasSelection}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
            )}
          >
            <FileText size={14} className="flex-shrink-0" />
            {t('imageToPdf')}
          </button>
          <button
            onClick={downloadAsZip}
            disabled={!hasSelection || isDownloading}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection && !isDownloading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
            )}
          >
            <Download size={14} className="flex-shrink-0" />
            {isDownloading ? t('downloading') : t('downloadZip')}
          </button>
        </div>
      </div>

      {showBgRemove && <BgRemoveTool onClose={() => setShowBgRemove(false)} />}
      {showAiUpscale && <AiUpscaleTool onClose={() => setShowAiUpscale(false)} />}
      {showBgReplace && <BgReplaceTool onClose={() => setShowBgReplace(false)} />}
      {showImgToPdf && <ImageToPdfTool onClose={() => setShowImgToPdf(false)} />}
    </>
  );
}
