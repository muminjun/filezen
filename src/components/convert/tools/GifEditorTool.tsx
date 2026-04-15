'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFFmpeg } from '@/lib/ffmpegLoader';

interface Frame {
  id: string;
  file: File;
  previewUrl: string;
  delay: number; // ms
}

type Status = 'idle' | 'loading-wasm' | 'encoding' | 'done' | 'error';

export function GifEditorTool() {
  const t = useTranslations('convert.gifEditor');
  const [frames,   setFrames]   = useState<Frame[]>([]);
  const [loop,     setLoop]     = useState<'forever' | 'once'>('forever');
  const [status,   setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState<string | null>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    const newFrames: Frame[] = files.map((file) => ({
      id:         crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      delay:      100,
    }));
    setFrames((prev) => [...prev, ...newFrames].slice(0, 20));
    e.target.value = '';
  }, []);

  const moveUp   = (idx: number) => setFrames((prev) => {
    if (idx === 0) return prev;
    const next = [...prev];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    return next;
  });

  const moveDown = (idx: number) => setFrames((prev) => {
    if (idx === prev.length - 1) return prev;
    const next = [...prev];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    return next;
  });

  const remove   = (id: string) => setFrames((prev) => {
    const f = prev.find((fr) => fr.id === id);
    if (f) URL.revokeObjectURL(f.previewUrl);
    return prev.filter((fr) => fr.id !== id);
  });

  const setDelay = (id: string, delay: number) =>
    setFrames((prev) => prev.map((fr) => fr.id === id ? { ...fr, delay } : fr));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (frames.length === 0) return;
    setError(null);
    setProgress(0);

    try {
      setStatus('loading-wasm');
      const ffmpeg = await getFFmpeg((p) => setProgress(Math.round(p * 100)));
      setStatus('encoding');

      const { fetchFile } = await import('@ffmpeg/util');

      // 각 프레임 파일 write
      for (let i = 0; i < frames.length; i++) {
        const name = `frame_${String(i).padStart(4, '0')}.png`;
        await ffmpeg.writeFile(name, await fetchFile(frames[i].file));
      }

      // concat demuxer용 파일 작성
      const concatLines = frames
        .map((fr, i) => `file 'frame_${String(i).padStart(4, '0')}.png'\nduration ${fr.delay / 1000}`)
        .join('\n');
      const encoder = new TextEncoder();
      await ffmpeg.writeFile('concat.txt', encoder.encode(concatLines));

      // GIF 인코딩
      await ffmpeg.exec([
        '-f',    'concat',
        '-safe', '0',
        '-i',    'concat.txt',
        '-vf',   'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', loop === 'forever' ? '0' : '1',
        'output.gif',
      ]);

      const raw  = await ffmpeg.readFile('output.gif') as Uint8Array;
      downloadBlob(new Blob([new Uint8Array(raw)], { type: 'image/gif' }), 'animated.gif');

      // cleanup
      await ffmpeg.deleteFile('concat.txt');
      await ffmpeg.deleteFile('output.gif');
      for (let i = 0; i < frames.length; i++) {
        await ffmpeg.deleteFile(`frame_${String(i).padStart(4, '0')}.png`);
      }

      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const isProcessing = status === 'loading-wasm' || status === 'encoding';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Upload strip */}
      <label className={cn(
        'flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 border-b-2 border-dashed border-border px-4 bg-card hover:bg-muted/60 transition-colors',
        isProcessing && 'cursor-not-allowed opacity-60',
      )}>
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
          onChange={handleFiles} disabled={isProcessing} />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-lg font-bold">
          +
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">
            {frames.length === 0 ? t('empty') : `${frames.length}프레임`}
          </span>
          <span className="text-[11px] text-muted-foreground">{t('uploadHint')}</span>
        </div>
      </label>

      {frames.length > 0 ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* Frame list */}
          <div className="flex flex-col gap-2">
            {frames.map((fr, idx) => (
              <div key={fr.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fr.previewUrl} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                <span className="flex-1 truncate text-xs text-foreground">{fr.file.name}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <label className="text-[10px] text-muted-foreground whitespace-nowrap">{t('delay')}</label>
                  <input
                    type="number" min={50} max={5000} step={50} value={fr.delay}
                    onChange={(e) => setDelay(fr.id, Number(e.target.value))}
                    className="w-16 rounded border border-border bg-background px-1 py-0.5 text-xs text-center"
                  />
                </div>
                <button onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === frames.length - 1}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowDown size={12} />
                </button>
                <button onClick={() => remove(fr.id)}
                  className="rounded p-1 text-muted-foreground hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Loop */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">{t('loop')}</label>
            <div className="flex gap-2">
              {(['forever', 'once'] as const).map((l) => (
                <button key={l} onClick={() => setLoop(l)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    loop === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}>
                  {l === 'forever' ? t('loopForever') : t('loopOnce')}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {status === 'loading-wasm' && (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">ffmpeg.wasm 로딩 중...</span>
            </div>
          )}
          {status === 'encoding' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{t('generating')} {progress}%</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'done' && <p className="text-xs text-green-600 dark:text-green-400">{t('done')}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleGenerate} disabled={isProcessing || frames.length === 0}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
              !isProcessing && frames.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {isProcessing && (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            )}
            {isProcessing ? t('generating') : t('generate')}
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
