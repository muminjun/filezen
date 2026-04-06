export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string; // ObjectURL (썸네일 표시용, revokeObjectURL 필요)
  rotation: number;   // CSS 미리보기 회전각 (0~359, 누적)
}

export type OutputFormat = 'original' | 'png' | 'jpeg' | 'webp';

export interface AppContextType {
  images: ImageFile[];
  selectedIds: Set<string>;
  isDownloading: boolean;
  outputFormat: OutputFormat;
  quality: number;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  removeAllImages: () => void;
  toggleSelect: (id: string) => void;
  rangeSelect: (fromId: string, toId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  rotateSelected: (degrees: number) => void;
  setOutputFormat: (format: OutputFormat) => void;
  setQuality: (quality: number) => void;
  downloadAsZip: () => Promise<void>;
}
