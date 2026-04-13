'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Info } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { protectPdf } from '@/lib/pdfProtect';
import { FileUploadStrip } from '../FileUploadStrip';

export function ProtectTool() {
  const t = useTranslations('file.protect');

  const [file, setFile]                   = useState<File | null>(null);
  const [userPw, setUserPw]               = useState('');
  const [ownerPw, setOwnerPw]             = useState('');
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying]   = useState(false);
  const [isProtecting, setIsProtecting]   = useState(false);
  const [done, setDone]                   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  const handleProtect = async () => {
    if (!file || !userPw) return;
    setIsProtecting(true);
    setError(null);
    setDone(false);

    try {
      const bytes = await protectPdf(file, {
        userPassword:  userPw,
        ownerPassword: ownerPw,
        allowPrinting,
        allowCopying,
      });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-protected.pdf`);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsProtecting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isProtecting} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File info */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* User password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('userPassword')}
            </label>
            <input
              type="password"
              value={userPw}
              onChange={(e) => setUserPw(e.target.value)}
              placeholder={t('userPasswordPlaceholder')}
              disabled={isProtecting}
              className={cn(
                'w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-all',
                'focus:border-primary focus:ring-1 focus:ring-primary/30',
                isProtecting && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>

          {/* Owner password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('ownerPassword')}
            </label>
            <input
              type="password"
              value={ownerPw}
              onChange={(e) => setOwnerPw(e.target.value)}
              placeholder={t('ownerPasswordPlaceholder')}
              disabled={isProtecting}
              className={cn(
                'w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-all',
                'focus:border-primary focus:ring-1 focus:ring-primary/30',
                isProtecting && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>

          {/* Permissions */}
          <div className="flex flex-col gap-2">
            {[
              { label: t('allowPrinting'), value: allowPrinting, set: setAllowPrinting },
              { label: t('allowCopying'),  value: allowCopying,  set: setAllowCopying  },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>}

          <button
            onClick={handleProtect}
            disabled={isProtecting || !userPw}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isProtecting && userPw
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isProtecting ? (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
            ) : (
              <Lock size={14} />
            )}
            {isProtecting ? t('protecting') : t('protect')}
          </button>

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
