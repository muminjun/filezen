'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import { getFFmpeg } from '@/lib/ffmpegLoader';

type VideoMode   = 'gif' | 'frames';
type VideoStatus = 'idle' | 'loading-wasm' | 'processing' | 'done' | 'error';

export function VideoTool() {
  const [file,          setFile]          = useState<File | null>(null);
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);
  const [duration,      setDuration]      = useState(0);
  const [mode,          setMode]          = useState<VideoMode>('gif');
  const [start,         setStart]         = useState(0);
  const [end,           setEnd]           = useState(5);
  const [fps,           setFps]           = useState(10);
  const [width,         setWidth]         = useState(480);
  const [frameInterval, setFrameInterval] = useState(1);
  const [frameFormat,   setFrameFormat]   = useState<'png' | 'jpeg'>('png');
  const [status,        setStatus]        = useState<VideoStatus>('idle');
  const [progress,      setProgress]      = useState(0);
  const [error,         setError]         = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('idle');
    setError(null);
    setProgress(0);
  }, [previewUrl]);

  const handleMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const dur = Math.floor(video.duration);
    setDuration(dur);
    setEnd(Math.min(5, dur));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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

  const handleConvert = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);

    try {
      setStatus('loading-wasm');
      const ffmpeg = await getFFmpeg((p) => setProgress(p));
      setStatus('processing');

      const { fetchFile } = await import('@ffmpeg/util');
      const ext       = file.name.split('.').pop() ?? 'mp4';
      const inputName = `input.${ext}`;
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const dur = end - start;

      if (mode === 'gif') {
        await ffmpeg.exec([
          '-i', inputName,
          '-ss', String(start),
          '-t',  String(dur),
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
          '-loop', '0',
          'output.gif',
        ]);
        const raw  = await ffmpeg.readFile('output.gif') as Uint8Array;
        const data = new Uint8Array(raw);
        downloadBlob(new Blob([data], { type: 'image/gif' }), file.name.replace(/\.[^.]+$/, '.gif'));
        await ffmpeg.deleteFile('output.gif');
      } else {
        const fExt = frameFormat;
        await ffmpeg.exec([
          '-i', inputName,
          '-ss', String(start),
          '-t',  String(dur),
          '-vf', `fps=1/${frameInterval}`,
          `frame_%04d.${fExt}`,
        ]);

        const dir        = await ffmpeg.listDir('/');
        const frameFiles = (dir as { name: string; isDir: boolean }[])
          .filter((e) => !e.isDir && e.name.startsWith('frame_') && e.name.endsWith(`.${fExt}`))
          .map((e) => e.name)
          .sort();

        const JSZip = (await import('jszip')).default;
        const zip   = new JSZip();
        for (const name of frameFiles) {
          const raw  = await ffmpeg.readFile(name) as Uint8Array;
          zip.file(name, new Uint8Array(raw));
          await ffmpeg.deleteFile(name);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, file.name.replace(/\.[^.]+$/, '-frames.zip'));
      }

      await ffmpeg.deleteFile(inputName);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const isProcessing = status === 'loading-wasm' || status === 'processing';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip
        onFiles={handleFiles}
        accept={{ 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'] }}
        formatHint="MP4, MOV, WebM"
        disabled={isProcessing}
      />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {previewUrl && (
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full max-h-40 rounded-lg object-contain bg-black"
              onLoadedMetadata={handleMetadata}
              muted
              playsInline
            />
          )}

          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
            {duration > 0 && (
              <span className="text-xs text-muted-foreground">길이: {formatTime(duration)}</span>
            )}
          </div>

          {/* 모드 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">출력 형식</label>
            <div className="flex gap-2">
              {(['gif', 'frames'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}>
                  {m === 'gif' ? 'GIF 변환' : '프레임 추출'}
                </button>
              ))}
            </div>
          </div>

          {/* 시간 범위 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">시작 (초)</label>
              <input type="number" min={0} max={Math.max(0, end - 1)} step={1} value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">끝 (초)</label>
              <input type="number" min={start + 1} max={duration || 9999} step={1} value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary" />
            </div>
          </div>

          {/* 모드별 설정 */}
          {mode === 'gif' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">FPS</label>
                <select value={fps} onChange={(e) => setFps(Number(e.target.value))}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary">
                  {[5, 10, 15, 24, 30].map((v) => <option key={v} value={v}>{v} fps</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">너비 (px)</label>
                <select value={width} onChange={(e) => setWidth(Number(e.target.value))}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary">
                  {[240, 320, 480, 640, 800].map((v) => <option key={v} value={v}>{v}px</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">간격 (초마다 1장)</label>
                <select value={frameInterval} onChange={(e) => setFrameInterval(Number(e.target.value))}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary">
                  {[1, 2, 5, 10].map((v) => <option key={v} value={v}>{v}초마다</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">포맷</label>
                <div className="flex gap-2">
                  {(['png', 'jpeg'] as const).map((f) => (
                    <button key={f} onClick={() => setFrameFormat(f)}
                      className={cn(
                        'flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors',
                        frameFormat === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 진행 상태 */}
          {status === 'loading-wasm' && (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
              <span className="text-xs text-muted-foreground">ffmpeg.wasm 로딩 중... (~30MB)</span>
            </div>
          )}
          {status === 'processing' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">변환 중... {Math.round(progress * 100)}%</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}
          {status === 'done' && (
            <p className="text-xs text-green-600 dark:text-green-400">변환 완료! 파일이 다운로드되었습니다.</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleConvert} disabled={isProcessing}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isProcessing
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {isProcessing && (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
            )}
            {isProcessing ? '처리 중...' : mode === 'gif' ? 'GIF 변환' : '프레임 추출'}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">MP4, MOV, WebM 파일을 업로드하세요</p>
        </div>
      )}
    </div>
  );
}
