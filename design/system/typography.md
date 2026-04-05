# Design System - Typography

## Overview
The FileZen typography system establishes clear visual hierarchy and ensures consistent communication across all digital products. The system is built on a modular scale for predictable, harmonious type sizes.

---

## Font Stack

### Primary Font: Inter
- **Family:** Inter
- **Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Source:** Google Fonts (https://fonts.google.com/specimen/Inter)
- **License:** Open Font License (OFL)
- **Rationale:** Inter is a humanist sans-serif designed specifically for screens with excellent readability at all sizes

### Font Loading
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

---

## Type Scale

The type scale is based on a 1.125 multiplier (perfect fifth), creating harmonious proportions between sizes.

### Heading Styles

#### H1 - Page Title
- **Size:** 48px
- **Line Height:** 1.2 (57.6px)
- **Font Weight:** 700 (Bold)
- **Letter Spacing:** -0.02em
- **Margin Bottom:** 24px
- **Usage:** Main page titles, modal headers
- **Example:** `<h1>Upload Your Images</h1>`

```css
h1 {
  font-size: 48px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}
```

#### H2 - Section Title
- **Size:** 36px
- **Line Height:** 1.2 (43.2px)
- **Font Weight:** 700 (Bold)
- **Letter Spacing:** -0.01em
- **Margin Bottom:** 20px
- **Usage:** Section headers, subsection titles
- **Example:** `<h2>Processing Settings</h2>`

```css
h2 {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 20px;
}
```

#### H3 - Subsection Title
- **Size:** 24px
- **Line Height:** 1.4 (33.6px)
- **Font Weight:** 600 (Semibold)
- **Letter Spacing:** 0em
- **Margin Bottom:** 16px
- **Usage:** Subsection headers, card titles
- **Example:** `<h3>Color Options</h3>`

```css
h3 {
  font-size: 24px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0em;
  margin-bottom: 16px;
}
```

#### H4 - Small Heading
- **Size:** 18px
- **Line Height:** 1.4 (25.2px)
- **Font Weight:** 600 (Semibold)
- **Letter Spacing:** 0em
- **Margin Bottom:** 12px
- **Usage:** Form labels, component titles
- **Example:** `<h4>Image Format</h4>`

```css
h4 {
  font-size: 18px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0em;
  margin-bottom: 12px;
}
```

### Body Text

#### Body - Regular
- **Size:** 14px
- **Line Height:** 1.6 (22.4px)
- **Font Weight:** 400 (Regular)
- **Letter Spacing:** 0em
- **Usage:** Main content, descriptions, long-form text
- **Example:** `<p>Upload images to get started...</p>`

```css
body, p {
  font-size: 14px;
  line-height: 1.6;
  font-weight: 400;
  letter-spacing: 0em;
}
```

#### Body - Emphasis
- **Size:** 14px
- **Line Height:** 1.6 (22.4px)
- **Font Weight:** 600 (Semibold)
- **Letter Spacing:** 0em
- **Usage:** Important text within body, highlighted content
- **Example:** `<strong>Processing may take up to 5 minutes</strong>`

```css
strong, .emphasis {
  font-size: 14px;
  line-height: 1.6;
  font-weight: 600;
  letter-spacing: 0em;
}
```

### Small Text

#### Small
- **Size:** 12px
- **Line Height:** 1.5 (18px)
- **Font Weight:** 400 (Regular)
- **Letter Spacing:** 0em
- **Usage:** Helper text, captions, metadata
- **Example:** `<small>Maximum file size: 10MB</small>`

```css
small, .text-sm {
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  letter-spacing: 0em;
}
```

#### Small - Emphasis
- **Size:** 12px
- **Line Height:** 1.5 (18px)
- **Font Weight:** 600 (Semibold)
- **Letter Spacing:** 0em
- **Usage:** Badge labels, status indicators
- **Example:** `<span class="badge">Processing</span>`

```css
.small-emphasis, .badge {
  font-size: 12px;
  line-height: 1.5;
  font-weight: 600;
  letter-spacing: 0em;
}
```

---

## Font Weights

### Weight Scale
| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, paragraphs, normal content |
| 500 | Medium | Form labels, navigation items |
| 600 | Semibold | Headings, emphasis, important text |
| 700 | Bold | Large headings, very strong emphasis |

### Weight Guidelines
- **400 Regular:** Default for all body text and paragraphs
- **500 Medium:** Used for form labels and secondary navigation (optional, rarely used)
- **600 Semibold:** Headings (H3, H4), card titles, emphasis within text
- **700 Bold:** Main headings (H1, H2), banner headlines

---

## Line Height Scale

### Fixed Line Heights
| Scale | Value | Usage |
|-------|-------|-------|
| Tight | 1.2 | Large headings, display text |
| Compact | 1.4 | Subheadings, small headings |
| Normal | 1.5 | Labels, small text |
| Relaxed | 1.6 | Body text, long-form content |

### Application
- **1.2:** H1, H2 - Reduces whitespace in large text
- **1.4:** H3, H4 - Balanced headings
- **1.5:** Small text, helper text
- **1.6:** Body text, paragraphs - Improves readability

---

## Letter Spacing

### Scale
| Value | Usage |
|-------|-------|
| -0.02em | H1 (negative tracking for large headings) |
| -0.01em | H2 (subtle negative tracking) |
| 0em | H3, H4, body, small text (neutral) |
| 0.02em | Uppercase labels, all-caps text |

### Guidelines
- **Negative spacing (-0.02em):** Large display text feels more compact and professional
- **Normal spacing (0em):** Standard for all body and heading text
- **Positive spacing (0.02em):** All-caps labels appear more distinct and elegant

---

## Responsive Typography

### Mobile (< 640px)
| Level | Size | Line Height |
|-------|------|-------------|
| H1 | 32px | 1.2 |
| H2 | 24px | 1.2 |
| H3 | 18px | 1.4 |
| H4 | 16px | 1.4 |
| Body | 14px | 1.6 |
| Small | 12px | 1.5 |

### Tablet (640px - 1024px)
| Level | Size | Line Height |
|-------|------|-------------|
| H1 | 40px | 1.2 |
| H2 | 32px | 1.2 |
| H3 | 24px | 1.4 |
| H4 | 18px | 1.4 |
| Body | 14px | 1.6 |
| Small | 12px | 1.5 |

### Desktop (> 1024px)
| Level | Size | Line Height |
|-------|------|-------------|
| H1 | 48px | 1.2 |
| H2 | 36px | 1.2 |
| H3 | 24px | 1.4 |
| H4 | 18px | 1.4 |
| Body | 14px | 1.6 |
| Small | 12px | 1.5 |

### Responsive Implementation
```css
/* Mobile */
h1 {
  font-size: 32px;
}

/* Tablet and up */
@media (min-width: 640px) {
  h1 {
    font-size: 40px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  h1 {
    font-size: 48px;
  }
}
```

---

## CSS Variables & Classes

### CSS Custom Properties
```css
:root {
  /* Font sizes */
  --font-size-h1: 48px;
  --font-size-h2: 36px;
  --font-size-h3: 24px;
  --font-size-h4: 18px;
  --font-size-body: 14px;
  --font-size-small: 12px;

  /* Font weights */
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line heights */
  --line-height-tight: 1.2;
  --line-height-compact: 1.4;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  /* Letter spacing */
  --letter-spacing-tighter: -0.02em;
  --letter-spacing-tight: -0.01em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.02em;
}
```

### Tailwind Classes
```html
<!-- Size -->
<h1 class="text-5xl">H1 Title</h1>
<h2 class="text-4xl">H2 Title</h2>
<h3 class="text-2xl">H3 Title</h3>
<h4 class="text-lg">H4 Title</h4>
<p class="text-base">Body text</p>
<small class="text-sm">Small text</small>

<!-- Weight -->
<h1 class="font-bold">Bold Heading</h1>
<h3 class="font-semibold">Semibold Heading</h3>
<p class="font-normal">Regular Body</p>

<!-- Line height -->
<h1 class="leading-tight">Tight line height</h1>
<p class="leading-relaxed">Relaxed line height</p>

<!-- Letter spacing -->
<h1 class="tracking-tight">Tight spacing</h1>
<p class="tracking-normal">Normal spacing</p>
```

---

## Usage Examples

### Page Header
```html
<header>
  <h1>Upload Images</h1>
  <p class="text-gray-600">Drag and drop your images or click to browse</p>
</header>
```

### Card Title with Description
```html
<div class="card">
  <h3>Processing Settings</h3>
  <p>Adjust quality and output format</p>
  <small class="text-gray-500">Advanced options available</small>
</div>
```

### Form Field
```html
<label class="font-semibold text-base">Image Format</label>
<select>
  <option>Select an option</option>
</select>
<small class="text-gray-500">Choose the output format for your images</small>
```

### Status Badge
```html
<span class="badge text-sm font-semibold">Processing</span>
<span class="text-gray-600">Estimated time: 5 minutes</span>
```

---

## Accessibility

### Best Practices
1. **Use semantic HTML:** Use proper heading hierarchy (h1, h2, h3, etc.)
2. **Sufficient size:** Minimum body text size of 12px, 14px recommended
3. **Line length:** Keep lines between 45-75 characters for optimal readability
4. **Contrast:** Ensure text has adequate contrast with background (WCAG AA minimum 4.5:1)
5. **Readability:** Use appropriate line height for text density (1.6 for body text)

### Color Contrast with Typography
- **Dark text (Dark Gray #374151) on White:** 12.63:1 contrast ratio (AAA)
- **Secondary text (Secondary Gray #6B7280) on White:** 7.04:1 contrast ratio (AA)
- **Small text should use darker colors** for enhanced readability

---

## Font Loading Performance

### Optimization Strategies
1. **Variable fonts:** Use variable font weights to reduce file size
2. **Subsetting:** Load only necessary character sets
3. **Font display:** Use `font-display: swap` for better performance
4. **Preloading:** Preload critical fonts in `<head>`

### Recommended Implementation
```html
<link rel="preload" as="font" href="/fonts/inter.woff2" type="font/woff2" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## Typography Scale Ratios

### Modular Scale (1.125 - Perfect Fifth)
```
12px (small) × 1.125 = 13.5px
14px (body) × 1.125 = 15.75px ≈ 18px (h4)
18px (h4) × 1.125 = 20.25px
20.25px × 1.125 = 22.8px
24px (h3) × 1.125 = 27px
36px (h2) × 1.125 = 40.5px
48px (h1) × 1.125 = 54px
```

This scale ensures visual harmony across all typography sizes.

---

## Migration & Updates

When updating typography:
1. Test readability across all screen sizes
2. Verify contrast ratios meet WCAG standards
3. Ensure backward compatibility with existing type styles
4. Update all affected components and templates
5. Document changes in release notes

---

**Last Updated:** 2026-04-05
**Version:** 1.0.0
