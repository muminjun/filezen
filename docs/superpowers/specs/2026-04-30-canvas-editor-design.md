# Canvas Editor 리디자인 스펙

**날짜:** 2026-04-30
**범위:** Phase A — 캔버스 코어 (기존 collage 탭 완전 교체)

---

## 1. 배경 & 목표

기존 캔버스 탭(이진트리 기반 콜라주 메이커)은 렌더링 버그(캔버스 div에 명시적 크기 없음)와 직관적이지 않은 UX로 인해 사용성이 낮다. 이를 Canva 스타일의 자유 배치 캔버스 에디터로 완전히 교체한다.

**목표:**
- 이미지, 텍스트, 도형을 자유롭게 배치·편집
- React-Konva 기반으로 고품질 내보내기
- Claude 디자인 스타일(기존 shadcn/ui + Tailwind 토큰) 적용

---

## 2. 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  [상단 바] 캔버스 비율 선택  ·  실행취소/다시실행  ·  내보내기  │
├──────┬──────────────────────────────────┬────────────┤
│      │                                  │            │
│ 도구 │         캔버스 (Konva Stage)      │  속성 패널  │
│ 패널 │                                  │  (선택 시) │
│ (좌) │                                  │   (우)     │
│      │                                  │            │
└──────┴──────────────────────────────────┴────────────┘
```

- **좌측 도구 패널:** 아이콘 전용 버튼 (선택·텍스트·도형·이미지·배경), 현재 사이드바와 동일한 너비(w-14)
- **중앙 캔버스:** Konva Stage, 체커보드 배경(투명도 시각화), `shadow-xl rounded-xl`
- **우측 속성 패널:** 요소 선택 시 슬라이드인, 선택 해제 시 숨김
- **상단 바:** 캔버스 비율 프리셋 + Undo/Redo + 내보내기 버튼

---

## 3. 지원 요소

### 3-1. 이미지
- 파일 업로드 또는 드래그 앤 드롭
- 이동, 리사이즈(비율 유지 가능), 회전
- 투명도 슬라이더 (0~100%)
- 레이어 순서 (앞으로/뒤로 보내기)

### 3-2. 텍스트
- 도구 패널에서 추가 → 캔버스 클릭 위치에 생성
- 더블클릭 시 DOM 오버레이로 인라인 편집 (Konva Text + 투명 textarea)
- 속성: 폰트 크기, 색상, Bold, Italic, 정렬(좌/중/우)
- 이동, 리사이즈, 회전

### 3-3. 도형
- 사각형, 원 2종
- 속성: 채우기 색, 테두리 색, 테두리 두께
- 이동, 리사이즈, 회전

### 3-4. 배경
- 단색 (색상 피커)
- 선형 그라디언트 (2색)
- 이미지 업로드

---

## 4. 인터랙션

| 동작 | 결과 |
|------|------|
| 요소 클릭 | 선택 + Transformer 핸들 표시 |
| 요소 드래그 | 이동 |
| 핸들 드래그 | 리사이즈 |
| 회전 핸들 드래그 | 회전 |
| 캔버스 빈 곳 클릭 | 선택 해제 |
| Delete / Backspace | 선택 요소 삭제 |
| Undo (Cmd+Z) | 이전 상태 복원 |
| Redo (Cmd+Shift+Z) | 다음 상태 복원 |
| 텍스트 더블클릭 | 인라인 편집 모드 |

---

## 5. 기술 아키텍처

### 의존성
- `konva` + `react-konva` (~70KB gzip)

### 파일 구조
```
src/components/canvas/
├── CanvasPage.tsx           # 메인 페이지 (CollagePage 교체)
├── CanvasStage.tsx          # Konva Stage + Layer + 요소 렌더링
├── CanvasToolbar.tsx        # 좌측 도구 패널
├── CanvasTopbar.tsx         # 상단 바 (비율·Undo·내보내기)
├── CanvasProperties.tsx     # 우측 속성 패널
├── elements/
│   ├── ImageElement.tsx     # Konva.Image + Transformer
│   ├── TextElement.tsx      # Konva.Text + DOM 인라인 편집
│   └── ShapeElement.tsx     # Konva.Rect / Konva.Circle
└── hooks/
    ├── useCanvasHistory.ts  # Undo/Redo 히스토리 스택
    └── useCanvasExport.ts   # stage.toDataURL() PNG 내보내기
```

### 상태 구조
```typescript
interface CanvasState {
  elements: CanvasElement[];   // 레이어 순서대로 정렬
  selectedId: string | null;
  background: CanvasBackground;
  canvasSize: { width: number; height: number };
}

type CanvasElement = ImageEl | TextEl | ShapeEl;

interface BaseEl {
  id: string;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  opacity: number;
}

interface ImageEl extends BaseEl { type: 'image'; src: string; }
interface TextEl extends BaseEl { type: 'text'; text: string; fontSize: number; color: string; bold: boolean; italic: boolean; align: 'left'|'center'|'right'; }
interface ShapeEl extends BaseEl { type: 'shape'; shape: 'rect'|'circle'; fill: string; stroke: string; strokeWidth: number; }

type CanvasBackground =
  | { type: 'color'; color: string }
  | { type: 'gradient'; from: string; to: string; direction: 'horizontal'|'vertical' }
  | { type: 'image'; src: string };
```

### Undo/Redo
- `CanvasState[]` 배열로 히스토리 관리 (최대 50단계)
- 모든 상태 변경 시 현재 상태를 스택에 push

### 내보내기
- `stage.toDataURL({ pixelRatio: 2 })` → PNG
- 포맷: PNG, 해상도: 2x 고정 (추후 옵션 추가 가능)

---

## 6. Claude 디자인 스타일

**Transformer 핸들:**
- 색상: `#6366f1` (primary)
- 핸들: 8px 원형
- 테두리: `#6366f1`

**좌측 도구 패널 아이콘:**
```
[ ↖ ]  선택 (MousePointer2)
[ T  ]  텍스트 (Type)
[ □ ]  도형 (Shapes)
[ 🖼 ]  이미지 (ImageIcon)
[ 🎨 ]  배경 (Palette)
```

**색상 토큰:**
- 배경: `bg-background` / `bg-card`
- 테두리: `border border-border`
- 활성 도구: `bg-accent text-accent-foreground`
- 선택 링: `ring-2 ring-primary`
- 속성 패널: `bg-card border-l border-border`

---

## 7. 삭제 대상 (기존 collage)

```
src/components/collage/   → 전체 삭제
src/lib/collageTree.ts    → 삭제
src/lib/collageExport.ts  → 삭제
src/hooks/useCollageExport.ts → 삭제
```

`DrawerLayout.tsx`에서 `CollagePage` import → `CanvasPage`로 교체.

---

## 8. 범위 외 (Phase B 이후)

- 텍스트 폰트 선택 (Google Fonts)
- 스티커/이모지 라이브러리
- 템플릿 시스템
- 다중 페이지
- 애니메이션
- 그룹화
- 정렬 가이드라인 (스냅)
