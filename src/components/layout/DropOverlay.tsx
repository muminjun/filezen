'use client';

import { ImageIcon, FolderIcon, LayersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropOverlayProps {
  visible: boolean;
  fileType: 'image' | 'pdf' | 'mixed' | null;
}

export function DropOverlay({ visible, fileType }: DropOverlayProps) {
  if (!visible) return null;

  const icon =
    fileType === 'pdf' ? <FolderIcon size={48} />
    : fileType === 'mixed' ? <LayersIcon size={48} />
    : <ImageIcon size={48} />;

  const label =
    fileType === 'pdf' ? '여기에 PDF를 놓으세요'
    : fileType === 'mixed' ? '여기에 파일을 놓으세요'
    : '여기에 이미지를 놓으세요';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9998] flex items-center justify-center',
        'bg-primary/10 backdrop-blur-sm',
        'pointer-events-none',
        'animate-in fade-in duration-150'
      )}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary bg-background/80 px-12 py-10 shadow-2xl">
        <div className="text-primary">{icon}</div>
        <p className="text-base font-semibold text-primary">{label}</p>
      </div>
    </div>
  );
}
