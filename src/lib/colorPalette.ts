/**
 * color-thief-browser 래퍼 + HEX/RGB/HSL 변환 유틸
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface PaletteColor {
  rgb: RgbColor;
  hex: string;
  hsl: HslColor;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export async function extractPalette(
  file: File,
  count: number
): Promise<PaletteColor[]> {
  const { default: ColorThief } = await import('color-thief-browser');
  const img = await loadImage(file);
  const colorThief = new ColorThief();
  const rawPalette: number[][] = colorThief.getPalette(img, count);

  return rawPalette.map(([r, g, b]) => {
    const rgb: RgbColor = { r, g, b };
    return { rgb, hex: rgbToHex(rgb), hsl: rgbToHsl(rgb) };
  });
}

export function toCssVars(palette: PaletteColor[]): string {
  return palette.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n');
}

export function toJson(palette: PaletteColor[]): string {
  return JSON.stringify(
    palette.map((c) => ({
      hex: c.hex,
      rgb: [c.rgb.r, c.rgb.g, c.rgb.b],
      hsl: { h: c.hsl.h, s: c.hsl.s, l: c.hsl.l },
    })),
    null,
    2
  );
}
