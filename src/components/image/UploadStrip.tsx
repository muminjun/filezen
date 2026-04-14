'use client';

import { useCallback, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload, Link, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { fetchImageFromUrl, FetchImageUrlError } from '@/lib/fetchImageFromUrl';
import { MAX_FILES } from '@/lib/constants';

export function UploadStrip() {
  const t = useTranslations('upload');
  const { addImages } = useAppContext();
  const { showToast } = useToast();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) addImages(acceptedFiles);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png':  ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif':  ['.gif'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    maxFiles: MAX_FILES,
  });

  const openUrlInput = useCallback(() => {
    setShowUrlInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeUrlInput = useCallback(() => {
    setShowUrlInput(false);
    setUrlValue('');
  }, []);

  const handleUrlSubmit = useCallback(async () => {
    const url = urlValue.trim();
    if (!url) return;
    setIsFetching(true);
    try {
      const file = await fetchImageFromUrl(url);
      await addImages([file]);
      closeUrlInput();
    } catch (err) {
      if (err instanceof FetchImageUrlError) {
        const msg =
          err.code === 'CORS'        ? t('urlErrorCors')
          : err.code === 'NOT_IMAGE' ? t('urlErrorNotImage')
          : t('urlErrorFailed');
        showToast(msg, 'error');
      } else {
        showToast(t('urlErrorFailed'), 'error');
      }
    } finally {
      setIsFetching(false);
    }
  }, [urlValue, addImages, closeUrlInput, showToast, t]);

  if (showUrlInput) {
    return (
      <div className="flex h-14 sm:h-20 flex-shrink-0 items-center gap-2 border-b-2 border-dashed border-primary bg-primary/5 px-4 sm:px-6">
        <Link size={18} className="flex-shrink-0 text-primary" />
        <input
          ref={inputRef}
          type="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUrlSubmit();
            if (e.key === 'Escape') closeUrlInput();
          }}
          placeholder={t('urlPlaceholder')}
          disabled={isFetching}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {isFetching ? (
          <Loader2 size={16} className="flex-shrink-0 animate-spin text-primary" />
        ) : (
          <>
            <button
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                urlValue.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
              )}
            >
              {t('urlButton')}
            </button>
            <button onClick={closeUrlInput} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-14 sm:h-20 flex-shrink-0 border-b-2 border-dashed border-border">
      <div
        {...getRootProps()}
        className={cn(
          'group flex flex-1 cursor-pointer items-center gap-3 sm:gap-4 px-4 sm:px-6 transition-all duration-200 ease-in-out',
          isDragActive
            ? 'bg-primary/10 border-primary shadow-inner'
            : 'bg-card hover:bg-muted/60 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary',
          isDragActive && 'bg-primary text-primary-foreground'
        )}>
          <Upload size={20} className={cn(
            'transition-transform duration-300 group-hover:-translate-y-0.5',
            isDragActive && 'animate-bounce'
          )} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={cn(
            'truncate text-sm font-semibold transition-colors group-hover:text-primary',
            isDragActive && 'text-primary scale-105 origin-left'
          )}>
            {isDragActive ? t('dropHere') : t('dragDrop')}
          </span>
          <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
            {t('formats')}
          </span>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent" />
      </div>

      {/* URL 가져오기 버튼 */}
      <button
        onClick={openUrlInput}
        title={t('urlButton')}
        className="flex h-full flex-shrink-0 items-center gap-1.5 border-l border-border px-3 sm:px-4 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Link size={14} />
        <span className="hidden sm:inline">{t('urlButton')}</span>
      </button>
    </div>
  );
}
