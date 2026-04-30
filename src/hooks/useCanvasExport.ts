import { useCallback, useState } from 'react';
import type Konva from 'konva';

export function useCanvasExport(stageRef: React.RefObject<Konva.Stage | null>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!stageRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
      const link = document.createElement('a');
      link.download = `canvas-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [stageRef]);

  return { isExporting, handleExport };
}
