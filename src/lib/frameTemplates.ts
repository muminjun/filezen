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

// photoCount >= 0, cols >= 1
export function buildEqualSlots(photoCount: number, cols: number): SlotDef[] {
  const slots: SlotDef[] = [];
  for (let i = 0; i < photoCount; i++) {
    slots.push({
      col: (i % cols) + 1,
      row: Math.floor(i / cols) + 1,
      colSpan: 1,
      rowSpan: 1,
    });
  }
  return slots;
}

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
    id: 'pb-3',
    labelKey: 'pb-3',
    category: 'photobooth',
    canvasRatio: [2, 3],
    outputWidth: 1200,
    grid: { cols: 1, rows: 3 },
    slots: buildEqualSlots(3, 1),
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
    id: 'pb-9',
    labelKey: 'pb-9',
    category: 'photobooth',
    canvasRatio: [2, 3],
    outputWidth: 1200,
    grid: { cols: 3, rows: 3 },
    slots: buildEqualSlots(9, 3),
  },
  {
    id: 'pb-12',
    labelKey: 'pb-12',
    category: 'photobooth',
    canvasRatio: [2, 3],
    outputWidth: 1200,
    grid: { cols: 3, rows: 4 },
    slots: buildEqualSlots(12, 3),
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

// 두 인접 1×1 슬롯을 병합. 인접하지 않거나 병합 불가이면 원본 반환.
export function mergeSlots(
  slots: SlotDef[],
  _grid: { cols: number; rows: number }, // reserved — bounds validation not yet implemented
  indexA: number,
  indexB: number,
): SlotDef[] {
  const a = slots[indexA];
  const b = slots[indexB];
  if (a.colSpan !== 1 || a.rowSpan !== 1 || b.colSpan !== 1 || b.rowSpan !== 1) return slots;

  const isHorizontal = a.row === b.row && Math.abs(a.col - b.col) === 1;
  const isVertical = a.col === b.col && Math.abs(a.row - b.row) === 1;
  if (!isHorizontal && !isVertical) return slots;

  const mergedSlot: SlotDef = isHorizontal
    ? { col: Math.min(a.col, b.col), row: a.row, colSpan: 2, rowSpan: 1 }
    : { col: a.col, row: Math.min(a.row, b.row), colSpan: 1, rowSpan: 2 };

  const result = [...slots];
  result[indexA] = mergedSlot;
  result.splice(indexB, 1);
  return result;
}

// 병합된 슬롯을 두 슬롯으로 분리 (좌→좌+우, 또는 상→상+하).
// 이미 1×1이면 원본 반환. colSpan/rowSpan > 2인 경우 slotB는 1×1이 아닐 수 있음.
export function splitSlot(
  slots: SlotDef[],
  _grid: { cols: number; rows: number }, // reserved — bounds validation not yet implemented
  index: number,
): SlotDef[] {
  const slot = slots[index];
  if (slot.colSpan === 1 && slot.rowSpan === 1) return slots;

  let slotA: SlotDef;
  let slotB: SlotDef;

  if (slot.colSpan > 1) {
    slotA = { col: slot.col,     row: slot.row, colSpan: 1,                  rowSpan: slot.rowSpan };
    slotB = { col: slot.col + 1, row: slot.row, colSpan: slot.colSpan - 1,   rowSpan: slot.rowSpan };
  } else {
    slotA = { col: slot.col, row: slot.row,     colSpan: slot.colSpan, rowSpan: 1 };
    slotB = { col: slot.col, row: slot.row + 1, colSpan: slot.colSpan, rowSpan: slot.rowSpan - 1 };
  }

  const result = [...slots];
  result.splice(index, 1, slotA, slotB);
  return result;
}
