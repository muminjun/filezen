# FileZen Phase 1 - 이미지 변환 & 리사이징 설계

**프로젝트**: FileZen
**Phase**: 1 (이미지 처리)
**작성일**: 2026-04-05
**상태**: 설계 단계

---

## 1. 프로젝트 개요

FileZen은 클라이언트 사이드 기반의 멀티미디어 파일 처리 도구입니다. Phase 1에서는 이미지 형식 변환과 리사이징 기능에 집중합니다.

### 핵심 가치
- **프라이버시**: 모든 처리가 클라이언트에서만 이루어짐 (서버 없음)
- **속도**: 병렬 처리로 여러 파일을 동시에 변환
- **편의성**: Drag & Drop으로 쉬운 업로드, 실시간 미리보기
- **유연성**: 다양한 변환 옵션 및 프리셋 지원

### Phase 1 목표
- 이미지 형식 변환 (PNG, JPG, WebP)
- 고급 리사이징 기능 (비율 유지, 크롭, 확대 등)
- 실시간 미리보기 및 비교 기능
- 사용자 설정 저장 (히스토리, 프리셋, 즐겨찾기)
- 최대 100개 파일 동시 처리

---

## 2. 기술 스택

### Frontend
- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **UI 라이브러리**: shadcn/ui + Tailwind CSS
- **상태 관리**: React Hooks + Context API

### 이미지 처리
- **메인 라이브러리**: Squoosh (WebAssembly)
  - 고성능 이미지 변환/압축
  - PNG, JPG, WebP, GIF, AVIF 지원
  - 클라이언트 사이드 전용
- **보조**: Canvas API (크롭, 미리보기)
- **병렬 처리**: Web Worker

### 데이터 저장
- **클라이언트 저장소**: LocalStorage
  - 히스토리 (최근 5개 처리)
  - 프리셋 (자주 쓰는 설정 최대 10개)
  - 즐겨찾기 (사용자가 저장한 설정)

### 추가 라이브러리
- `react-dropzone`: Drag & Drop 구현
- `jszip`: 여러 파일을 ZIP으로 압축 후 다운로드
- `lucide-react`: 아이콘 (shadcn에 포함)

---

## 3. 아키텍처

### 3.1 전체 데이터 흐름

```
사용자 액션
    ↓
UploadZone (드래그앤드롭)
    ↓
FileList (업로드된 파일 관리 + 진행률)
    ↓
Web Worker (병렬 처리)
    ↓
ImageProcessor (Squoosh 사용)
    ↓
PreviewPanel (실시간 미리보기)
    ↓
SettingsSidebar (옵션 조정 → 즉시 업데이트)
    ↓
ComparisonView (원본 vs 변환본)
    ↓
DownloadManager (개별/ZIP 다운로드)
```

### 3.2 상태 관리 구조

**AppContext** (전역 상태)
```typescript
{
  files: ProcessingFile[],           // 업로드된 파일들
  settings: ConversionSettings,       // 현재 변환 설정
  history: ProcessingRecord[],        // 최근 처리 기록
  presets: PresetConfig[],            // 저장된 프리셋
  favorites: FavoriteSettings[],       // 즐겨찾기
  isProcessing: boolean,              // 처리 중 여부
}
```

**ProcessingFile** (파일 상태)
```typescript
{
  id: string,
  file: File,
  originalUrl: string,                // 원본 미리보기
  processedUrl: string,               // 변환된 이미지
  status: 'pending' | 'processing' | 'completed' | 'error',
  progress: number,                   // 0-100%
  error?: string,
  processedFile?: Blob,               // 변환된 파일
}
```

---

## 4. 주요 컴포넌트 설계

### 4.1 레이아웃 구조

```
┌─────────────────────────────────────────────────┐
│                  Header                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────┐  ┌─────────────────┐ │
│  │                     │  │   Settings      │ │
│  │  Main Area          │  │   Sidebar       │ │
│  │  - UploadZone       │  │   - Format      │ │
│  │  - FileList         │  │   - Size        │ │
│  │  - PreviewPanel     │  │   - Quality     │ │
│  │  - ComparisonView   │  │   - Options     │ │
│  │                     │  │   - Presets     │ │
│  └─────────────────────┘  └─────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer (DownloadManager)                       │
└─────────────────────────────────────────────────┘
```

### 4.2 컴포넌트 목록

| 컴포넌트 | 책임 | 상태 관리 |
|---------|------|---------|
| **UploadZone** | 파일 드래그앤드롭 | AppContext + 로컬 |
| **FileList** | 업로드 파일 목록 + 진행률 | AppContext |
| **PreviewPanel** | 선택된 파일의 변환 미리보기 | AppContext |
| **SettingsSidebar** | 변환 옵션 조정 | AppContext |
| **ComparisonView** | 원본 vs 변환본 나란히 보기 | AppContext |
| **PresetManager** | 프리셋 저장/로드 | AppContext + LocalStorage |
| **HistoryPanel** | 최근 처리 기록 | AppContext + LocalStorage |
| **FavoritesPanel** | 즐겨찾기 설정 | AppContext + LocalStorage |
| **DownloadManager** | 개별/ZIP 다운로드 | AppContext |

---

## 5. 핵심 기능 상세 설계

### 5.1 이미지 형식 변환
- **지원 형식**: PNG → JPG, WebP / JPG → PNG, WebP / WebP → PNG, JPG
- **품질 설정**:
  - JPG: 50-100 (기본값 80)
  - PNG: 압축 레벨 0-9 (기본값 6)
  - WebP: 품질 50-100 (기본값 75)
- **메타데이터**: EXIF 데이터 제거 옵션 (프라이버시)

### 5.2 리사이징 옵션

**4가지 모드**:
1. **Contain** (비율 유지, 내부)
   - 원본 비율 유지, 지정 크기 안에 fit
   - 배경: 투명 또는 색상 선택 가능

2. **Cover** (비율 유지, 외부)
   - 원본 비율 유지, 지정 영역 덮음
   - 자동으로 중앙 크롭

3. **Stretch** (비율 무시)
   - 정확히 지정된 크기로 늘임/줄임

4. **Crop** (수동 크롭)
   - 사용자가 마우스로 영역 선택
   - 실시간 미리보기

### 5.3 프리셋 (인기 크기)
```typescript
const defaultPresets = [
  { name: "Thumbnail (200x200)", width: 200, height: 200, mode: 'cover' },
  { name: "Square (500x500)", width: 500, height: 500, mode: 'cover' },
  { name: "Instagram Feed (1080x1350)", width: 1080, height: 1350, mode: 'cover' },
  { name: "Instagram Story (1080x1920)", width: 1080, height: 1920, mode: 'contain' },
  { name: "Twitter Header (1500x500)", width: 1500, height: 500, mode: 'cover' },
  { name: "LinkedIn Cover (1200x627)", width: 1200, height: 627, mode: 'cover' },
  { name: "Facebook (1200x630)", width: 1200, height: 630, mode: 'cover' },
  { name: "YouTube Thumbnail (1280x720)", width: 1280, height: 720, mode: 'cover' },
  { name: "Web Small (640x480)", width: 640, height: 480, mode: 'contain' },
  { name: "Web Large (1920x1080)", width: 1920, height: 1080, mode: 'contain' },
];
```

### 5.4 히스토리 & 즐겨찾기
- **히스토리**: 최근 5개 처리 기록 자동 저장
- **즐겨찾기**: 사용자가 현재 설정을 저장 (최대 10개)
- **저장소**: LocalStorage (키: `filezen_history`, `filezen_favorites`)

### 5.5 병렬 처리 & 진행률
- **Web Worker**: CPU 집약적 작업을 별도 스레드에서 처리
- **진행률 표시**: 파일별 개별 진행률 (0-100%)
- **동시 처리**: 최대 4개 파일 동시 처리 (성능 최적화)

### 5.6 다운로드 옵션
- **개별 다운로드**: 각 파일을 개별적으로 다운로드
- **ZIP 다운로드**: 모든 처리된 파일을 ZIP으로 압축해서 한 번에 다운로드
- **파일명**: 원본명_[크기]_[형식].확장자 (예: photo_640x480_webp.webp)

---

## 6. 파일 구조

```
src/
├── app/
│   ├── layout.tsx                    # 레이아웃
│   ├── page.tsx                      # 메인 페이지
│   ├── globals.css                   # 글로벌 스타일
│   └── favicon.ico
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # 헤더
│   │   ├── Sidebar.tsx               # 사이드바 (설정)
│   │   └── Footer.tsx                # 푸터 (다운로드 관리)
│   │
│   ├── upload/
│   │   ├── UploadZone.tsx            # 드래그앤드롭 영역
│   │   └── FileList.tsx              # 파일 목록 + 진행률
│   │
│   ├── preview/
│   │   ├── PreviewPanel.tsx          # 미리보기
│   │   └── ComparisonView.tsx        # 비교 뷰 (원본 vs 변환)
│   │
│   ├── settings/
│   │   ├── SettingsSidebar.tsx       # 설정 사이드바
│   │   ├── FormatSelector.tsx        # 형식 선택
│   │   ├── ResizeOptions.tsx         # 리사이징 옵션
│   │   ├── QualitySlider.tsx         # 품질 슬라이더
│   │   ├── PresetSelector.tsx        # 프리셋 선택
│   │   └── AdvancedOptions.tsx       # 고급 옵션
│   │
│   ├── manager/
│   │   ├── HistoryPanel.tsx          # 히스토리
│   │   ├── FavoritesPanel.tsx        # 즐겨찾기
│   │   └── DownloadManager.tsx       # 다운로드 관리
│   │
│   └── ui/                           # shadcn/ui 컴포넌트
│       ├── button.tsx
│       ├── input.tsx
│       ├── slider.tsx
│       ├── tabs.tsx
│       ├── dialog.tsx
│       └── ... (필요한 것들)
│
├── lib/
│   ├── imageProcessor.ts             # Squoosh 래퍼
│   ├── storage.ts                    # LocalStorage 관리
│   ├── types.ts                      # TypeScript 타입 정의
│   ├── constants.ts                  # 상수 (프리셋, 기본값 등)
│   └── utils.ts                      # 유틸 함수
│
├── hooks/
│   ├── useImageProcessor.ts          # 이미지 처리 로직
│   ├── useFileManagement.ts          # 파일 관리 로직
│   ├── useHistory.ts                 # 히스토리 관리
│   ├── usePresets.ts                 # 프리셋 관리
│   └── useFavorites.ts               # 즐겨찾기 관리
│
├── context/
│   └── AppContext.tsx                # 전역 상태 관리
│
└── workers/
    └── imageWorker.ts                # Web Worker (이미지 처리)

docs/
└── superpowers/
    └── specs/
        └── 2026-04-05-filezen-phase1-design.md (이 파일)
```

---

## 7. 기술적 고려사항

### 7.1 Web Worker 사용 이유
- Squoosh 처리는 CPU 집약적 (특히 대용량 이미지)
- Web Worker에서 처리하면 메인 스레드 블로킹 방지
- UI 반응성 유지 가능

### 7.2 메모리 관리
- 파일 처리 후 Blob URL을 ObjectURL로 생성하되, 사용 후 `URL.revokeObjectURL()` 호출
- 동시 처리 파일 수를 4개로 제한해 메모리 오버플로우 방지
- 브라우저 메모리 제한 고려 (100개 대용량 파일 처리 시 순차 처리)

### 7.3 브라우저 호환성
- Squoosh: 최신 브라우저 (Chrome 90+, Firefox 88+, Safari 15+)
- Web Worker: 모든 최신 브라우저 지원
- LocalStorage: 모든 브라우저 지원

### 7.4 성능 최적화
- Code Splitting: 페이지 로딩 후 Squoosh 동적 로드
- Lazy Loading: 필요할 때만 라이브러리 로드
- 이미지 미리보기: Canvas를 이용한 저해상도 미리보기 (빠른 렌더링)

---

## 8. 에러 처리 & 유효성 검사

### 파일 검증
- **형식**: JPEG, PNG, GIF, WebP만 허용
- **크기**: 파일당 최대 50MB 제한
- **개수**: 최대 100개 파일

### 에러 시나리오
1. **지원하지 않는 형식**: 경고 메시지 표시
2. **파일 처리 실패**: 해당 파일만 에러 상태, 다른 파일은 계속 처리
3. **메모리 부족**: 동시 처리 개수 자동 감소 또는 경고

---

## 9. Phase 2 이후 기능 (향후 계획)

- 이미지 회전 & 필터
- 이미지 압축 (고급)
- PDF 생성 (이미지 → PDF)
- PDF 병합
- PDF 비밀번호 제거
- 다른 파일 형식 변환

---

## 10. 성공 기준

✅ 이미지 형식 변환 기능 정상 작동
✅ 리사이징 4가지 모드 모두 지원
✅ 실시간 미리보기 (변환 중 표시)
✅ 병렬 처리로 여러 파일 동시 변환
✅ 진행률 표시 정확함
✅ 프리셋, 히스토리, 즐겨찾기 저장/로드 정상
✅ 개별 & ZIP 다운로드 정상
✅ 100개 파일 처리 가능 (메모리 관리 정상)
✅ shadcn UI를 이용한 모던 디자인
✅ TypeScript strict 모드에서 컴파일 성공

---

**설계 완료. 구현 계획으로 진행할 준비 완료.**
