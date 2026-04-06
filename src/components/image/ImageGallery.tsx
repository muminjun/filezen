'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/context/AppContext';
import { ImageCard } from './ImageCard';

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
  } = useAppContext();

  const lastClickedId = useRef<string | null>(null);

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

  const allSelected = images.length > 0 && selectedIds.size === images.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-4 border-b border-border px-4 py-2">
        <button
          onClick={allSelected ? clearSelection : selectAll}
          disabled={images.length === 0}
          className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {allSelected ? t('deselectAll') : t('selectAll')}
        </button>

        <button
          onClick={handleRemoveAll}
          disabled={images.length === 0}
          className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-40"
        >
          {t('removeAll')}
        </button>

        {selectedIds.size > 0 && (
          <span className="text-xs font-medium text-primary">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {t('totalCount', { count: images.length })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('noImages')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isSelected={selectedIds.has(image.id)}
                onToggle={handleToggle}
                onRemove={removeImage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
