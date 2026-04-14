'use client';

import { useState } from 'react';
import type { ExportFormat, ExportScale } from '@/lib/collageExport';

export function useCollageExport(canvasRef: React.RefObject<HTMLDivElement>) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<ExportScale>(2);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const { exportCollage } = await import('@/lib/collageExport');
      await exportCollage({ format, scale, element: canvasRef.current });
    } finally {
      setIsExporting(false);
    }
  };

  return { format, setFormat, scale, setScale, isExporting, handleExport };
}
