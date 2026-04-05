'use client';

import { useState } from 'react';
import { RotateCw, Download, Loader2, Trash2, FolderDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';
import { rotateImageBlob } from '../../lib/imageRotation';

const ROTATION_OPTIONS: Array<{ degrees: 90 | 180 | 270 | 360; label: string }> = [
  { degrees: 90,  label: '90°'  },
  { degrees: 180, label: '180°' },
  { degrees: 270, label: '270°' },
  { degrees: 360, label: '↺'   },
];

function getDefaultFolderName(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `rotated_${y}${m}${d}`;
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').trim() || getDefaultFolderName();
}

export function RotationToolbar() {
  const { files, selectedFileIds, rotateSelectedFiles, removeFile, clearSelection } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [folderName, setFolderName] = useState(getDefaultFolderName);

  const hasSelection = selectedFileIds.length > 0;

  const handleSave = async () => {
    const targets = files.filter((f) => selectedFileIds.includes(f.id));
    if (targets.length === 0) return;

    setIsSaving(true);
    setProgress(0);

    const safeFolder = sanitizeFolderName(folderName);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder(safeFolder)!;

      for (let i = 0; i < targets.length; i++) {
        const file = targets[i];
        const blob = await rotateImageBlob(file.originalUrl, file.rotation, file.file.type);
        folder.file(file.file.name, blob);
        setProgress(Math.round(((i + 1) / targets.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFolder}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsSaving(false);
      setProgress(0);
    }
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 flex-wrap transition-colors duration-200 ${
      hasSelection
        ? 'border-primary/40 bg-primary/5'
        : 'border-muted-foreground/20 bg-muted/30'
    }`}>
      {/* 선택 상태 표시 */}
      <div className="flex items-center gap-2 min-w-[80px]">
        <RotateCw className={`h-4 w-4 ${hasSelection ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={`text-sm font-medium ${hasSelection ? 'text-primary' : 'text-muted-foreground'}`}>
          {hasSelection ? `${selectedFileIds.length}개 선택` : '미선택'}
        </span>
      </div>

      {/* 회전 버튼 */}
      <div className="flex gap-1">
        {ROTATION_OPTIONS.map(({ degrees, label }) => (
          <Button
            key={degrees}
            variant={degrees === 360 ? 'outline' : 'secondary'}
            size="sm"
            disabled={!hasSelection || isSaving}
            onClick={() => rotateSelectedFiles(degrees)}
            className="min-w-[40px] font-semibold"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 삭제 버튼 */}
      <Button
        variant="destructive"
        size="sm"
        disabled={!hasSelection || isSaving}
        onClick={() => {
          selectedFileIds.forEach((id) => removeFile(id));
          clearSelection();
        }}
        className="gap-1"
      >
        <Trash2 className="h-4 w-4" />
        삭제
      </Button>

      {/* 폴더 이름 입력 + 저장 */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-muted-foreground/30 bg-background px-2 py-1">
          <FolderDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder={getDefaultFolderName()}
            disabled={isSaving}
            className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
            aria-label="저장할 폴더 이름"
          />
        </div>

        <Button
          size="default"
          disabled={!hasSelection || isSaving}
          onClick={handleSave}
          className="gap-2 font-bold px-5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              저장 중 {progress}%
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              변환하기 {hasSelection ? `(${selectedFileIds.length}장)` : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
