'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CellPopoverProps {
  anchorRect: DOMRect | null;
  canMerge: boolean;
  hasImage: boolean;
  isMobile: boolean;
  onSplitH: () => void;
  onSplitV: () => void;
  onMerge: () => void;
  onReplacePhoto: () => void;
  onRemovePhoto: () => void;
  onClose: () => void;
}

export function CellPopover({
  anchorRect,
  canMerge,
  hasImage,
  isMobile,
  onSplitH,
  onSplitV,
  onMerge,
  onReplacePhoto,
  onRemovePhoto,
  onClose,
}: CellPopoverProps) {
  const t = useTranslations('collage');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!anchorRect) return null;

  const popoverStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: anchorRect.left + anchorRect.width / 2,
        transform: 'translateX(-50%)',
      }
    : {
        position: 'fixed',
        top: anchorRect.top - 8,
        left: anchorRect.left + anchorRect.width / 2,
        transform: 'translate(-50%, -100%)',
      };

  return (
    <div
      ref={ref}
      style={popoverStyle}
      className="z-50 flex items-center gap-1 rounded-lg border border-border bg-card shadow-lg px-2 py-1.5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <PopoverButton onClick={onSplitH} title={t('splitH')}>↔</PopoverButton>
      <Separator />
      <PopoverButton onClick={onSplitV} title={t('splitV')}>↕</PopoverButton>
      {canMerge && (
        <>
          <Separator />
          <PopoverButton onClick={onMerge} title={t('merge')}>⊞</PopoverButton>
        </>
      )}
      <Separator />
      <PopoverButton onClick={onReplacePhoto} title={t('replacePhoto')}>🖼</PopoverButton>
      {hasImage && (
        <>
          <Separator />
          <PopoverButton onClick={onRemovePhoto} title={t('removePhoto')} danger>✕</PopoverButton>
        </>
      )}
    </div>
  );
}

function PopoverButton({
  onClick,
  title,
  children,
  danger,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="h-4 w-px bg-border" />;
}
