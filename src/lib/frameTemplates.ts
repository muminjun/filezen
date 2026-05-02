export interface SlotDef {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface FrameTemplate {
  id: string;
  labelKey: string;
  category: 'photobooth' | 'social';
  canvasRatio: [number, number]; // [width, height]
  outputWidth: number;
  grid: { cols: number; rows: number };
  slots: SlotDef[];
}

export interface FrameOptionsState {
  orientation: 'portrait' | 'landscape';
  gapColor: string;
  gapSize: number;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
}

export const DEFAULT_FRAME_OPTIONS: FrameOptionsState = {
  orientation: 'portrait',
  gapColor: '#ffffff',
  gapSize: 8,
  borderRadius: 0,
  borderColor: '#000000',
  borderWidth: 0,
};

export const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: 'pb-2',
    labelKey: 'pb-2',
    category: 'photobooth',
    canvasRatio: [2, 3],
    outputWidth: 1200,
    grid: { cols: 1, rows: 2 },
    slots: [
      { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      { col: 1, row: 2, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: 'pb-4',
    labelKey: 'pb-4',
    category: 'photobooth',
    canvasRatio: [2, 3],
    outputWidth: 1200,
    grid: { cols: 1, rows: 4 },
    slots: [
      { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      { col: 1, row: 2, colSpan: 1, rowSpan: 1 },
      { col: 1, row: 3, colSpan: 1, rowSpan: 1 },
      { col: 1, row: 4, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: 'pb-6',
    labelKey: 'pb-6',
    category: 'photobooth',
    canvasRatio: [2, 3],
    outputWidth: 1200,
    grid: { cols: 2, rows: 3 },
    slots: [
      { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      { col: 2, row: 1, colSpan: 1, rowSpan: 1 },
      { col: 1, row: 2, colSpan: 1, rowSpan: 1 },
      { col: 2, row: 2, colSpan: 1, rowSpan: 1 },
      { col: 1, row: 3, colSpan: 1, rowSpan: 1 },
      { col: 2, row: 3, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: 'social-story',
    labelKey: 'social-story',
    category: 'social',
    canvasRatio: [9, 16],
    outputWidth: 1080,
    grid: { cols: 1, rows: 1 },
    slots: [{ col: 1, row: 1, colSpan: 1, rowSpan: 1 }],
  },
  {
    id: 'social-feed-sq',
    labelKey: 'social-feed-sq',
    category: 'social',
    canvasRatio: [1, 1],
    outputWidth: 1080,
    grid: { cols: 1, rows: 1 },
    slots: [{ col: 1, row: 1, colSpan: 1, rowSpan: 1 }],
  },
  {
    id: 'social-feed-port',
    labelKey: 'social-feed-port',
    category: 'social',
    canvasRatio: [4, 5],
    outputWidth: 1080,
    grid: { cols: 1, rows: 1 },
    slots: [{ col: 1, row: 1, colSpan: 1, rowSpan: 1 }],
  },
  {
    id: 'social-yt',
    labelKey: 'social-yt',
    category: 'social',
    canvasRatio: [16, 9],
    outputWidth: 1280,
    grid: { cols: 1, rows: 1 },
    slots: [{ col: 1, row: 1, colSpan: 1, rowSpan: 1 }],
  },
  {
    id: 'social-tw',
    labelKey: 'social-tw',
    category: 'social',
    canvasRatio: [16, 9],
    outputWidth: 1600,
    grid: { cols: 1, rows: 1 },
    slots: [{ col: 1, row: 1, colSpan: 1, rowSpan: 1 }],
  },
];

export function getTemplate(id: string): FrameTemplate | undefined {
  return FRAME_TEMPLATES.find((t) => t.id === id);
}

export function getNaturalOrientation(
  template: FrameTemplate,
): 'portrait' | 'landscape' {
  const [w, h] = template.canvasRatio;
  return w > h ? 'landscape' : 'portrait';
}

export function getOrientedRatio(
  template: FrameTemplate,
  orientation: 'portrait' | 'landscape',
): [number, number] {
  if (template.slots.length !== 1) return template.canvasRatio;
  const [w, h] = template.canvasRatio;
  if (w === h) return [w, h];
  const isCurrentLandscape = w > h;
  const wantLandscape = orientation === 'landscape';
  return isCurrentLandscape === wantLandscape ? [w, h] : [h, w];
}
