# Phase 3b — 프리폼 콜라주 에디터 설계 문서

**작성일**: 2026-04-14  
**담당자**: minjun  
**브랜치**: feat/phase3b-collage  
**상태**: 확정  
**참고 스펙**: docs/superpowers/specs/2026-04-12-filezen-feature-roadmap-design.md (Feature 12)

---

## 개요

여러 사진을 자유롭게 배치하여 1장으로 병합하는 클라이언트사이드 콜라주 에디터. DrawerLayout에 세 번째 탭(`🎨 콜라주`)으로 추가. 서버 없이 순수 클라이언트사이드로 동작한다.

---

## 핵심 결정 사항

| 항목 | 결정 |
|------|------|
| 데이터 모델 | 재귀 바이너리 트리 (Binary Split Tree) |
| PC 레이아웃 | 좌측 컨트롤 패널 + 우측 캔버스 |
| 모바일 레이아웃 | 상단 툴바 + 캔버스 + 하단 컨트롤 패널 |
| 셀 선택 UI (PC) | 셀 상단 미니 팝오버 |
| 셀 선택 UI (모바일) | 미니 팝오버 + 하단 패널 동시 표시 |
| 사진 추가 방식 | 에디터 내 직접 업로드 + 이미지탭 연동 |
| 내보내기 | html2canvas 우선, collageExport.ts로 분리 |

---

## 데이터 모델

### 타입 정의 (`src/lib/collageTree.ts`)

```typescript
type SplitNode = {
  type: 'split'
  direction: 'h' | 'v'   // h: 수평(위아래), v: 수직(좌우)
  ratio: number           // 0~1, 첫 번째 자식의 비율
  children: [CollageNode, CollageNode]
}

type LeafNode = {
  type: 'leaf'
  id: string
  image?: {
    src: string     // Object URL 또는 base64
    x: number       // 셀 내 사진 오프셋 (object-cover 방식)
    y: number
    scale: number   // 기본값 1
  }
}

type CollageNode = SplitNode | LeafNode

type CollageStyle = {
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9' | 'free'
  gap: number         // 0~20px
  padding: number     // 0~40px
  borderRadius: number // 0~24px
  background: string  // CSS color
}

type CollageState = {
  tree: CollageNode
  style: CollageStyle
  selectedId: string | null
}
```

### 트리 조작 유틸 (`src/lib/collageTree.ts`)

- `splitNode(tree, id, direction)` — 리프 노드를 SplitNode로 교체
- `mergeNode(tree, id)` — 부모 SplitNode를 형제 LeafNode로 교체 (선택 셀의 형제가 LeafNode일 때만 활성화)
- `updateRatio(tree, nodeId, ratio)` — 디바이더 드래그 시 ratio 업데이트
- `setImage(tree, id, image)` — 셀에 사진 할당
- `swapImages(tree, idA, idB)` — 두 셀의 사진 교체

---

## 컴포넌트 구조

```
src/components/collage/
├── CollagePage.tsx      ← 탭 진입점, PC/모바일 레이아웃 분기
├── CollageCanvas.tsx    ← 트리 재귀 렌더링 + 셀 선택 상태 관리
├── CollageCell.tsx      ← 개별 셀: 사진 표시 (object-cover), 드래그 핸들
├── CellPopover.tsx      ← 분할/병합/교체 팝오버 (PC 상단, 모바일 하단)
├── CollagePanel.tsx     ← PC 좌측 패널 / 모바일 하단 패널 (공용)
├── CollageDivider.tsx   ← 셀 경계선 드래그 핸들 (ratio 조절)
└── CollageExport.tsx    ← 내보내기 UI (포맷, 해상도 선택 + 다운로드)

src/lib/
├── collageTree.ts       ← 트리 타입 + 조작 유틸 (순수 함수)
└── collageExport.ts     ← Canvas 래스터화 로직
```

---

## 레이아웃 상세

### PC (≥ 640px)

```
┌──────┬──────────────────┬───────────────────────────┐
│ 사이드 │  컨트롤 패널(160px)  │       캔버스 (flex-1)       │
│  바  │                  │                           │
│(기존) │  캔버스 비율 선택    │   [셀] [셀]               │
│      │  gap / 모서리 / 배경 │   [셀] [셀]  ← 팝오버     │
│      │  사진 업로드       │                           │
│      │  이미지탭에서 가져오기│                           │
│      │  ─────────────── │                           │
│      │  [내보내기 버튼]   │                           │
└──────┴──────────────────┴───────────────────────────┘
```

### 모바일 (< 640px)

```
┌─────────────────────────────────┐
│ 상단 바: 콜라주 | 비율 선택 | ⬇   │
├─────────────────────────────────┤
│                                 │
│         캔버스 (flex-1)          │
│    [셀] [셀]                    │
│    [셀] [셀]  ← 팝오버(셀 하단)  │
│                                 │
├─────────────────────────────────┤
│ 하단 패널: 가로분할 | 세로분할 | 병합 | 교체 │
├─────────────────────────────────┤
│ 이미지 탭 | 파일 탭 | 🎨 콜라주 탭  │
└─────────────────────────────────┘
```

---

## 인터랙션 플로우

| 동작 | 처리 |
|------|------|
| 셀 클릭 | `selectedId` 업데이트 → 팝오버 + 하단패널(모바일) 렌더 |
| 가로 분할 | `splitNode(tree, id, 'h')` → 새 트리 setState |
| 세로 분할 | `splitNode(tree, id, 'v')` → 새 트리 setState |
| 디바이더 드래그 | `onPointerMove` → `updateRatio()` (16ms throttle) |
| 셀 병합 | `mergeNode(tree, id)` → 부모를 리프로 교체 |
| 사진 배치 | 빈 셀 클릭 → 파일 피커 or 이미지탭 선택 모달 |
| 셀 내 사진 이동 | `onPointerMove` → `image.x / image.y` 업데이트 |
| 셀 간 사진 교체 | 셀 팝오버 "교체" → 다른 셀 클릭 → `swapImages()` |
| 내보내기 | `collageExport.ts` → html2canvas → Blob → 다운로드 |

---

## 내보내기 상세 (`src/lib/collageExport.ts`)

- **래스터화**: `html2canvas` (우선). 품질 이슈 발생 시 셀별 Canvas 직접 합성으로 교체 가능하도록 인터페이스 분리
- **해상도**: 1x / 2x(기본) / 3x
- **출력 포맷**: PNG / JPEG / WebP
- **파일명**: `collage-YYYYMMDD-HHmmss.png`

---

## DrawerLayout 탭 확장

`DrawerLayout.tsx`에 `'collage'` 탭 추가:
- 타입: `Tab = 'image' | 'file' | 'collage'`
- 아이콘: `LayoutGridIcon` (lucide-react)
- 레이블: i18n 키 `drawer.collage`
- `page.tsx`에 `collageTab={<CollagePage />}` prop 추가

---

## 이미지탭 연동

`CollagePage`에서 `useAppContext()`의 `images` 상태에 접근 → "이미지탭에서 가져오기" 버튼 클릭 시 현재 이미지탭 사진 목록을 모달로 표시 → 선택한 사진을 선택된 셀에 배치.

---

## 이번 Phase 범위 외

| 기능 | 이유 |
|------|------|
| 셀 내 핀치줌 (모바일 제스처) | Phase 4 UX 개선으로 이관 |
| 실행취소(Undo/Redo) | Feature 17(작업 히스토리)과 함께 |
| 소셜 미디어 프리셋(Feature 11)과 탭 통합 | Feature 11 구현 후 병합 |

---

## 의존성

| 항목 | 내용 |
|------|------|
| 신규 라이브러리 | `html2canvas` (~250KB, lazy import) |
| 기존 재사용 | `useAppContext` (이미지탭 연동), lucide-react 아이콘 |
| 번들 전략 | `html2canvas`는 내보내기 시점에 동적 import |
