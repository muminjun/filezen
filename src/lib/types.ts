export interface ColorAdjustment {
  exposure:   number; // -100 ~ 100
  brilliance: number; // -100 ~ 100
  highlights: number; // -100 ~ 0
  shadows:    number; //    0 ~ 100
  contrast:   number; // -100 ~ 100
  brightness: number; // -100 ~ 100
  blackpoint: number; //    0 ~ 100
  saturation: number; // -100 ~ 100
  vibrance:   number; // -100 ~ 100
  warmth:     number; // -100 ~ 100
  tint:       number; // -100 ~ 100
  sharpness:  number; //    0 ~ 100
  definition: number; //    0 ~ 100
  noise:      number; //    0 ~ 100
  vignette:   number; //    0 ~ 100
}

export interface ResizeData {
  width: number;    // px 또는 % 값
  height: number;
  unit: 'px' | '%';
  lockAspect: boolean;
}

export type WatermarkPosition =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkConfig {
  text: string;
  fontSize: number;   // 12–120
  color: string;      // CSS hex e.g. '#ffffff'
  opacity: number;    // 0.0–1.0
  position: WatermarkPosition;
  repeat: boolean;
}

export interface CropData {
  x:           number;       // 0.0 ~ 1.0 (비율)
  y:           number;
  width:       number;
  height:      number;
  rotation:    number;       // -45 ~ 45
  aspectRatio: string | null; // '4:3', '16:9', null(자유)
}

export interface SavedAdjustment {
  id:         string;
  name:       string;
  adjustment: ColorAdjustment;
  createdAt:  number;
}

export interface ImageFile {
  id:               string;
  file:             File;
  previewUrl:       string;
  rotation:         number;
  flipped:          boolean;
  colorAdjustment?: ColorAdjustment;
  cropData?:        CropData;
  stripExif?:       boolean;
  resizeData?:      ResizeData;
  watermark?:       WatermarkConfig;
}

export type OutputFormat = 'original' | 'png' | 'jpeg' | 'webp';

export interface AppContextType {
  images:                   ImageFile[];
  selectedIds:              Set<string>;
  isDownloading:            boolean;
  outputFormat:             OutputFormat;
  quality:                  number;
  savedAdjustments:         SavedAdjustment[];
  recentAdjustments:        ColorAdjustment[];
  addImages:                (files: File[]) => Promise<void>;
  removeImage:              (id: string) => void;
  removeAllImages:          () => void;
  reorderImages:            (startIndex: number, endIndex: number) => void;
  toggleSelect:             (id: string) => void;
  rangeSelect:              (fromId: string, toId: string) => void;
  selectAll:                () => void;
  clearSelection:           () => void;
  rotateSelected:           (degrees: number) => void;
  flipSelected:             () => void;
  setOutputFormat:          (format: OutputFormat) => void;
  setQuality:               (quality: number) => void;
  downloadAsZip:            () => Promise<void>;
  applyEditToSelected:      (edit: { colorAdjustment?: ColorAdjustment; cropData?: CropData }) => void;
  saveAdjustment:           (name: string, adj: ColorAdjustment) => void;
  applyResizeToSelected:    (resize: ResizeData | undefined) => void;
  applyWatermarkToSelected: (watermark: WatermarkConfig | undefined) => void;
  toggleStripExifOnSelected: () => void;
  replaceImageBlob:         (id: string, newBlob: Blob, newFileName: string) => void;
}

// ─── File / PDF Toolkit types ────────────────────────────────────────────────

export type FileToolMode =
  | 'page-manager'
  | 'merge'
  | 'split'
  | 'convert'
  | 'compress'
  | 'unlock'
  | 'protect'
  | 'pdf-watermark'
  | 'sign'
  | 'extract';

/** A single PDF page with rendered thumbnail */
export interface PdfPage {
  pageIndex: number;  // 0-based original page index
  thumbnail: string;  // blob URL (must be revoked on cleanup)
  rotation: number;   // additional rotation applied: 0 | 90 | 180 | 270
}

export interface FileContextType {
  activeTool: FileToolMode;
  setActiveTool: (tool: FileToolMode) => void;
}

// ─── Convert Toolkit types ────────────────────────────────────────────────────

export type ConvertToolMode = 'icon' | 'social' | 'palette' | 'video-to-gif' | 'ocr';

export interface ConvertContextType {
  activeTool: ConvertToolMode;
  setActiveTool: (tool: ConvertToolMode) => void;
}
