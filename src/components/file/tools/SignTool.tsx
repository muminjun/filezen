'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBytes } from '@/lib/utils';
import { addSignatureToPdf } from '@/lib/pdfSign';
import { FileUploadStrip } from '../FileUploadStrip';

export function SignTool() {
  const t = useTranslations('file.sign');

  const [file, setFile]           = useState<File | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [sigWidth, setSigWidth]   = useState(200);
  const [sigHeight, setSigHeight] = useState(80);
  const [sigX, setSigX]           = useState(50);
  const [sigY, setSigY]           = useState(50);
  const [isApplying, setIsApplying] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [file]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvasRef.current!.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handlePointerUp = () => { isDrawing.current = false; };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleApply = async () => {
    if (!file || !hasSignature) return;
    setIsApplying(true);
    setError(null);
    setDone(false);

    try {
      const dataUrl = canvasRef.current!.toDataURL('image/png');
      const bytes = await addSignatureToPdf(file, {
        signatureDataUrl: dataUrl,
        pageIndex:  pageIndex - 1,
        x:          sigX,
        y:          sigY,
        width:      sigWidth,
        height:     sigHeight,
      });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-signed.pdf`);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isApplying} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File name */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Signature canvas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('signaturePad')}
              </label>
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('clear')}
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              className="w-full rounded-md border border-border bg-white cursor-crosshair touch-none"
              style={{ aspectRatio: '400/160' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          </div>

          {/* Page number */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">{t('pageLabel')}</label>
            <input
              type="number" min={1} value={pageIndex}
              onChange={(e) => setPageIndex(parseInt(e.target.value, 10) || 1)}
              className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Size */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('sizeLabel')}
            </label>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">{t('width')}</label>
              <input
                type="number" min={10} max={500} value={sigWidth}
                onChange={(e) => setSigWidth(parseInt(e.target.value, 10) || 200)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
              <label className="text-xs text-muted-foreground">{t('height')}</label>
              <input
                type="number" min={10} max={300} value={sigHeight}
                onChange={(e) => setSigHeight(parseInt(e.target.value, 10) || 80)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('positionLabel')}
            </label>
            <p className="text-[10px] text-muted-foreground/60">{t('positionHint')}</p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">{t('x')}</label>
              <input
                type="number" min={0} value={sigX}
                onChange={(e) => setSigX(parseInt(e.target.value, 10) || 0)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
              <label className="text-xs text-muted-foreground">{t('y')}</label>
              <input
                type="number" min={0} value={sigY}
                onChange={(e) => setSigY(parseInt(e.target.value, 10) || 0)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>}
          {!hasSignature && (
            <p className="text-xs text-amber-500 dark:text-amber-400">{t('noSignature')}</p>
          )}

          <button
            onClick={handleApply}
            disabled={isApplying || !hasSignature}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isApplying && hasSignature
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isApplying
              ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              : null}
            {isApplying ? t('applying') : t('apply')}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
