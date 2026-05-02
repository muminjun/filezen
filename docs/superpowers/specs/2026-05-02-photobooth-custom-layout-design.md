# 포토부스 커스텀 레이아웃 설계

**날짜**: 2026-05-02  
**브랜치**: fix/frame-orientation-export-scale  
**상태**: 승인됨

---

## 개요

포토부스 탭에서 사진 수와 레이아웃을 사용자가 자유롭게 설정할 수 있도록 확장한다. 현재 고정된 2·4·6컷 프리셋에 더 많은 프리셋을 추가하고, 사이드패널에서 사진 수·열 수를 직접 입력하거나 슬롯을 병합할 수 있는 그리드 에디터를 제공한다.

---

## 목표

- 프리셋: 2·3·4·6·9·12컷으로 확장
- 사진 수: 1–16장 자유 설정
- 열 수: 1–4열 자유 설정 (행은 자동 계산)
- 슬롯 병합: 인접한 두 슬롯을 클릭으로 합치기 / 분리
- 기존 여백·테두리·내보내기 기능 그대로 유지

---

## UI 구조

### 상단 탭바

- 기존 2·4·6컷에 3·9·12컷 추가
- 프리셋 선택 시 `activeTemplate`에 해당 템플릿을 deep copy하여 세팅
- 소셜 카테고리 탭은 변경 없음

### 사이드패널 (FrameOptions)

기존 "여백/테두리" 섹션 위에 "레이아웃" 섹션 신규 추가:

```
레이아웃
  사진 수   [−] [2] [+]
  열 수     [−] [1] [+]
  ┌────────────────────┐
  │  그리드 에디터      │
  │  (GridEditor)      │
  └────────────────────┘
─────────────────────────
여백 / 테두리  (기존 유지)
```

---

## 데이터 구조

### 기존 타입 변경 없음

`FrameTemplate`, `SlotDef`, `FrameOptionsState` 타입은 변경하지 않는다. `SlotDef`의 `colSpan`/`rowSpan` 필드가 이미 병합 표현을 지원한다.

### 신규 헬퍼 함수 (`frameTemplates.ts`)

```ts
// 사진 수 + 열 수로 균등 SlotDef[] 생성
// rows = Math.ceil(photoCount / cols)
// 마지막 행이 남는 경우 (예: 5장 2열 → 2×3 그리드, 마지막 행 1칸만 채움)
// 빈 셀은 슬롯으로 생성하지 않음 — CSS grid가 나머지 셀 공간을 차지하지만 이미지 없이 비어 보임
// → 이 동작은 의도적이며 FrameCanvas의 기존 렌더 방식과 일치
function buildEqualSlots(photoCount: number, cols: number): SlotDef[]

// 인접한 두 슬롯을 병합 (colSpan/rowSpan 조정)
// 병합 불가 조건: 인접하지 않거나 직사각형을 이루지 않는 경우 → 원본 반환
function mergeSlots(
  slots: SlotDef[],
  grid: { cols: number; rows: number },
  indexA: number,
  indexB: number,
): SlotDef[]

// 병합된 슬롯을 균등 슬롯 2개로 분리
function splitSlot(
  slots: SlotDef[],
  grid: { cols: number; rows: number },
  index: number,
): SlotDef[]
```

### 신규 프리셋

```ts
{ id: 'pb-3',  grid: { cols: 1, rows: 3 },  slots: buildEqualSlots(3, 1)  }
{ id: 'pb-9',  grid: { cols: 3, rows: 3 },  slots: buildEqualSlots(9, 3)  }
{ id: 'pb-12', grid: { cols: 3, rows: 4 },  slots: buildEqualSlots(12, 3) }
```

---

## 상태 관리 (`FramePage.tsx`)

### 변경 전

```ts
const [templateId, setTemplateId] = useState<string>(FRAME_TEMPLATES[0].id);
const template = getTemplate(templateId)!;
```

### 변경 후

```ts
const [activeTemplate, setActiveTemplate] = useState<FrameTemplate>(
  () => structuredClone(FRAME_TEMPLATES[0])
);
```

### 핸들러

| 핸들러 | 트리거 | 동작 |
|---|---|---|
| `handleTemplateChange(id)` | 프리셋 탭 클릭 | 해당 템플릿 deep copy → `activeTemplate` 세팅, `slotImages` 리셋, `options.orientation`을 `getNaturalOrientation(tmpl)`로 갱신 (기존 동작 유지) |
| `handlePhotoCountChange(n)` | 사진 수 스테퍼 | `buildEqualSlots(n, cols)` → `activeTemplate.slots` 교체, `activeTemplate.grid`를 `{ cols, rows: Math.ceil(n / cols) }`로 갱신, `slotImages` 조정 |
| `handleColsChange(c)` | 열 수 스테퍼 | `buildEqualSlots(photoCount, c)` → `activeTemplate.slots` 교체, `activeTemplate.grid`를 `{ cols: c, rows: Math.ceil(photoCount / c) }`로 갱신, `slotImages` 조정 |
| `handleSlotMerge(a, b)` | GridEditor 클릭 | `mergeSlots(...)` → `activeTemplate.slots` 교체 |
| `handleSlotSplit(i)` | GridEditor 재클릭 | `splitSlot(...)` → `activeTemplate.slots` 교체 |

### slotImages 조정 규칙

- 사진 수 **증가**: 기존 이미지 유지 + 빈 슬롯(`null`) 추가
- 사진 수 **감소**: 앞에서부터 유지, 초과분 제거
- 슬롯 **병합**: 첫 번째 슬롯 이미지 유지, 두 번째 제거
- 슬롯 **분리**: 첫 번째 슬롯 이미지 유지, 두 번째 `null`

---

## 신규 컴포넌트: `GridEditor.tsx`

```ts
interface Props {
  slots: SlotDef[];
  grid: { cols: number; rows: number };
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
}
```

### 인터랙션

1. 슬롯 **첫 클릭** → 선택(하이라이트). 이미 병합된 슬롯이면 즉시 `onSplit` 호출.
2. 슬롯 **두 번째 클릭 (인접)** → `onMerge(a, b)` 호출
3. 슬롯 **두 번째 클릭 (같은 슬롯)** → 선택 취소
4. 슬롯 **두 번째 클릭 (비인접)** → 선택을 새 슬롯으로 이동

### 병합 가능 조건

- 두 슬롯이 같은 행 또는 같은 열에서 인접
- 병합 결과가 직사각형 영역을 이룰 것

---

## 변경 파일 목록

| 파일 | 변경 종류 |
|---|---|
| `src/lib/frameTemplates.ts` | 수정 — 프리셋 3개 추가, 헬퍼 함수 3개 추가 |
| `src/components/frame/FramePage.tsx` | 수정 — `templateId` → `activeTemplate`, 핸들러 추가 (grid·orientation 갱신 포함) |
| `src/components/frame/FrameOptions.tsx` | 수정 — 레이아웃 섹션(사진 수·열 수 스테퍼) 추가 |
| `src/components/frame/GridEditor.tsx` | 신규 — 슬롯 병합/분리 에디터 |
| `src/messages/ko.json` | 수정 — `frame.templates.pb-3`, `pb-9`, `pb-12` 키 추가 |
| `src/messages/en.json` | 수정 — `frame.templates.pb-3`, `pb-9`, `pb-12` 키 추가 |
| `src/components/frame/FrameCanvas.tsx` | 유지 |
| `src/components/frame/FrameSlot.tsx` | 유지 |
| `src/lib/frameExport.ts` | 유지 |

---

## 범위 밖 (이번 구현에서 제외)

- 슬롯 크기 비율 자유 조정 (드래그 리사이즈)
- 슬롯 순서 드래그 재배치 (기존 swap 유지)
- 커스텀 레이아웃 저장/불러오기
- 소셜 카테고리 레이아웃 커스터마이즈
