# Batch Rotate & Save to Named Subfolder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택한 이미지들을 일괄 회전 후, 사용자가 지정한 이름의 서브폴더 구조로 ZIP 저장할 수 있게 한다.

**Architecture:** RotationToolbar에 폴더 이름 입력 필드를 추가하고, 기존 ZIP 생성 로직을 수정해 `[folderName]/originalFilename.ext` 구조로 저장한다. 파일명은 `_rotated` 접미사 없이 원본 이름 그대로 유지한다.

**Tech Stack:** React 19 (useState), jszip, Tailwind CSS, TypeScript

---

## 파일 변경 범위

| 파일 | 변경 종류 | 내용 |
|------|----------|------|
| `src/components/upload/RotationToolbar.tsx` | Modify | 폴더 이름 input 추가 + ZIP 구조 변경 |

> 다른 파일 수정 불필요 — 모든 로직이 RotationToolbar 내에서 자급자족한다.

---

## Task 1: 폴더 이름 입력 필드 + ZIP 서브폴더 저장

**Files:**
- Modify: `src/components/upload/RotationToolbar.tsx`

현재 동작:
- ZIP 내 파일 경로: `baseName_rotated.ext` (루트에 flat하게)
- ZIP 파일명: `rotated_images.zip`

목표 동작:
- ZIP 내 파일 경로: `[folderName]/originalFilename.ext` (서브폴더 안에)
- ZIP 파일명: `[folderName].zip`
- 폴더 이름 입력창이 툴바에 노출 (기본값: `rotated_YYYYMMDD`)
- 폴더 이름이 비어 있으면 기본값 사용

---

- [ ] **Step 1: 현재 파일 정확한 내용 확인**

```bash
cat -n src/components/upload/RotationToolbar.tsx
```

Expected: 124줄. `zip.file(`${baseName}_rotated.${ext}`, blob)` 라인 확인.

---

- [ ] **Step 2: RotationToolbar.tsx 수정 — 폴더 이름 state + input + ZIP 로직 변경**

`src/components/upload/RotationToolbar.tsx` 전체를 아래로 교체:

```tsx
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
```

---

- [ ] **Step 3: TypeScript 타입 오류 없는지 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음 (exit 0)

---

- [ ] **Step 4: 개발 서버에서 빌드 통과 확인**

```bash
cd /Users/minjun/Documents/filezen && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 또는 `Route (app)` 빌드 성공 메시지

---

- [ ] **Step 5: 수동 동작 확인 체크리스트**

개발 서버 실행 후 (`npm run dev`) 브라우저에서:

1. 이미지 여러 장 업로드
2. 몇 장 선택 (체크마크 확인)
3. 90° 회전 버튼 클릭 → 갤러리에서 회전 애니메이션 확인
4. 폴더 이름 입력창에 원하는 이름 입력 (예: `여름사진_회전`)
5. "변환하기" 클릭 → 진행률 표시 확인
6. 다운로드된 `여름사진_회전.zip` 파일 압축 해제
7. 내부에 `여름사진_회전/` 폴더 존재 확인
8. 폴더 안에 원본 파일명 그대로 이미지들 저장 확인
9. 폴더 이름 비운 채로 저장 → `rotated_YYYYMMDD.zip`으로 기본값 사용 확인

---

- [ ] **Step 6: 커밋**

```bash
cd /Users/minjun/Documents/filezen
git add src/components/upload/RotationToolbar.tsx
git commit -m "feat: save rotated images to named subfolder in ZIP

- Add folder name input field to RotationToolbar
- ZIP now contains a named subfolder instead of flat structure
- Original filenames preserved (removed _rotated suffix)
- Sanitizes special characters from folder name
- ZIP file named after the folder (e.g. my_folder.zip)"
```

---

## 최종 동작 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| ZIP 파일명 | `rotated_images.zip` | `[폴더이름].zip` |
| 내부 구조 | `photo_rotated.jpg` (flat) | `[폴더이름]/photo.jpg` (서브폴더) |
| 파일명 | `원본명_rotated.ext` | `원본명.ext` (원본 그대로) |
| 폴더 이름 기본값 | — | `rotated_YYYYMMDD` |
| 특수문자 처리 | — | `/\:*?"<>\|` → `_` 로 치환 |
