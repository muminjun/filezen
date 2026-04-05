# Phase 1 설계 스펙 — 핵심 완성 + 빠른 UX 개선

**목표:** 이미지 변환 앱의 핵심 처리 기능을 완성하고, 사용성 핵심 UX 요소(라이트박스, 썸네일 크기, 키보드 단축키)를 추가한다.

**포함 기능:** A(이미지 변환 연결) + B(진행률/비교) + G(라이트박스) + H(썸네일 크기 슬라이더) + J(키보드 단축키)

---

## 1. 이미지 변환 연결 (A + B)

### 현재 상태
- `AppContext.processFiles()`는 빈 placeholder — 아무것도 하지 않음
- `imageProcessor.ts`에 `processImage(file, settings)` 메서드가 이미 구현되어 있음 (Canvas API 기반, 포맷 변환 + 리사이즈 + 품질 처리)
- `RotationToolbar`의 "변환하기" 버튼은 현재 회전 후 ZIP 다운로드만 함

### 완성 후 흐름
1. 사용자가 이미지 선택
2. 사이드바에서 포맷/크기/품질 설정
3. "변환하기" 클릭
4. 선택된 파일마다: 회전 적용(rotateImageBlob) → 포맷/리사이즈 처리(imageProcessor.processImage) → `ProcessingFile.processedUrl` 업데이트
5. 툴바에 실시간 진행률 표시 (`n/총n장 처리 중`)
6. 완료 후 ZIP 다운로드

### 설계 결정
- **회전 + 변환 통합:** 두 처리를 순차 적용 (rotateImageBlob → processImage). 별도 버튼 없이 "변환하기" 하나로 통일.
- **병렬 처리 없음 (Phase 1):** 순차 처리로 단순하게. 성능 최적화는 Phase 2 이후.
- **processFiles는 selectedFileIds 기준:** 선택된 파일만 처리. 전체 처리는 선택 후 실행.

### AppContext 변경
```typescript
// processFiles() 구현
const processFiles = async () => {
  const targets = files.filter(f => selectedFileIds.includes(f.id));
  setIsProcessing(true);
  for (let i = 0; i < targets.length; i++) {
    const pf = targets[i];
    // 1. 회전 적용
    const rotatedBlob = await rotateImageBlob(pf.originalUrl, pf.rotation, pf.file.type);
    const rotatedFile = new File([rotatedBlob], pf.file.name, { type: pf.file.type });
    // 2. 포맷/리사이즈 처리
    const result = await imageProcessor.processImage(rotatedFile, settings);
    // 3. 상태 업데이트
    updateFile(pf.id, {
      processedUrl: URL.createObjectURL(result),
      processedFile: result,
      status: 'completed',
    });
  }
  setIsProcessing(false);
};
```

### RotationToolbar 변경
- "변환하기" 버튼 클릭 → `processFiles()` 호출 → 완료 후 처리된 파일로 ZIP 생성
- 진행률 표시: `저장 중 3/10장` 형태

### PreviewPanel 변경
- `processedUrl`이 있으면 전/후 탭 또는 슬라이더 비교 뷰 표시
- `ComparisonView.tsx`가 이미 존재하므로 연결만 하면 됨

---

## 2. 라이트박스 (G)

### 동작
- 갤러리 썸네일 **더블클릭** → `LightboxModal` 열림
- ESC 또는 배경 클릭 → 닫기
- ← → 키보드 또는 화면 좌우 버튼으로 이미지 탐색
- 처리 완료된 이미지: 상단에 "원본 / 변환됨" 탭 전환 가능
- 미처리 이미지: 원본만 표시

### 컴포넌트 구조
```
LightboxModal.tsx (신규)
  props:
    - files: ProcessingFile[]
    - currentIndex: number
    - onClose: () => void
    - onNavigate: (index: number) => void
```

### 상태 관리
- `ImageGallery`에서 `lightboxIndex: number | null` 로컬 상태
- `null`이면 닫힘, 숫자면 해당 인덱스 이미지 표시

---

## 3. 썸네일 크기 슬라이더 (H)

### 동작
- 갤러리 상단 컨트롤바에 슬라이더 추가
- 슬라이더 값(2~8): CSS `grid-template-columns: repeat(n, 1fr)` 에 반영
- 기본값: 4열
- localStorage에 저장해 새로고침 후에도 유지

### UI 위치
```
[갤러리 영역 상단]
전체선택  N장 선택됨          [🔲 ──●── 🔳]
─────────────────────────────────────────
[썸네일 그리드]
```

### 구현 위치
- `ImageGallery.tsx` 상단에 컨트롤바 섹션 추가
- `thumbnailCols` 상태를 `useState(4)` + localStorage 동기화

---

## 4. 키보드 단축키 (J)

### 단축키 목록
| 키 | 동작 |
|----|------|
| `⌘A` / `Ctrl+A` | 전체 선택 |
| `Escape` | 선택 해제 / 라이트박스 닫기 |
| `Delete` / `Backspace` | 선택된 파일 삭제 |
| `←` `→` | 라이트박스에서 이미지 탐색 |
| `Space` | 포커스 이미지 선택 토글 (라이트박스 밖) |

### 구현
- `useKeyboardShortcuts.ts` (신규 훅)
- `useEffect` + `window.addEventListener('keydown', ...)` 패턴
- 텍스트 input에 포커스된 경우 단축키 비활성 (`e.target.tagName === 'INPUT'` 체크)
- `useAppContext` 액션 직접 호출

```typescript
// src/hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(lightboxOpen: boolean) {
  const { selectAllFiles, clearSelection, selectedFileIds, removeFile } = useAppContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (inInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectAllFiles();
      }
      if (e.key === 'Escape' && !lightboxOpen) clearSelection();
      if ((e.key === 'Delete' || e.key === 'Backspace') && !lightboxOpen) {
        selectedFileIds.forEach(id => removeFile(id));
        clearSelection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, selectedFileIds]);
}
```

---

## 파일 변경 범위

| 파일 | 종류 | 내용 |
|------|------|------|
| `src/context/AppContext.tsx` | 수정 | processFiles() 구현, updateFile() 헬퍼 추가 |
| `src/components/upload/RotationToolbar.tsx` | 수정 | 변환하기 → processFiles + ZIP 연결 |
| `src/components/preview/PreviewPanel.tsx` | 수정 | processedUrl 연결, ComparisonView 활성화 |
| `src/components/upload/ImageGallery.tsx` | 수정 | 컨트롤바(슬라이더) + 라이트박스 트리거 + 더블클릭 |
| `src/components/upload/LightboxModal.tsx` | 신규 | 라이트박스 전체화면 뷰어 |
| `src/hooks/useKeyboardShortcuts.ts` | 신규 | 글로벌 키보드 단축키 훅 |

---

## 범위 외 (Phase 2~3)

- 정렬/필터, 드래그 순서 변경, 파일명 변경 → Phase 2
- 크롭, 밝기/대비, 워터마크 → Phase 3
- 병렬 처리(Web Worker 활용) → Phase 2 성능 최적화
- 모바일 터치 스와이프 → Phase 2
