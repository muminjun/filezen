# Spec: FileZen Phase 2 - Enhanced Features & SEO

## Overview
This specification outlines the implementation of several key improvements to FileZen, including responsive design, SEO optimization, batch image deletion, i18n fixes, and a new brand identity.

## 1. Responsive UI/UX (Mobile)
- **Goal**: Ensure the application is fully usable and visually appealing on mobile devices.
- **Tasks**:
  - Update `BottomActionBar.tsx` to be sticky or floating on mobile.
  - Adjust `ImageGallery.tsx` grid columns for smaller screens.
  - Ensure `UploadStrip.tsx` is compact on mobile.

## 2. I18n Bug Fix (English -> Korean)
- **Issue**: Language switching from English to Korean is failing.
- **Fix**: Replace manual string replacement in `LanguageSwitcher.tsx` with `next-intl`'s routing utilities or a more robust URL parsing logic.

## 3. SEO Optimization
- **Goal**: Improve visibility on Google Search.
- **Tasks**:
  - Implement dynamic metadata in `[locale]/layout.tsx`.
  - Add OpenGraph, Twitter cards, and canonical tags.
  - Create `robots.txt` and `sitemap.ts`.
  - Add JSON-LD structured data.

## 4. Batch Image Deletion
- **Goal**: Allow users to clear all uploaded images at once.
- **Tasks**:
  - Add `removeAllImages` to `AppContext`.
  - Add a "Delete All" button in the `BottomActionBar` or header.
  - Show a confirmation dialog (optional but recommended).

## 5. Service Image (Logo)
- **Goal**: Create a professional logo for FileZen.
- **Concept**: A sleek, modern icon representing "Zen" and "Files" (e.g., a stylized Z or a simplified file icon with a zen circle/enso).
- **Implementation**: Create a high-quality SVG and instructions to export it as PNG.

## 6. Additional Features
- **Image Format Selection**: Allow users to choose output format (WebP, PNG, JPEG).
- **Batch Renaming**: Add a prefix/suffix to all converted files.
- **Quality Control**: Slider for JPEG/WebP compression quality.

## Next Steps
1. Update `AppContext` with `removeAllImages`.
2. Fix `LanguageSwitcher`.
3. Enhance SEO in layouts.
4. Implement mobile-specific styles.
5. Design the SVG logo.
