'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Eye, EyeOff, ShieldCheck, ShieldOff, Info, AlertTriangle } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { isPdfPasswordProtected, unlockPdf } from '@/lib/pdfUnlock';
import { FileUploadStrip } from '../FileUploadStrip';

type DetectionState = 'idle' | 'detecting' | 'protected' | 'notProtected';

export function UnlockTool() {
  const t = useTranslations('file.unlock');

  const [file, setFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<DetectionState>('idle');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockedBytes, setUnlockedBytes] = useState<Uint8Array | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;

    setFile(f);
    setDetection('detecting');
    setPassword('');
    setError(null);
    setUnlockedBytes(null);

    try {
      const protected_ = await isPdfPasswordProtected(f);
      setDetection(protected_ ? 'protected' : 'notProtected');
    } catch {
      setDetection('idle');
      setError('Failed to read PDF. The file may be corrupted.');
    }
  }, []);

  const handleUnlock = async () => {
    if (!file || !password) return;
    setIsUnlocking(true);
    setError(null);
    setUnlockedBytes(null);

    try {
      const bytes = await unlockPdf(file, password);
      setUnlockedBytes(bytes);
    } catch (err: unknown) {
      const isPasswordErr =
        err !== null &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'PasswordException';
      setError(isPasswordErr ? t('wrongPassword') : 'An unexpected error occurred.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDownloadUnlocked = () => {
    if (!unlockedBytes || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadBytes(unlockedBytes, `${baseName}-unlocked.pdf`);
  };

  const handleDownloadOriginal = () => {
    if (!file) return;
    const bytes = new Uint8Array();
    // Use the original file as-is
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    void bytes; // suppress unused warning
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip
        onFiles={handleFiles}
        disabled={isUnlocking || detection === 'detecting'}
        multiple={false}
      />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File info */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Detecting */}
          {detection === 'detecting' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block flex-shrink-0" />
              Checking PDF...
            </div>
          )}

          {/* Not password protected */}
          {detection === 'notProtected' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 dark:bg-blue-950/30 dark:border-blue-800">
                <ShieldOff size={16} className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">{t('notProtected')}</span>
              </div>
              <button
                onClick={handleDownloadOriginal}
                className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                {t('notProtectedDownload')}
              </button>
            </div>
          )}

          {/* Password protected — input form */}
          {detection === 'protected' && !unlockedBytes && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:bg-amber-950/30 dark:border-amber-800">
                <ShieldCheck size={16} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  이 PDF는 비밀번호로 보호되어 있습니다.
                </span>
              </div>

              {/* Password input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('passwordLabel')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUnlock();
                    }}
                    placeholder={t('passwordPlaceholder')}
                    disabled={isUnlocking}
                    className={cn(
                      'w-full rounded-md border border-border bg-card px-3 py-2 pr-10 text-sm outline-none transition-all',
                      'focus:border-primary focus:ring-1 focus:ring-primary/30',
                      error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
                      isUnlocking && 'opacity-50 cursor-not-allowed'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && (
                  <span className="text-xs text-red-500">{error}</span>
                )}
              </div>

              {/* Rasterization warning */}
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-950/30 dark:border-amber-800">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-700 dark:text-amber-400">{t('rasterWarning')}</span>
              </div>

              {/* Unlock button */}
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || !password}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
                  !isUnlocking && password
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                )}
              >
                {isUnlocking ? t('unlocking') : t('unlock')}
              </button>
            </div>
          )}

          {/* Success */}
          {unlockedBytes && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 dark:bg-green-950/30 dark:border-green-800">
                <ShieldOff size={16} className="flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">{t('unlockSuccess')}</span>
              </div>
              <button
                onClick={handleDownloadUnlocked}
                className="flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                {t('download')}
              </button>
            </div>
          )}

          {/* Privacy note */}
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70 mt-auto pt-2">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span>{t('privacyNote')}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
