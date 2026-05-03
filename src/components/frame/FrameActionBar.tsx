'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { LayoutGrid, Palette, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridEditor } from './GridEditor';
import type { FrameTemplate, FrameOptionsState } from '@/lib/frameTemplates';

const GAP_COLORS = ['#ffffff', '#000000', '#f5f5f5', '#1a1a1a', '#ffd6e0', '#d6eaff'];

type ActiveModal = 'layout' | 'style' | null;

interface Props {
  template: FrameTemplate;
  options: FrameOptionsState;
  onChange: (opts: FrameOptionsState) => void;
  onPhotoCountChange: (n: number) => void;
  onColsChange: (c: number) => void;
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
  isExporting: boolean;
  onExport: () => void;
}

export function FrameActionBar({
  template, options, onChange,
  onPhotoCountChange, onColsChange, onMerge, onSplit,
  isExporting, onExport,
}: Props) {
  const t = useTranslations('frame');
  const tOpts = useTranslations('frame.options');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [pendingClose, setPendingClose] = useState<ActiveModal>(null);

  const set = <K extends keyof FrameOptionsState>(key: K, value: FrameOptionsState[K]) =>
    onChange({ ...options, [key]: value });

  const photoCount = template.slots.length;
  const cols = template.grid.cols;
  const isPhotobooth = template.category === 'photobooth';
  const isSingleSlot = template.slots.length === 1;
  const isNonSquare = template.canvasRatio[0] !== template.canvasRatio[1];
  const showOrientation = isSingleSlot && isNonSquare;

  const openModal = (modal: ActiveModal) => {
    setPendingClose(null);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setPendingClose(activeModal);
    setTimeout(() => {
      setActiveModal(null);
      setPendingClose(null);
    }, 280);
  };

  const isClosing = pendingClose !== null;

  return (
    <>
      {/* ── Mobile toolbar ── */}
      <div className="sm:hidden flex flex-shrink-0 items-center gap-1.5 border-t border-border bg-card px-3 py-2 pb-safe">
        {isPhotobooth && (
          <button
            type="button"
            onClick={() => openModal('layout')}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-muted text-foreground hover:bg-muted/80 transition-all active:scale-95"
          >
            <LayoutGrid size={13} />
            {tOpts('layout')}
          </button>
        )}
        <button
          type="button"
          onClick={() => openModal('style')}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-muted text-foreground hover:bg-muted/80 transition-all active:scale-95"
        >
          <Palette size={13} />
          {tOpts('style')}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className={cn(
            'flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95',
            isExporting
              ? 'cursor-not-allowed bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          <Download size={12} />
          {isExporting ? t('exporting') : t('export')}
        </button>
      </div>

      {/* ── Layout Modal ── */}
      {activeModal === 'layout' && (
        <OptionsModal
          title={tOpts('layout')}
          closing={isClosing}
          onClose={closeModal}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">{tOpts('photoCount')}</span>
              <Stepper
                value={photoCount}
                min={1}
                max={16}
                onDecrement={() => onPhotoCountChange(photoCount - 1)}
                onIncrement={() => onPhotoCountChange(photoCount + 1)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">{tOpts('cols')}</span>
              <Stepper
                value={cols}
                min={1}
                max={4}
                onDecrement={() => onColsChange(cols - 1)}
                onIncrement={() => onColsChange(cols + 1)}
              />
            </div>
            <GridEditor
              slots={template.slots}
              grid={template.grid}
              onMerge={onMerge}
              onSplit={onSplit}
            />
          </div>
        </OptionsModal>
      )}

      {/* ── Style Modal ── */}
      {activeModal === 'style' && (
        <OptionsModal
          title={tOpts('style')}
          closing={isClosing}
          onClose={closeModal}
        >
          <div className="flex flex-col gap-5">
            {showOrientation && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {tOpts('orientation')}
                </span>
                <div className="flex gap-2">
                  {(['portrait', 'landscape'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => set('orientation', o)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer',
                        options.orientation === o
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-card text-foreground hover:bg-muted/60',
                      )}
                    >
                      {tOpts(o)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tOpts('gapColor')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {GAP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('gapColor', c)}
                    style={{ backgroundColor: c }}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110',
                      options.gapColor === c ? 'border-primary scale-110' : 'border-border',
                    )}
                  />
                ))}
                <input
                  type="color"
                  value={options.gapColor}
                  onChange={(e) => set('gapColor', e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-full border border-border"
                />
              </div>
            </div>
            <SliderField label={tOpts('gapSize')} value={options.gapSize} min={0} max={40}
              onChange={(v) => set('gapSize', v)} />
            <SliderField label={tOpts('borderRadius')} value={options.borderRadius} min={0} max={20}
              onChange={(v) => set('borderRadius', v)} />
            <SliderField label={tOpts('borderWidth')} value={options.borderWidth} min={0} max={10}
              onChange={(v) => set('borderWidth', v)} />
            {options.borderWidth > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {tOpts('borderColor')}
                </span>
                <input
                  type="color"
                  value={options.borderColor}
                  onChange={(e) => set('borderColor', e.target.value)}
                  className="h-8 w-full cursor-pointer rounded border border-border"
                />
              </div>
            )}
          </div>
        </OptionsModal>
      )}
    </>
  );
}

function OptionsModal({
  title, closing, onClose, children,
}: {
  title: string;
  closing: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (typeof document === 'undefined') return null;

  const isIn = visible && !closing;

  // toolbar ~42px + nav ~56px = ~98px → bottom-24 (96px) leaves both visible
  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300',
          isIn ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-2xl bg-card shadow-xl overflow-hidden',
          'max-h-[80vh]',
          'transition-transform duration-300 ease-out',
          isIn ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {children}
          {/* safe area + breathing room at bottom */}
          <div className="h-6 flex-shrink-0 pb-safe" />
        </div>
      </div>
    </>,
    document.body,
  );
}

function Stepper({
  value, min, max, onDecrement, onIncrement,
}: {
  value: number; min: number; max: number;
  onDecrement: () => void; onIncrement: () => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border">
      <button type="button" onClick={onDecrement} disabled={value <= min}
        className="border-r border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors">
        −
      </button>
      <span className="min-w-[2rem] bg-card px-2 py-1 text-center text-xs font-semibold">{value}</span>
      <button type="button" onClick={onIncrement} disabled={value >= max}
        className="border-l border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors">
        +
      </button>
    </div>
  );
}

function SliderField({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} <span className="normal-case font-normal">{value}px</span>
      </span>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-primary" />
    </div>
  );
}
