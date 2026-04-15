// src/components/image/tools/ImageToPdfTool.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { imagesToPdf } from '@/lib/pdfConvert';
import { downloadBytes } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type PageSize = 'a4' | 'letter' | 'fit';
type Status   = 'idle' | 'loading' | 'done' | 'error';

export function ImageToPdfTool({ onClose }: Props) {
  const t = useTranslations('imageToPdf');
  const { images, selectedIds } = useAppContext();

  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [margin,   setMargin]   = useState(20);
  const [status,   setStatus]   = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  const handleCreate = useCallback(async () => {
    if (selectedImages.length === 0) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const files = selectedImages.map((img) => img.file);
      const bytes = await imagesToPdf(files, pageSize, margin);
      downloadBytes(bytes, 'images.pdf');
      setStatus('done');
    } catch (err) {
      console.error('Image to PDF failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, pageSize, margin]);

  const PAGE_SIZES: PageSize[] = ['a4', 'letter', 'fit'];
  const PAGE_LABELS: Record<PageSize, string> = {
    a4:     t('sizeA4'),
    letter: t('sizeLetter'),
    fit:    t('sizeFit'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[320px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('title')}</h2>
        </div>

        {status === 'idle' && (
          <>
            <div className="mb-4">
              <p className="mb-2 text-[11px] text-[#888]">{t('pageSize')}</p>
              <div className="flex gap-1.5">
                {PAGE_SIZES.map((ps) => (
                  <button
                    key={ps}
                    onClick={() => setPageSize(ps)}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors',
                      pageSize === ps
                        ? 'bg-[#0a84ff] text-white'
                        : 'bg-[#2c2c2e] text-[#aaa] hover:bg-[#3a3a3c]',
                    )}
                  >
                    {PAGE_LABELS[ps]}
                  </button>
                ))}
              </div>
            </div>

            {pageSize !== 'fit' && (
              <div className="mb-4 flex items-center gap-3">
                <label className="text-[12px] text-[#aaa]">{t('margin')}</label>
                <input
                  type="range" min={0} max={72} step={4} value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="flex-1 accent-[#0a84ff]"
                />
                <span className="w-10 text-right text-[12px] text-[#aaa]">{margin}pt</span>
              </div>
            )}

            <p className="mb-4 text-[11px] text-[#aaa]">{selectedImages.length}장 선택됨</p>
          </>
        )}

        {status === 'loading' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-[#0a84ff] border-t-transparent rounded-full inline-block" />
            <span className="text-[12px] text-[#888]">{t('creating')}</span>
          </div>
        )}

        {status === 'done' && (
          <p className="mb-4 text-[12px] text-[#30d158]">PDF 생성 완료!</p>
        )}
        {status === 'error' && (
          <p className="mb-4 text-[12px] text-[#ff453a] break-words">오류: {errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors">
            {t('close')}
          </button>
          {status === 'idle' && (
            <button
              onClick={handleCreate}
              disabled={selectedImages.length === 0}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                selectedImages.length > 0
                  ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
                  : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
              )}
            >
              {t('create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
