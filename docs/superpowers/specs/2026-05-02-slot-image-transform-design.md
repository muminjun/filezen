# 슬롯 이미지 위치/크기 조정 설계

**날짜**: 2026-05-02  
**브랜치**: fix/frame-orientation-export-scale  
**상태**: 승인됨

---

## 개요

포토부스·소셜 프레임의 각 슬롯에 업로드된 이미지를 인스타그램 크롭 편집기처럼 드래그로 위치를 조정하고 스크롤/슬라이더로 크기를 조정할 수 있도록 한다. 미리보기(FrameSlot)와 내보내기(frameExport) 결과가 일치해야 한다.

---

## 목표

- 슬롯 이미지를 드래그로 상하좌우 이동
- 스크롤(데스크톱) / 핀치(모바일) / 슬라이더로 확대·축소 (1.0×–3.0×)
- 클릭 시 오버레이 컨트롤 진입 (줌 슬라이더 + 리셋 버튼)
- 항상 드래그 가능 (편집 모드 여부 무관)
- 이미지가 슬롯 경계 밖으로 벗어나지 않도록 오프셋 클램핑
- 내보내기 시 동일한 transform 적용

---

## 데이터 모델

### SlotTransform 타입

```ts
// src/lib/frameTemplates.ts 에 추가
export type SlotTransform = {
  offsetX: number; // px, 0 = 중앙
  offsetY: number; // px, 0 = 중앙
  scale: number;   // 1.0 = 원본 fit, 최대 3.0
};

export const DEFAULT_TRANSFORM: SlotTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};
```

### FramePage 상태 추가

```ts
const [slotTransforms, setSlotTransforms] = useState<SlotTransform[]>([]);
```

`slotTransforms`는 항상 `slotImages`와 길이가 같다.

### 동기화 규칙

| 이벤트 | slotTransforms 처리 |
|---|---|
| 슬롯 수 **증가** | 기존 유지 + `DEFAULT_TRANSFORM` 추가 |
| 슬롯 수 **감소** | 앞에서부터 유지, 초과분 제거 |
| 슬롯 **병합** | 첫 번째 transform 유지, 두 번째 제거 |
| 슬롯 **분리** | 첫 번째 transform 유지, `DEFAULT_TRANSFORM` 삽입 |
| 템플릿 **변경** | 전체를 `DEFAULT_TRANSFORM[]`으로 리셋 |
| 이미지 **업로드** | 해당 인덱스를 `DEFAULT_TRANSFORM`으로 리셋 |

---

## 컴포넌트: FrameSlot

### Props 변경

```ts
interface Props {
  // 기존 props 유지...
  transform: SlotTransform;
  isEditing: boolean;
  onTransformChange: (t: SlotTransform) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}
```

### 렌더링 구조

```
<div className="relative overflow-hidden w-full h-full">  ← 슬롯 컨테이너 (clip)
  <img
    style={{
      transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
      transformOrigin: 'center',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      draggable: false,
      userSelect: 'none',
    }}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onWheel={handleWheel}
    onClick={handleClick}
  />
  {isEditing && <EditingOverlay ... />}
</div>
```

### 인터랙션

**항상 활성:**

- `pointerdown` → `pointermove` → `pointerup` 시퀀스로 드래그
  - `setPointerCapture`로 슬롯 밖으로 커서가 나가도 추적
  - `dx = e.clientX - startX`, `dy = e.clientY - startY` 로 offsetX/Y 갱신
- `wheel` 이벤트 → scale 갱신, `e.preventDefault()` (페이지 스크롤 차단)
  - `deltaY < 0` → 확대, `deltaY > 0` → 축소

**클릭 진입:**

- `pointerdown`-`pointerup` 거리 < 4px → 클릭으로 판정 → `onEditStart()` 호출
- 편집 중 오버레이 외부 클릭 → `onEditEnd()` 호출

**오프셋 클램핑:**

이미지가 슬롯 경계를 벗어나지 않도록:

```ts
const { width: slotW, height: slotH } = containerRef.current.getBoundingClientRect();
const maxOffsetX = (slotW * scale - slotW) / 2;
const maxOffsetY = (slotH * scale - slotH) / 2;
// offsetX: [-maxOffsetX, maxOffsetX]
// offsetY: [-maxOffsetY, maxOffsetY]
const clampedOffsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, rawOffsetX));
const clampedOffsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, rawOffsetY));
```

슬롯 크기는 `containerRef.current.getBoundingClientRect()`로 획득.

**scale 범위:** `Math.min(3.0, Math.max(1.0, newScale))`

### EditingOverlay 컴포넌트

```tsx
// FrameSlot 내부 로컬 컴포넌트 (별도 파일 불필요)
function EditingOverlay({
  scale,
  onScaleChange,
  onReset,
}: {
  scale: number;
  onScaleChange: (s: number) => void;
  onReset: () => void;
}) { ... }
```

- 슬롯 하단에 고정 (absolute bottom-0)
- 줌 슬라이더: `<input type="range" min={1} max={3} step={0.05} value={scale} />`
- 리셋 버튼: `DEFAULT_TRANSFORM`으로 `onTransformChange` 호출
- 슬롯 외부 클릭 감지: `useEffect`로 `document` pointerdown 리스너 등록/해제

---

## FramePage 변경

### editingSlot 상태 추가

```ts
const [editingSlot, setEditingSlot] = useState<number | null>(null);
```

### handleTransformChange

```ts
const handleTransformChange = (index: number, t: SlotTransform) => {
  setSlotTransforms((prev) => {
    const next = [...prev];
    next[index] = t;
    return next;
  });
};
```

### FrameSlot에 props 전달

```tsx
<FrameSlot
  ...
  transform={slotTransforms[index] ?? DEFAULT_TRANSFORM}
  isEditing={editingSlot === index}
  onTransformChange={(t) => handleTransformChange(index, t)}
  onEditStart={() => setEditingSlot(index)}
  onEditEnd={() => setEditingSlot(null)}
/>
```

---

## frameExport 변경

### drawTransformedImage 함수

기존 `drawCenterCrop` 대신 transform을 적용하는 함수로 교체:

```ts
function drawTransformedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,    // 슬롯 캔버스 x
  dy: number,    // 슬롯 캔버스 y
  dw: number,    // 슬롯 너비
  dh: number,    // 슬롯 높이
  transform: SlotTransform,
): void
```

**로직:**

1. `ctx.save()` + `ctx.beginPath()` → 슬롯 영역 clip
2. 이미지를 슬롯에 `object-cover` 방식으로 맞추는 기본 sx/sy/sw/sh 계산
3. transform.scale / offsetX / offsetY 반영하여 최종 drawImage 좌표 계산
4. `ctx.restore()`

CSS `transform: translate(offsetX, offsetY) scale(scale)`의 캔버스 등가:
- scale이 적용된 이미지 크기로 drawImage 크기 조정
- offsetX/Y를 픽셀 단위로 적용 (슬롯 크기 기준 비율 → 실제 px 변환)

### frameExport 호출 변경

```ts
// 기존
drawCenterCrop(ctx, img, x, y, w, h);

// 변경 후
drawTransformedImage(ctx, img, x, y, w, h, transforms[slotIndex] ?? DEFAULT_TRANSFORM);
```

`transforms: SlotTransform[]`를 `exportFrame` 함수의 파라미터로 추가.

---

## 변경 파일 목록

| 파일 | 변경 종류 |
|---|---|
| `src/lib/frameTemplates.ts` | `SlotTransform` 타입 + `DEFAULT_TRANSFORM` 추가 |
| `src/components/frame/FramePage.tsx` | `slotTransforms` 상태, `editingSlot` 상태, 핸들러, 동기화 로직 추가 |
| `src/components/frame/FrameSlot.tsx` | transform 렌더링 + 드래그/줌/오버레이 인터랙션 전면 개편 |
| `src/lib/frameExport.ts` | `drawTransformedImage` 추가, `exportFrame` 시그니처에 `transforms` 파라미터 추가 |

---

## 범위 밖 (이번 구현에서 제외)

- 두 손가락 핀치 줌 (터치 이벤트 — 별도 구현 필요)
- transform 값 저장/불러오기 (로컬스토리지 등)
- 슬롯별 개별 밝기/대비 조정
- 애니메이션/트랜지션
