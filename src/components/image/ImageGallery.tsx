'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/context/AppContext';
import { ImageCard } from './ImageCard';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const COLUMN_OPTIONS = [2, 3, 4, 5] as const;

// Tailwind needs static strings — pre-define all possible desktop column classes
const DESKTOP_COL_CLASS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
};

export function ImageGallery() {
  const t = useTranslations('gallery');
  const {
    images,
    selectedIds,
    toggleSelect,
    rangeSelect,
    selectAll,
    clearSelection,
    removeImage,
    removeAllImages,
    reorderImages,
  } = useAppContext();

  const lastClickedId = useRef<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(4);

  const handleToggle = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickedId.current) {
      rangeSelect(lastClickedId.current, id);
    } else {
      toggleSelect(id);
    }
    lastClickedId.current = id;
  };

  const handleRemoveAll = () => {
    if (window.confirm(t('removeAll') + '?')) {
      removeAllImages();
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(t('removeSelected') + '?')) {
      Array.from(selectedIds).forEach((id) => removeImage(id));
    }
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderImages(draggedIndex, index);
    setDraggedIndex(index);
  };

  const onDragEnd = () => setDraggedIndex(null);

  const allSelected = images.length > 0 && selectedIds.size === images.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <button
          onClick={allSelected ? clearSelection : selectAll}
          disabled={images.length === 0}
          className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 whitespace-nowrap"
        >
          {allSelected ? t('deselectAll') : t('selectAll')}
        </button>

        <button
          onClick={handleRemoveSelected}
          disabled={selectedIds.size === 0}
          className="cursor-pointer text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-40 whitespace-nowrap"
        >
          {t('removeSelected')}
        </button>

        <button
          onClick={handleRemoveAll}
          disabled={images.length === 0}
          className="hidden sm:block cursor-pointer text-xs font-medium text-destructive/60 hover:text-destructive disabled:opacity-40 whitespace-nowrap"
        >
          {t('removeAll')}
        </button>

        {selectedIds.size > 0 && (
          <span className="text-xs font-medium text-primary whitespace-nowrap">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('totalCount', { count: images.length })}
          </span>
          {/* Column selector — desktop only */}
          <div className="hidden sm:block">
            <Select value={String(columns)} onValueChange={(v) => setColumns(Number(v))}>
              <SelectTrigger className="h-7 w-[70px] text-xs cursor-pointer">
                <SelectValue>{columns}열</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COLUMN_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}열</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {images.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('noImages')}</p>
          </div>
        ) : (
          <div className={cn(
            'grid grid-cols-2 gap-2 sm:gap-4',
            DESKTOP_COL_CLASS[columns] ?? 'sm:grid-cols-4'
          )}>
            {images.map((image, index) => (
              <div
                key={image.id}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                draggable
                className={cn(
                  'cursor-move transition-opacity',
                  draggedIndex === index && 'opacity-30'
                )}
              >
                <ImageCard
                  image={image}
                  isSelected={selectedIds.has(image.id)}
                  onToggle={handleToggle}
                  onRemove={removeImage}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
