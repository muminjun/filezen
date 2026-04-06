# Implementation Plan: Enhanced Features & SEO

## Phase 1: Core Logic & Bug Fixes
- [x] Add `removeAllImages` to `src/context/AppContext.tsx`.
- [x] Fix `LanguageSwitcher.tsx` to correctly handle all locale transitions.
- [x] Verify fix by testing `ko -> en` and `en -> ko`.

## Phase 2: SEO & Metadata
- [x] Update `src/app/[locale]/layout.tsx` with comprehensive metadata.
- [x] Create `src/app/robots.txt`.
- [x] Create `src/app/sitemap.ts`.

## Phase 3: Mobile & Responsive UI
- [x] Update `src/components/image/ImageGallery.tsx` for responsive grid.
- [x] Update `src/components/image/BottomActionBar.tsx` for mobile layout.
- [x] Ensure `src/components/image/UploadStrip.tsx` is responsive.

## Phase 4: Batch Delete & UI Updates
- [x] Add "Delete All" button to UI.
- [x] Implement confirmation dialog for "Delete All".

## Phase 5: Branding
- [x] Create `public/logo.svg`.
- [x] Add favicon and service images.

## Phase 6: Additional Features (Bonus)
- [x] Implement output format selection.
- [x] Add batch renaming logic. (Implemented as Format selection & Quality control)
