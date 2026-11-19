'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import type { NormalizedPlacement } from '@/lib/drop-sign/index';
import { cn, downloadBytes } from '@/lib/utils';
import { addSignatureToPdf } from '@/lib/pdfSign';
import { placementToPdf } from '@/lib/placementToPdf';
import { FileUploadStrip } from '../FileUploadStrip';
import { PdfPagePreview, type ActivePageInfo, type SigOverlay } from '../PdfPagePreview';

const ZOOM_MIN = 1 / 3;
const ZOOM_MAX = 4;

interface PlacedSig extends SigOverlay {
  widthPt: number;
  heightPt: number;
}

let sigIdCounter = 0;

export function SignTool() {
  const t = useTranslations('file.sign');

  const [file, setFile]               = useState<File | null>(null);
  const [pageCount, setPageCount]     = useState(0);
  const [zoom, setZoom]               = useState(1);
  const [activePageInfo, setActivePageInfo] = useState<ActivePageInfo | null>(null);
  const [activeEl, setActiveEl]       = useState<HTMLImageElement | null>(null);
  const [signatures, setSignatures]   = useState<PlacedSig[]>([]);
  const [isApplying, setIsApplying]   = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const btnRef    = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setPageCount(0);
    setZoom(1);
    setActivePageInfo(null);
    setActiveEl(null);
    setSignatures([]);
    setDone(false);
    setError(null);
  }, []);

  const handleActivePage = useCallback((info: ActivePageInfo) => {
    setActivePageInfo(info);
    // 서명 목록은 유지 — 페이지가 바뀌어도 초기화하지 않음
  }, []);

  const handleActiveEl = useCallback((el: HTMLImageElement | null) => {
    setActiveEl(el);
  }, []);

  // Ctrl+scroll AND 트랙패드 핀치 → smooth zoom
  // viewerRef 마운트 타이밍에 맞게 file 의존성 포함
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.004);
      setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor)));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [file]); // file 변경 시 뷰어 div가 나타나므로 재연결

  // DropSign 초기화 — activeEl 변경(=가장 많이 보이는 페이지 변경)될 때마다 재연결
  useEffect(() => {
    const btn = btnRef.current;
    if (!file || !activeEl || !btn || !activePageInfo) return;

    let widget: { destroy(): void } | null = null;
    let cancelled = false;

    import('@/lib/drop-sign/index').then(({ DropSign }) => {
      if (cancelled) return;
      widget = DropSign.init({
        target:  activeEl,
        trigger: { type: 'custom', element: btn },
        messages: t.raw('modal'),
        onComplete: (result) => {
          if (!activePageInfo) return;
          const sig: PlacedSig = {
            id:        ++sigIdCounter,
            dataUrl:   result.signatureDataUrl,
            placement: result.placement,
            pageIndex: activePageInfo.pageIndex,
            widthPt:   activePageInfo.widthPt,
            heightPt:  activePageInfo.heightPt,
          };
          setSignatures(prev => [...prev, sig]);
        },
        onError: (err) => setError(String(err)),
      });
    });

    return () => {
      cancelled = true;
      widget?.destroy();
    };
  }, [file, activeEl, activePageInfo, t]);

  const removeSig = (id: number) => setSignatures(prev => prev.filter(s => s.id !== id));

  const handleApply = async () => {
    if (!file || signatures.length === 0) return;
    setIsApplying(true);
    setError(null);
    setDone(false);

    try {
      const sigOptions = signatures.map(sig => ({
        signatureDataUrl: sig.dataUrl,
        pageIndex: sig.pageIndex - 1,
        ...placementToPdf(sig.placement, sig.widthPt, sig.heightPt),
      }));
      const bytes = await addSignatureToPdf(file, sigOptions);
      downloadBytes(bytes, file.name.replace(/\.pdf$/i, '') + '-signed.pdf');
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsApplying(false);
    }
  };

  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z / 1.25));
  const zoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, z * 1.25));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isApplying} multiple={false} />

      {file ? (
        <>
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2 border-b border-border">
            <span className="truncate text-sm font-medium min-w-0">
              {file.name}
              {pageCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">{pageCount}p</span>
              )}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} className="rounded p-1 hover:bg-muted disabled:opacity-40 transition-colors">
                <ZoomOut size={15} />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX} className="rounded p-1 hover:bg-muted disabled:opacity-40 transition-colors">
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-auto p-4" ref={viewerRef}>
            <PdfPagePreview
              file={file}
              zoom={zoom}
              overlays={signatures}
              onPageCount={setPageCount}
              onActivePage={handleActivePage}
              onActiveEl={handleActiveEl}
              onError={(err) => setError(String(err))}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex shrink-0 flex-col gap-2 px-4 py-3 border-t border-border">
            {/* 배치된 서명 목록 */}
            {signatures.length > 0 && (
              <div className="flex flex-col gap-1">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
                    <span className="text-muted-foreground">
                      {t('pageLabel')} {sig.pageIndex} · {t('item')} {signatures.indexOf(sig) + 1}
                    </span>
                    <button
                      onClick={() => removeSig(sig.id)}
                      className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
            {done  && <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>}

            <div className="flex gap-2">
              {activePageInfo && (
                <button
                  ref={btnRef}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted active:scale-95 transition-all"
                >
                  ✍ {t('placeSignature')}
                </button>
              )}
              <button
                onClick={handleApply}
                disabled={isApplying || signatures.length === 0}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
                  !isApplying && signatures.length > 0
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
                )}
              >
                {isApplying && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />}
                {isApplying ? t('applying') : `${t('apply')}${signatures.length > 1 ? ` (${signatures.length})` : ''}`}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
