'use client';

import { useState } from 'react';
import { RotateCw, Download, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';
import { rotateImageBlob } from '../../lib/imageRotation';

const ROTATION_OPTIONS: Array<{ degrees: 90 | 180 | 270 | 360; label: string }> = [
  { degrees: 90,  label: '90°'  },
  { degrees: 180, label: '180°' },
  { degrees: 270, label: '270°' },
  { degrees: 360, label: '↺'   },
];

export function RotationToolbar() {
  const { files, selectedFileIds, rotateSelectedFiles, removeFile, clearSelection } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasSelection = selectedFileIds.length > 0;

  const handleSave = async () => {
    const targets = files.filter((f) => selectedFileIds.includes(f.id));
    if (targets.length === 0) return;

    setIsSaving(true);
    setProgress(0);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < targets.length; i++) {
        const file = targets[i];
        const blob = await rotateImageBlob(file.originalUrl, file.rotation, file.file.type);
        const baseName = file.file.name.replace(/\.[^.]+$/, '');
        const ext = file.file.name.split('.').pop() ?? 'jpg';
        zip.file(`${baseName}_rotated.${ext}`, blob);
        setProgress(Math.round(((i + 1) / targets.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated_images.zip`;
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

      {/* 변환하기 버튼 */}
      <Button
        size="default"
        disabled={!hasSelection || isSaving}
        onClick={handleSave}
        className="ml-auto gap-2 font-bold px-5"
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
  );
}
