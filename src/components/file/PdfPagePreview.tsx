'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getPdfjsLib } from '@/lib/pdfjsLoader';

interface PageData {
  url: string;
  widthPt: number;
  heightPt: number;
}

export interface ActivePageInfo {
  pageIndex: number; // 1-based
  widthPt: number;
  heightPt: number;
}

export interface SigOverlay {
  id: number;
  pageIndex: number; // 1-based
  dataUrl: string;
  placement: { x: number; y: number; width: number; height: number };
}

interface Props {
  file: File;
  zoom: number;
  overlays?: SigOverlay[];
  onPageCount: (count: number) => void;
  onActivePage: (info: ActivePageInfo) => void;
  onActiveEl: (el: HTMLImageElement | null) => void;
  onError?: (err: unknown) => void;
}

export function PdfPagePreview({ file, zoom, overlays = [], onPageCount, onActivePage, onActiveEl, onError }: Props) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [pagesFile, setPagesFile] = useState(file);
  // file이 바뀌면 렌더 중에 이전 페이지를 비운다 (effect 내 동기 setState 회피)
  if (pagesFile !== file) {
    setPagesFile(file);
    setPages([]);
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefs      = useRef<(HTMLImageElement | null)[]>([]);

  const cbRefs = useRef({ onPageCount, onActivePage, onActiveEl, onError });
  useLayoutEffect(() => {
    cbRefs.current = { onPageCount, onActivePage, onActiveEl, onError };
  });

  // Render all pages sequentially to data URLs (runs only when file changes)
  useEffect(() => {
    let cancelled = false;
    imgRefs.current = [];

    async function renderAll() {
      const pdfjsLib = await getPdfjsLib();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      if (cancelled) { await pdf.destroy(); return; }

      cbRefs.current.onPageCount(pdf.numPages);
      const containerWidth = Math.max(containerRef.current?.clientWidth ?? 600, 100);

      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) break;
        const page = await pdf.getPage(i);
        const nat = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (containerWidth / nat.width) * 2 }); // 2× retina

        const offscreen = document.createElement('canvas');
        offscreen.width  = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext('2d')!;
        const task = page.render({ canvas: offscreen, canvasContext: ctx, viewport });

        try {
          await task.promise;
        } catch (e: unknown) {
          if ((e as { name?: string })?.name === 'RenderingCancelledException') break;
          throw e;
        }

        if (cancelled) break;
        const url = offscreen.toDataURL('image/jpeg', 0.85);
        setPages(prev => [...prev, { url, widthPt: nat.width, heightPt: nat.height }]);
      }

      await pdf.destroy();
    }

    renderAll().catch(err => { if (!cancelled) cbRefs.current.onError?.(err); });
    return () => { cancelled = true; };
  }, [file]);

  // Track the most-visible page via IntersectionObserver
  useEffect(() => {
    if (pages.length === 0) return;
    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const idx = parseInt((e.target as HTMLElement).dataset.pageIdx ?? '0');
        ratios.set(idx, e.intersectionRatio);
      });

      let maxRatio = -1, activeIdx = 0;
      ratios.forEach((r, i) => { if (r > maxRatio) { maxRatio = r; activeIdx = i; } });

      const page = pages[activeIdx];
      if (page) {
        cbRefs.current.onActivePage({ pageIndex: activeIdx + 1, widthPt: page.widthPt, heightPt: page.heightPt });
        cbRefs.current.onActiveEl(imgRefs.current[activeIdx] ?? null);
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    imgRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [pages]);

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-muted-foreground animate-pulse">렌더링 중…</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 w-full">
      {pages.map((page, idx) => {
        const pageOverlays = overlays.filter(o => o.pageIndex === idx + 1);
        return (
          <div
            key={idx}
            className="relative shadow-sm"
            style={{ width: `${zoom * 100}%` }}
          >
            <img
              ref={el => { imgRefs.current[idx] = el; }}
              src={page.url}
              data-page-idx={String(idx)}
              alt={`Page ${idx + 1}`}
              draggable={false}
              className="block w-full rounded-md border border-border select-none"
            />
            {pageOverlays.map(o => (
              <img
                key={o.id}
                src={o.dataUrl}
                alt="signature"
                draggable={false}
                style={{
                  position: 'absolute',
                  left:   `${o.placement.x * 100}%`,
                  top:    `${o.placement.y * 100}%`,
                  width:  `${o.placement.width * 100}%`,
                  height: `${o.placement.height * 100}%`,
                  pointerEvents: 'none',
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
