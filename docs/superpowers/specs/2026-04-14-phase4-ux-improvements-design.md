# Phase 4 — UX 개선 설계 문서

**작성일**: 2026-04-14
**담당자**: minjun
**상태**: 확정
**워크트리**: `/Users/minjun/Documents/filezen-phase4`
**브랜치**: `feat/phase4-ux` (main에서 분기)

---

## 개요

4개의 UX 개선 기능을 구현한다. 공통적으로 `activeTab` 상태를 `DrawerLayout` 로컬에서 `UIContext`로 승격하고, 각 기능을 독립된 커스텀 훅으로 분리하여 단일 책임 원칙을 유지한다.

---

## 아키텍처 변경: UIContext 도입

### 현재 상태
`DrawerLayout.tsx` 내부에 `activeTab: 'image' | 'file'`가 로컬 상태로 존재하여, 전역 이벤트 핸들러(클립보드, 드래그)가 탭을 제어하거나 읽을 수 없다.

### 변경 사항
`src/context/UIContext.tsx` 신규 생성:

```ts
interface UIContextType {
  activeTab: 'image' | 'file';
  setActiveTab: (tab: 'image' | 'file') => void;
}
```

`DrawerLayout`에서 `useState` 제거, `useUIContext()` 훅으로 교체. `UIProvider`는 `AppProvider` 바깥 또는 같은 레벨 레이아웃에 배치 (`src/app/[locale]/layout.tsx`).

---

## Feature 15: 클립보드 붙여넣기

### 훅: `src/hooks/useClipboardPaste.ts`

- `document`에 `paste` 이벤트 리스너 등록 (cleanup 포함)
- `ClipboardEvent.clipboardData.items`에서 `image/*` 타입 항목 추출
- 추출한 `DataTransferItem` → `item.getAsFile()` → `File[]` 변환
- `activeTab === 'image'`일 때만 동작하여 `addImages()` 호출
- 파일 탭 활성화 상태에서 이미지를 붙여넣으면 토스트: "이미지 탭에서 붙여넣어 주세요"
- 이미지가 아닌 콘텐츠(텍스트 등) 붙여넣기는 무시 (처리 없음)

### 주의 사항
- `navigator.clipboard.read()` (Async Clipboard API)는 권한 요청이 필요하고 Safari 지원이 제한적. `ClipboardEvent.clipboardData` 방식(동기, 이벤트 기반)만 사용하여 호환성 확보.
- 텍스트 입력 필드에 포커스가 있을 때는 이벤트를 pass-through (기본 동작 유지): `event.target`이 `input`, `textarea`, `[contenteditable]`이면 핸들러 조기 종료.

### 사용처
`DrawerLayout.tsx`에서 `useClipboardPaste()` 호출.

---

## Feature 16: 전체화면 드래그 앤 드롭존

### 훅: `src/hooks/useGlobalDrop.ts`

**이벤트 흐름**:
1. `document`에 `dragenter` → 오버레이 표시, 드래그 중인 파일 타입 분류 시작
2. `dragover` → `event.preventDefault()` (드롭 허용)
3. `dragleave` → 오버레이 숨김 (단, `relatedTarget`이 `null`일 때만 — 화면 밖으로 나갈 때)
4. `drop` → 파일 분류 후 적절한 컨텍스트에 전달, 오버레이 숨김

**파일 분류 로직**:
```ts
function classifyFiles(files: File[]): { images: File[]; pdfs: File[] } {
  const images = files.filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
  const pdfs   = files.filter(f => f.type === 'application/pdf');
  return { images, pdfs };
}
```

**탭 전환 로직**:
- 이미지만 → 이미지 탭으로 전환 후 `addImages()` 호출
- PDF만 → 파일 탭으로 전환 후 `UIContext`의 `pendingPdfFiles` 상태에 저장
- 혼합(이미지+PDF) → 더 많은 쪽 탭으로 전환, 각각 처리
- 분류 불가 파일은 무시

**오버레이 컴포넌트**: `src/components/layout/DropOverlay.tsx`
- `position: fixed; inset: 0; z-index: 9999`
- `pointer-events: none` (드롭 이벤트는 document가 수신)
- 배경: `bg-primary/10 backdrop-blur-sm`
- 중앙 카드: 파일 타입 아이콘 + "여기에 놓아주세요" 문구
- 드래그 중 타입에 따라 아이콘 변경: 이미지 → `ImageIcon`, PDF → `FileIcon`, 혼합 → `LayersIcon`
- Framer Motion `AnimatePresence`로 fade-in/out

### 파일 탭 연동
`FileContext`는 `activeTool`/`setActiveTool`만 노출하며 중앙화된 파일 상태가 없다. 각 PDF 툴(`PageManager`, `MergeTool` 등)이 자체 파일 상태를 관리한다.

따라서 PDF 드롭 시: `UIContext`에 `pendingPdfFiles: File[] | null` 상태 추가. 파일 탭으로 전환 시 `PageManager`(기본 툴)가 `useEffect`로 `pendingPdfFiles`를 감지하여 소비하고, 소비 후 `null`로 초기화. `UIContext` 인터페이스:

```ts
interface UIContextType {
  activeTab: 'image' | 'file';
  setActiveTab: (tab: 'image' | 'file') => void;
  pendingPdfFiles: File[] | null;
  setPendingPdfFiles: (files: File[] | null) => void;
}
```

### 사용처
`DrawerLayout.tsx`에서 `useGlobalDrop()` 호출. `<DropOverlay>` 렌더링.

---

## Feature 17: 작업 히스토리 / 실행 취소

### 설계 원칙
`File` 객체와 `previewUrl` blob은 원본을 참조할 뿐 복사하지 않는다. **편집 메타데이터만** 스냅샷하여 메모리를 절약한다. 이미지 추가/삭제는 히스토리 범위 밖.

### 타입 추가 (`src/lib/types.ts`)
```ts
export interface ImageEditSnapshot {
  id:               string;
  rotation:         number;
  flipped:          boolean;
  colorAdjustment?: ColorAdjustment;
  cropData?:        CropData;
  stripExif?:       boolean;
  resizeData?:      ResizeData;
  watermark?:       WatermarkConfig;
}
```

### AppContext 변경 (`src/context/AppContext.tsx`)

추가 상태:
```ts
const [editHistory, setEditHistory]     = useState<ImageEditSnapshot[][]>([]);
const [historyIndex, setHistoryIndex]   = useState(-1);
```

히스토리 푸시 헬퍼 (편집 액션 실행 **전** 현재 상태 스냅샷):
```ts
// historyIndex를 ref로 관리하여 클로저 stale 문제 회피
const historyIndexRef = useRef(-1);

function pushHistory(currentImages: ImageFile[]) {
  const snapshot: ImageEditSnapshot[] = currentImages.map(img => ({
    id: img.id, rotation: img.rotation, flipped: img.flipped,
    colorAdjustment: img.colorAdjustment, cropData: img.cropData,
    stripExif: img.stripExif, resizeData: img.resizeData, watermark: img.watermark,
  }));
  setEditHistory(prev => {
    const trimmed = prev.slice(0, historyIndexRef.current + 1); // redo 브랜치 제거
    const next = [...trimmed, snapshot];
    const clamped = next.slice(-20); // 최대 20단계
    historyIndexRef.current = clamped.length - 1;
    return clamped;
  });
}
```

**undo/redo 동작**:
- `undo()`: `historyIndexRef.current--`, `editHistory[index]`로 images 편집 속성 복원
- `redo()`: `historyIndexRef.current++`, `editHistory[index]`로 복원  
  단, redo 대상 스냅샷은 undo 전 상태를 담고 있어야 하므로 redo 전 현재 상태도 스택에 있어야 한다. 이를 위해 undo 시 현재 상태를 스택에 유지하고 포인터만 이동.
- `canUndo = historyIndexRef.current >= 0`
- `canRedo = historyIndexRef.current < editHistory.length - 1`

히스토리를 생성하는 액션: `rotateSelected`, `flipSelected`, `applyEditToSelected`, `applyResizeToSelected`, `applyWatermarkToSelected`, `toggleStripExifOnSelected`

`undo()` / `redo()` 함수:
- `undo`: `historyIndex` 감소, 해당 스냅샷 기준으로 `images` 업데이트 (id 매칭)
- `redo`: `historyIndex` 증가, 해당 스냅샷 적용
- `canUndo: boolean`, `canRedo: boolean` 노출

`AppContextType`에 추가:
```ts
undo:     () => void;
redo:     () => void;
canUndo:  boolean;
canRedo:  boolean;
```

### 훅: `src/hooks/useUndoRedo.ts`

```ts
export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useAppContext();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'z' && !e.shiftKey && canUndo) { e.preventDefault(); undo(); }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (canRedo) { e.preventDefault(); redo(); }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
```

이미지 탭이 활성화될 때만 undo/redo가 동작하도록 `activeTab === 'image'` 조건 추가.

### UI 피드백
`EditDrawer.tsx` 상단 또는 `BottomActionBar.tsx`에 undo/redo 버튼(아이콘) 추가. `canUndo`/`canRedo`로 비활성화 처리.

### 사용처
`DrawerLayout.tsx`에서 `useUndoRedo()` 호출.

---

## Feature 18: URL로 이미지 가져오기

### UI: `UploadStrip.tsx` 확장

현재 UploadStrip에 URL 버튼 추가:
- 링크 아이콘 버튼 클릭 → 스트립 내 인라인 URL 입력 폼으로 전환 (애니메이션)
- 폼: URL 입력 필드 + 확인 버튼 + 취소(X) 버튼
- Enter로 제출, Escape로 취소

### 로직: `src/lib/fetchImageFromUrl.ts`

```ts
export async function fetchImageFromUrl(url: string): Promise<File> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('FETCH_FAILED');
  }
  if (!response.ok) throw new Error('FETCH_FAILED');

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('NOT_IMAGE');

  const filename = url.split('/').pop()?.split('?')[0] || 'image';
  return new File([blob], filename, { type: blob.type });
}
```

**에러 처리**:
- `FETCH_FAILED` (네트워크 오류 또는 CORS) → "이미지를 가져올 수 없습니다. CORS 정책으로 차단되었을 수 있습니다."
- `NOT_IMAGE` → "URL이 이미지를 가리키지 않습니다."
- 로딩 중: 버튼에 스피너

**CORS 우회 미지원**: 클라이언트사이드 원칙에 따라 프록시 서버 없음. CORS 실패 시 안내 메시지만 표시.

### 사용처
`UploadStrip.tsx` 내부에서 직접 사용. 별도 훅 불필요(단순 async 함수 호출).

---

## 파일 구조 요약

```
신규 파일:
  src/context/UIContext.tsx          # activeTab 전역 상태
  src/hooks/useClipboardPaste.ts     # Feature 15
  src/hooks/useGlobalDrop.ts         # Feature 16
  src/hooks/useUndoRedo.ts           # Feature 17
  src/lib/fetchImageFromUrl.ts       # Feature 18 유틸
  src/components/layout/DropOverlay.tsx  # Feature 16 오버레이

수정 파일:
  src/lib/types.ts                   # ImageEditSnapshot, AppContextType 확장
  src/context/AppContext.tsx         # editHistory, undo/redo 추가
  src/components/layout/DrawerLayout.tsx  # UIContext 사용, 훅 연결
  src/components/image/UploadStrip.tsx    # URL 입력 UI 추가
  src/components/image/BottomActionBar.tsx  # undo/redo 버튼
  src/app/[locale]/layout.tsx        # UIProvider 추가
```

---

## 의존성

신규 패키지 없음. 기존 스택(React 19, Tailwind, Framer Motion, Lucide)으로 전부 구현 가능.

---

## 개발 순서

1. `UIContext` 도입 + `DrawerLayout` 마이그레이션 (다른 기능 전제 조건)
2. Feature 17 (AppContext 히스토리 + `useUndoRedo`)
3. Feature 15 (`useClipboardPaste`)
4. Feature 16 (`useGlobalDrop` + `DropOverlay`)
5. Feature 18 (`fetchImageFromUrl` + UploadStrip UI)
