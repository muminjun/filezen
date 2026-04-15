'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Tab = 'qr' | 'barcode';
type BarcodeFormat = 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'CODE39';

const BARCODE_FORMATS: BarcodeFormat[] = ['CODE128', 'EAN13', 'EAN8', 'UPC', 'ITF14', 'CODE39'];

export function QrBarcodeTool() {
  const t = useTranslations('convert.qrBarcode');

  const [tab,           setTab]           = useState<Tab>('qr');
  const [input,         setInput]         = useState('https://example.com');
  const [fgColor,       setFgColor]       = useState('#000000');
  const [bgColor,       setBgColor]       = useState('#ffffff');
  const [size,          setSize]          = useState(256);
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128');
  const [qrDataUrl,     setQrDataUrl]     = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  const svgRef    = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // QR 코드 생성
  useEffect(() => {
    if (tab !== 'qr' || !input.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        // qrcode has no default export — import the module namespace and use toDataURL directly
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(input, {
          width: size,
          color: { dark: fgColor, light: bgColor },
          margin: 2,
        });
        if (!cancelled) {
          setQrDataUrl(url);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [tab, input, fgColor, bgColor, size]);

  // 바코드 생성
  useEffect(() => {
    if (tab !== 'barcode' || !input.trim() || !svgRef.current) return;
    (async () => {
      try {
        const JsBarcode = (await import('jsbarcode')).default;
        JsBarcode(svgRef.current!, input, {
          format:       barcodeFormat,
          lineColor:    fgColor,
          background:   bgColor,
          width:        2,
          height:       80,
          displayValue: true,
          fontSize:     14,
        });
        setError(null);
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [tab, input, fgColor, bgColor, barcodeFormat]);

  const downloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href     = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  const downloadBarcodePng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const canvas  = canvasRef.current!;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob    = new Blob([svgData], { type: 'image/svg+xml' });
    const url     = URL.createObjectURL(blob);
    const img     = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement('a');
        a.href     = URL.createObjectURL(b);
        a.download = 'barcode.png';
        a.click();
      }, 'image/png');
    };
    img.src = url;
  };

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob    = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'barcode.svg';
    a.click();
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
      {/* Tab selector */}
      <div className="flex gap-2">
        {(['qr', 'barcode'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === tb ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}>
            {tb === 'qr' ? t('tabQr') : t('tabBarcode')}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t('inputLabel')}</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tab === 'qr' ? t('inputPlaceholderQr') : t('inputPlaceholderBarcode')}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
      </div>

      {/* Barcode format selector */}
      {tab === 'barcode' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('barcodeFormat')}</label>
          <select value={barcodeFormat} onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary">
            {BARCODE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}

      {/* Size (QR only) */}
      {tab === 'qr' && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground w-16">{t('size')}</label>
          <input type="range" min={128} max={512} step={32} value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-primary" />
          <span className="text-xs text-muted-foreground w-16">{size}px</span>
        </div>
      )}

      {/* Colors */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('fgColor')}</label>
          <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('bgColor')}</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview */}
      <div className="flex justify-center rounded-lg border border-border bg-card p-4">
        {tab === 'qr' && qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR Code" className="max-w-full" style={{ imageRendering: 'pixelated' }} />
        )}
        {tab === 'barcode' && (
          <svg ref={svgRef} />
        )}
      </div>
      {/* Hidden canvas for PNG export of barcode */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Download buttons */}
      <div className="flex gap-2">
        <button
          onClick={tab === 'qr' ? downloadQrPng : downloadBarcodePng}
          disabled={!!error || !input.trim()}
          className={cn(
            'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
            !error && input.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
          )}>
          {t('downloadPng')}
        </button>
        {tab === 'barcode' && (
          <button
            onClick={downloadSvg}
            disabled={!!error || !input.trim()}
            className={cn(
              'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
              !error && input.trim()
                ? 'bg-muted text-foreground hover:bg-muted/80 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {t('downloadSvg')}
          </button>
        )}
      </div>
    </div>
  );
}
