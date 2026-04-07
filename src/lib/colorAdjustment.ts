import type { ColorAdjustment } from './types';

export const DEFAULT_ADJUSTMENT: ColorAdjustment = {
  exposure:   0,
  brilliance: 0,
  highlights: 0,
  shadows:    0,
  contrast:   0,
  brightness: 0,
  blackpoint: 0,
  saturation: 0,
  vibrance:   0,
  warmth:     0,
  tint:       0,
  sharpness:  0,
  definition: 0,
  noise:      0,
  vignette:   0,
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * ColorAdjustment → CSS filter 문자열 변환
 * Canvas ctx.filter에도 동일하게 사용 가능 (미리보기 = 출력 결과 보장)
 */
export function buildCssFilter(adj: ColorAdjustment): string {
  const brightness = 1 + (adj.exposure + adj.brightness) / 100;
  const contrast   = 1 + adj.contrast / 100;
  const saturate   = 1 + (adj.saturation + adj.vibrance * 0.4) / 100;
  const hueRotate  = adj.warmth * 0.3;

  const parts = [
    `brightness(${clamp(brightness, 0.05, 3).toFixed(2)})`,
    `contrast(${clamp(contrast, 0.1, 3).toFixed(2)})`,
    `saturate(${clamp(saturate, 0, 3).toFixed(2)})`,
    hueRotate !== 0 ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** 모든 값이 기본값(0)인지 확인 */
export function isDefaultAdjustment(adj: ColorAdjustment): boolean {
  return Object.values(adj).every((v) => v === 0);
}
