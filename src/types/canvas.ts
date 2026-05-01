export interface BaseEl {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface ImageEl extends BaseEl {
  type: 'image';
  src: string;
}

export interface TextEl extends BaseEl {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
}

export interface ShapeEl extends BaseEl {
  type: 'shape';
  shape: 'rect' | 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type CanvasElement = ImageEl | TextEl | ShapeEl;

export type CanvasBackground =
  | { type: 'color'; color: string }
  | { type: 'gradient'; from: string; to: string; direction: 'horizontal' | 'vertical' }
  | { type: 'image'; src: string };

export interface CanvasSize {
  width: number;
  height: number;
  label: string;
}

export interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  background: CanvasBackground;
  canvasSize: CanvasSize;
}

export type ToolType = 'select' | 'text' | 'shape-rect' | 'shape-circle' | 'image' | 'background';

export const CANVAS_PRESETS: CanvasSize[] = [
  { width: 800, height: 800, label: '1:1' },
  { width: 800, height: 1000, label: '4:5' },
  { width: 675, height: 1200, label: '9:16' },
  { width: 1280, height: 720, label: '16:9' },
  { width: 800, height: 600, label: 'Free' },
];

export const DEFAULT_CANVAS_STATE: CanvasState = {
  elements: [],
  selectedId: null,
  background: { type: 'color', color: '#ffffff' },
  canvasSize: CANVAS_PRESETS[0],
};
