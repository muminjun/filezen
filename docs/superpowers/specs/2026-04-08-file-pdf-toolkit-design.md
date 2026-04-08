# File / PDF Toolkit — Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Scope:** filezen File 탭 구현 — 완전 클라이언트 사이드 PDF 처리

---

## 1. 개요

이미지 탭과 동일한 "서버 없음, 클라이언트 처리" 철학을 유지하면서 PDF 전문 툴킷을 구축한다. 핵심 라이브러리 `pdfjs-dist`(렌더링) + `pdf-lib`(생성/수정)으로 모든 기능을 처리한다.

---

## 2. 기능 목록

| # | 도구 | 핵심 동작 |
|---|---|---|
| 1 | PDF 페이지 매니저 | 썸네일 그리드, 드래그 재정렬, 삭제, 페이지 회전 |
| 2 | PDF 병합 | 여러 PDF 업로드 → 순서 조정 → 하나로 합치기 |
| 3 | PDF 분리 | 페이지 범위 선택 → 개별 PDF 또는 ZIP 다운로드 |
| 4 | PDF ↔ 이미지 | PDF→이미지(ZIP), 이미지→PDF |
| 5 | PDF 압축 | 메타데이터 제거 + 이미지 재압축, Before/After 용량 표시 |
| 6 | PDF 비밀번호 해제 | 비밀번호 입력 → 잠금 해제된 PDF 다운로드 |

---

## 3. 아키텍처

### 3.1 라이브러리

- **`pdfjs-dist`** — PDF 페이지를 Canvas로 렌더링 (썸네일 생성, PDF→이미지)
- **`pdf-lib`** — PDF 생성/수정/병합/분리/압축/잠금 해제

### 3.2 컴포넌트 트리

```
src/components/file/
├── FilePage.tsx              # 루트 컨테이너, FileContext 소비
├── FileUploadStrip.tsx       # PDF 드래그앤드롭 업로드 (이미지 UploadStrip 참조)
├── FileToolSelector.tsx      # 도구 탭 선택 UI (6개 탭)
└── tools/
    ├── PageManager.tsx       # 페이지 재정렬/삭제/회전
    ├── MergeTool.tsx         # PDF 병합
    ├── SplitTool.tsx         # PDF 분리
    ├── ConvertTool.tsx       # PDF↔이미지 변환
    ├── CompressTool.tsx      # PDF 압축
    └── UnlockTool.tsx        # 비밀번호 해제
```

### 3.3 상태 관리

이미지 탭의 `AppContext` 패턴을 참조해 `FileContext`를 별도로 만든다.

```typescript
// src/context/FileContext.tsx

type FileToolMode = 'page-manager' | 'merge' | 'split' | 'convert' | 'compress' | 'unlock'

interface PdfPage {
  pageIndex: number      // 0-based
  thumbnail: string      // blob URL
  rotation: number       // 0 | 90 | 180 | 270
}

interface PdfFile {
  id: string
  file: File
  name: string
  pageCount: number
  pages: PdfPage[]
  isPasswordProtected: boolean
}

interface FileContextState {
  pdfFiles: PdfFile[]
  activeTool: FileToolMode
  isProcessing: boolean
}
```

### 3.4 유틸리티

```
src/lib/
├── pdfThumbnail.ts    # pdfjs-dist로 썸네일 canvas → blob URL 생성
├── pdfMerge.ts        # pdf-lib로 여러 PDF 병합
├── pdfSplit.ts        # pdf-lib로 페이지 범위 분리
├── pdfConvert.ts      # PDF→이미지 (pdfjs), 이미지→PDF (pdf-lib)
├── pdfCompress.ts     # pdf-lib로 압축 (메타데이터 제거 + 이미지 downscale)
└── pdfUnlock.ts       # pdfjs 비밀번호 인증 → pdf-lib로 잠금 해제 재저장
```

---

## 4. 각 도구 상세 설계

### 4.1 PDF 페이지 매니저 (플래그십)

**플로우:**
1. PDF 업로드 → `pdfThumbnail.ts`로 전체 페이지 썸네일 생성
2. 썸네일 그리드 표시 (이미지 탭 `ImageGallery` 참조)
3. 드래그 재정렬 (이미지 탭 `ImageGallery`와 동일한 네이티브 HTML5 Drag & Drop 방식)
4. 페이지 선택 → 삭제 또는 90° 회전
5. "저장" 버튼 → `pdf-lib`로 수정된 PDF 빌드 → 다운로드

**제약:** 단일 PDF만 지원 (병합 기능과 분리)

### 4.2 PDF 병합

**플로우:**
1. 여러 PDF 업로드 → 파일 카드 목록
2. 드래그로 파일 순서 조정
3. "병합" 버튼 → `pdfMerge.ts` → 단일 PDF 다운로드

### 4.3 PDF 분리

**플로우:**
1. 단일 PDF 업로드
2. 분리 방식 선택:
   - **모든 페이지 개별 분리** → 각 페이지가 별도 PDF → ZIP
   - **페이지 선택 추출** → 썸네일 클릭으로 원하는 페이지만 선택 → 하나의 PDF로
   - **범위 입력** → "1-3, 5, 7-10" 형식 입력 → 각 범위별 PDF → ZIP
3. 다운로드

### 4.4 PDF ↔ 이미지 변환

**PDF → 이미지:**
1. PDF 업로드
2. 출력 포맷 선택 (PNG / JPEG / WebP)
3. 해상도 선택 (72 / 150 / 300 dpi — scale factor로 구현)
4. "변환" → pdfjs로 각 페이지 Canvas 렌더링 → Blob → ZIP 다운로드
5. 선택적: "이미지 탭으로 보내기" 버튼 (AppContext에 이미지 추가)

**이미지 → PDF:**
1. 이미지 업로드 (또는 이미지 탭 선택 이미지 가져오기)
2. 순서 조정
3. 페이지 크기 선택 (A4 / Letter / 이미지 크기 맞춤)
4. "PDF 생성" → `pdf-lib`로 각 이미지를 페이지로 임베드 → 다운로드

### 4.5 PDF 압축

**플로우:**
1. PDF 업로드
2. 압축 레벨 선택:
   - **낮음**: 메타데이터만 제거
   - **중간**: 메타데이터 제거 + 이미지 75% 품질 재인코딩
   - **높음**: 메타데이터 제거 + 이미지 50% 품질 + 해상도 다운스케일
3. Before/After 파일 크기 표시
4. 다운로드

**주의:** pdf-lib 자체는 이미지 재인코딩을 직접 지원하지 않음. 압축은 메타데이터 제거 + 임베드 이미지 재처리(canvas 경유)로 구현.

### 4.6 PDF 비밀번호 해제

**플로우:**
1. 암호화된 PDF 업로드 → 자동으로 비밀번호 보호 감지
2. 비밀번호 입력 필드 표시
3. pdfjs-dist에 비밀번호 전달해 페이지 렌더링 시도 (검증)
4. 성공 시: pdf-lib의 `PDFDocument.load(bytes, { password })` → 비밀번호 없이 재저장
5. 잠금 해제된 PDF 다운로드

**보안 노트:** 모든 처리는 브라우저 내에서만 발생. 파일이 서버로 전송되지 않음.

---

## 5. 이미지 탭 연동

| 방향 | 진입점 | 동작 |
|---|---|---|
| 이미지 → PDF | 이미지 탭 `BottomActionBar`에 "PDF로 내보내기" 버튼 추가 | 선택된 이미지 → 파일 탭 ConvertTool로 전달 |
| PDF → 이미지 | 파일 탭 ConvertTool 하단 "이미지 탭으로 보내기" 버튼 | 변환된 이미지 → AppContext에 추가 후 이미지 탭으로 이동 |

---

## 6. i18n

기존 `en.json` / `ko.json` 구조에 `file` 네임스페이스 추가:

```json
{
  "file": {
    "tools": {
      "pageManager": "페이지 관리",
      "merge": "PDF 병합",
      "split": "PDF 분리",
      "convert": "변환",
      "compress": "압축",
      "unlock": "비밀번호 해제"
    },
    ...
  }
}
```

---

## 7. 신규 의존성

```json
{
  "pdfjs-dist": "^4.x",
  "pdf-lib": "^1.17.x"
}
```

드래그앤드롭은 이미지 탭과 동일하게 네이티브 HTML5 Drag & Drop API 사용 (외부 라이브러리 불필요).

---

## 8. 구현 순서 (Phase)

| Phase | 내용 |
|---|---|
| 1 | 인프라: FileContext, FileUploadStrip, FileToolSelector, 라이브러리 설치 |
| 2 | pdfThumbnail.ts + PageManager (플래그십 기능) |
| 3 | MergeTool + SplitTool |
| 4 | ConvertTool (PDF↔이미지) + 이미지 탭 연동 |
| 5 | CompressTool |
| 6 | UnlockTool (비밀번호 해제) |
| 7 | i18n 적용, 접근성 점검, 모바일 반응형 확인 |
