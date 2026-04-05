'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { useAppContext } from '../../context/AppContext';

export function ImageGallery() {
  const t = useTranslations('gallery');
  const {
    files,
    selectedFileId,
    selectedFileIds,
    selectFile,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    removeFile,
  } = useAppContext();

  const lastClickedIndexRef = useRef<number>(-1);

  const handleThumbnailClick = useCallback(
    (e: React.MouseEvent, fileId: string, index: number) => {
      if (e.shiftKey && lastClickedIndexRef.current >= 0) {
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const rangeIds = files.slice(start, end + 1).map((f) => f.id);
        clearSelection();
        rangeIds.forEach((id) => toggleFileSelection(id));
      } else if (e.ctrlKey || e.metaKey) {
        toggleFileSelection(fileId);
      } else {
        selectFile(fileId);
      }
      lastClickedIndexRef.current = index;
    },
    [files, selectFile, toggleFileSelection, clearSelection]
  );

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-muted-foreground/25 p-4 sm:p-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground">{t('noFiles')}</p>
      </div>
    );
  }

  const allSelected = files.length > 0 && selectedFileIds.length === files.length;

  return (
    <div className="space-y-3">
      {/* 선택 컨트롤 바 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {t('fileCount', { count: files.length })}
          {selectedFileIds.length > 0 && (
            <span className="ml-2 text-primary font-medium">
              {t('selectedCount', { count: selectedFileIds.length })}
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={allSelected ? clearSelection : selectAllFiles}
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </Button>
          {selectedFileIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              {t('clearSelection')}
            </Button>
          )}
        </div>
      </div>

      {/* 썸네일 그리드 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {files.map((file, index) => {
          const isSelected = selectedFileIds.includes(file.id);
          const isPrimary = selectedFileId === file.id;

          return (
            <div
              key={file.id}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                isPrimary
                  ? 'border-primary shadow-md'
                  : isSelected
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={(e) => handleThumbnailClick(e, file.id, index)}
            >
              {/* 썸네일 이미지 */}
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={file.originalUrl}
                  alt={file.file.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `rotate(${file.rotation}deg)`,
                  }}
                />
              </div>

              {/* 체크박스 (좌상단) */}
              <div
                className="absolute top-1 left-1 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFileSelection(file.id);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  className="bg-white/80 backdrop-blur-sm shadow-sm"
                />
              </div>

              {/* 삭제 버튼 (우상단, hover 시 표시) */}
              <button
                className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                aria-label={t('removeFile')}
              >
                <X className="h-3 w-3" />
              </button>

              {/* 회전 각도 배지 */}
              {file.rotation > 0 && (
                <div className="absolute bottom-1 right-1 z-10 bg-primary text-primary-foreground text-[10px] font-bold rounded px-1 py-0.5">
                  {file.rotation}°
                </div>
              )}

              {/* 파일명 (hover 시 표시) */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {file.file.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
