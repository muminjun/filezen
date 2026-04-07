'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rotateImageBlob } from '@/lib/imageRotation';
import type { ImageFile } from '@/lib/types';

interface ImageCardProps {
  image: ImageFile;
  isSelected: boolean;
  onToggle: (id: string, event: React.MouseEvent) => void;
  onRemove: (id: string) => void;
}

export const ImageCard = memo(function ImageCard({
  image,
  isSelected,
  onToggle,
  onRemove,
}: ImageCardProps) {
  const t = useTranslations('gallery');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const needsScale = image.rotation === 90 || image.rotation === 270;
  const flipScale = image.flipped ? ' scaleX(-1)' : '';

  return (
    <div
      ref={containerRef}
      onClick={(e) => onToggle(image.id, e)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all select-none active:scale-[0.97] will-change-transform',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'hover:border-primary/30 hover:shadow-md'
      )}
    >
      {isSelected && (
        <div className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image.id);
          }}
          title={t('removeImage')}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-destructive transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <button
        onClick={async (e) => {
          e.stopPropagation();
          if (image.rotation === 0 && !image.flipped) {
            window.open(image.previewUrl, '_blank');
          } else {
            const blob = await rotateImageBlob(image.previewUrl, image.rotation, image.flipped, image.file.type || 'image/jpeg');
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        }}
        className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary transition-colors"
      >
        <Maximize2 size={14} />
      </button>

      {isVisible ? (
        <img
          src={image.previewUrl}
          alt={image.file.name}
          draggable={false}
          style={{
            transform: `rotate(${image.rotation}deg)${needsScale ? ' scale(0.71)' : ''}${flipScale}`,
          }}
          className="w-full h-auto object-contain transition-transform duration-300 ease-out"
        />
      ) : (
        <div className="w-full aspect-video animate-pulse bg-muted" />
      )}
    </div>
  );
});
