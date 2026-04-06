'use client';

import { useRef, useEffect, useState, memo } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  return (
    <div
      ref={containerRef}
      onClick={(e) => onToggle(image.id, e)}
      className={cn(
        'group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'border-transparent hover:border-muted-foreground/40'
      )}
    >
      {isSelected && (
        <div className="absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
        title={t('removeImage')}
        className="absolute right-1.5 top-1.5 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100"
      >
        <X size={12} />
      </button>

      {isVisible ? (
        <img
          src={image.previewUrl}
          alt={image.file.name}
          draggable={false}
          style={{
            transform: `rotate(${image.rotation}deg)${needsScale ? ' scale(0.71)' : ''}`,
          }}
          className="h-full w-full object-cover transition-transform duration-200"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </div>
  );
});
