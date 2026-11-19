import type { NormalizedPlacement } from '@/lib/drop-sign/index';

export interface PdfCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function placementToPdf(
  placement: NormalizedPlacement,
  pageWidthPt: number,
  pageHeightPt: number,
): PdfCoords {
  return {
    x:      placement.x * pageWidthPt,
    y:      (1 - placement.y - placement.height) * pageHeightPt,
    width:  placement.width * pageWidthPt,
    height: placement.height * pageHeightPt,
  };
}
