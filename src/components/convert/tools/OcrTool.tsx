'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import { getTesseractWorker, type OcrLang } from '@/lib/tesseractLoader';

type OcrStatus = 'idle' | 'loading-wasm' | 'recognizing' | 'done' | 'error';

interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export function OcrTool() {
  const [file,       setFile]       = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lang,       setLang]       = useState<OcrLang>('kor+eng');
  const [status,     setStatus]     = useState<OcrStatus>('idle');
  const [progress,   setProgress]   = useState(0);
  const [text,       setText]       = useState('');
  const [words,      setWords]      = useState<OcrWord[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('idle');
    setText('');
    setWords([]);
    setError(null);
  }, [previewUrl]);

  // 바운딩 박스 Canvas 렌더링
  useEffect(() => {
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || words.length === 0) return;

    const scaleX = img.clientWidth  / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    canvas.width  = img.clientWidth;
    canvas.height = img.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
    ctx.fillStyle   = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth   = 1.5;

    for (const w of words) {
      const { x0, y0, x1, y1 } = w.bbox;
      const rx = x0 * scaleX;
      const ry = y0 * scaleY;
      const rw = (x1 - x0) * scaleX;
      const rh = (y1 - y0) * scaleY;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }, [words]);

  const handleRecognize = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setText('');
    setWords([]);

    try {
      setStatus('loading-wasm');
      const worker = await getTesseractWorker(lang, (p) => {
        setStatus('recognizing');
        setProgress(p);
      });
      setStatus('recognizing');

      const result = await worker.recognize(file);
      const { text: recognizedText, words: recognizedWords } = result.data;

      setText(recognizedText.trim());
      setWords(
        recognizedWords
          .filter((w) => w.confidence > 30)
          .map((w) => ({
            text: w.text,
            bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 },
          })),
      );
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProcessing = status === 'loading-wasm' || status === 'recognizing';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip
        onFiles={handleFiles}
        accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] }}
        formatHint="PNG, JPG, WebP"
        disabled={isProcessing}
      />

      {file ? (
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* 왼쪽: 이미지 + 바운딩 박스 */}
          <div className="flex flex-col gap-3 p-4 md:w-1/2 md:border-r border-border overflow-y-auto">
            <div className="relative inline-block">
              {previewUrl && (
                <>
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="OCR 대상 이미지"
                    className="w-full rounded-lg object-contain max-h-80"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </>
              )}
            </div>

            {/* 언어 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">언어</label>
              <div className="flex gap-2">
                {([
                  { value: 'kor',     label: '한국어' },
                  { value: 'eng',     label: '영어' },
                  { value: 'kor+eng', label: '자동 감지' },
                ] as const).map(({ value, label }) => (
                  <button key={value} onClick={() => setLang(value)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      lang === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {status === 'loading-wasm' && (
              <div className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
                <span className="text-xs text-muted-foreground">언어 데이터 로딩 중... (~10MB)</span>
              </div>
            )}
            {status === 'recognizing' && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">인식 중... {Math.round(progress * 100)}%</p>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}

            <button onClick={handleRecognize} disabled={isProcessing}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
                !isProcessing
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
              )}>
              {isProcessing && (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              )}
              {isProcessing ? '처리 중...' : '텍스트 추출'}
            </button>
          </div>

          {/* 오른쪽: 텍스트 결과 */}
          <div className="flex flex-col gap-3 p-4 md:w-1/2 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">인식 결과</span>
              {text && (
                <button onClick={handleCopy} className="text-xs text-primary hover:underline">
                  {copied ? '복사됨 ✓' : '전체 복사'}
                </button>
              )}
            </div>
            {status === 'done' && !text && (
              <p className="text-xs text-muted-foreground">인식된 텍스트가 없습니다.</p>
            )}
            {text ? (
              <textarea
                readOnly value={text}
                className="flex-1 min-h-40 w-full rounded-lg border border-border bg-muted/30 p-3 text-sm font-mono resize-none outline-none"
              />
            ) : (
              <div className="flex flex-1 min-h-40 items-center justify-center rounded-lg border border-dashed border-border">
                <p className="text-xs text-muted-foreground px-4 text-center">
                  텍스트 추출 버튼을 누르면 결과가 여기에 표시됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">이미지 파일을 업로드하세요 (PNG, JPG, WebP)</p>
        </div>
      )}
    </div>
  );
}
