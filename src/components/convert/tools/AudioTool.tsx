'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import { getFFmpeg } from '@/lib/ffmpegLoader';

type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac';
type Status      = 'idle' | 'loading-wasm' | 'converting' | 'done' | 'error';

const FORMATS: AudioFormat[] = ['mp3', 'wav', 'ogg', 'flac'];

export function AudioTool() {
  const t = useTranslations('convert.audio');

  const [file,         setFile]         = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('mp3');
  const [status,       setStatus]       = useState<Status>('idle');
  const [progress,     setProgress]     = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = async (f: File) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const arrayBuffer = await f.arrayBuffer();
      const audioCtx    = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();

      const data = audioBuffer.getChannelData(0);
      const ctx  = canvas.getContext('2d')!;
      const W    = canvas.width;
      const H    = canvas.height;
      const step = Math.ceil(data.length / W);
      const mid  = H / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#0a84ff';
      ctx.lineWidth   = 1;
      ctx.beginPath();

      for (let x = 0; x < W; x++) {
        let min = 1, max = -1;
        for (let s = 0; s < step; s++) {
          const v = data[x * step + s] ?? 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        ctx.moveTo(x, mid + min * mid);
        ctx.lineTo(x, mid + max * mid);
      }
      ctx.stroke();
    } catch {
      // 오디오 디코드 실패 (일부 포맷 미지원) — 무시
    }
  };

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setStatus('idle');
    setError(null);
    setProgress(0);
    drawWaveform(f);
  }, []);

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
      const ffmpeg = await getFFmpeg((p) => setProgress(Math.round(p * 100)));
      setStatus('converting');

      const { fetchFile } = await import('@ffmpeg/util');
      const ext        = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      const inputName  = `input.${ext}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const ffmpegArgs: string[] = ['-i', inputName];
      if (outputFormat === 'mp3') {
        ffmpegArgs.push('-codec:a', 'libmp3lame', '-q:a', '2');
      } else if (outputFormat === 'ogg') {
        ffmpegArgs.push('-codec:a', 'libvorbis', '-q:a', '4');
      } else if (outputFormat === 'flac') {
        ffmpegArgs.push('-codec:a', 'flac');
      }
      // wav: 별도 코덱 플래그 불필요
      ffmpegArgs.push(outputName);

      await ffmpeg.exec(ffmpegArgs);

      const raw  = await ffmpeg.readFile(outputName) as Uint8Array;
      const mime = outputFormat === 'mp3'  ? 'audio/mpeg'
                 : outputFormat === 'wav'  ? 'audio/wav'
                 : outputFormat === 'ogg'  ? 'audio/ogg'
                 : 'audio/flac';
      downloadBlob(
        new Blob([new Uint8Array(raw)], { type: mime }),
        file.name.replace(/\.[^.]+$/, `.${outputFormat}`),
      );

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const isProcessing = status === 'loading-wasm' || status === 'converting';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip
        onFiles={handleFiles}
        accept={{
          'audio/mpeg':   ['.mp3'],
          'audio/wav':    ['.wav'],
          'audio/ogg':    ['.ogg'],
          'audio/flac':   ['.flac'],
          'audio/x-flac': ['.flac'],
        }}
        formatHint={t('uploadHint')}
        disabled={isProcessing}
      />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File info */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          {/* Waveform */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('waveform')}</p>
            <canvas
              ref={canvasRef}
              width={600}
              height={80}
              className="w-full rounded-lg border border-border bg-muted/30"
            />
          </div>

          {/* Output format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('outputFormat')}</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button key={f} onClick={() => setOutputFormat(f)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors',
                    outputFormat === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {status === 'loading-wasm' && (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">{t('loadingWasm')}</span>
            </div>
          )}
          {status === 'converting' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{t('converting', { pct: progress })}</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'done' && <p className="text-xs text-green-600 dark:text-green-400">{t('done')}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleConvert} disabled={isProcessing}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
              !isProcessing
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {isProcessing && (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            )}
            {isProcessing ? t('converting', { pct: progress }) : `${outputFormat.toUpperCase()}로 변환`}
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
