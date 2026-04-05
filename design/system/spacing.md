# Design System - Spacing

## Overview
The FileZen spacing system establishes consistent, predictable distances between elements. Based on a 4px base unit, the system ensures visual harmony and creates clear relationships between components.

---

## Base Unit

### Core Spacing Unit: 4px
- **Definition:** The fundamental unit for all spacing decisions
- **Rationale:** 4px is divisible by standard screen pixel sizes (2x, 3x displays)
- **Consistency:** All spacing values are multiples of 4px
- **Flexibility:** Supports both compact and spacious layouts

### Unit Calculation
```
1 unit = 4px
2 units = 8px
3 units = 12px
4 units = 16px
5 units = 20px
```

---

## Spacing Scale

### Complete Spacing Scale
| Scale | Pixels | Rem | Usage |
|-------|--------|-----|-------|
| space-0 | 0px | 0rem | No spacing |
| space-1 | 4px | 0.25rem | Tight spacing |
| space-2 | 8px | 0.5rem | Compact spacing |
| space-3 | 12px | 0.75rem | Small spacing |
| space-4 | 16px | 1rem | Standard padding/margin |
| space-5 | 20px | 1.25rem | Medium spacing |
| space-6 | 24px | 1.5rem | Comfortable spacing |
| space-7 | 28px | 1.75rem | Generous spacing |
| space-8 | 32px | 2rem | Large spacing |
| space-9 | 36px | 2.25rem | Extra large spacing |
| space-10 | 40px | 2.5rem | Very large spacing |
| space-11 | 44px | 2.75rem | Extra large spacing |
| space-12 | 48px | 3rem | Massive spacing |
| space-13 | 52px | 3.25rem | Massive spacing |
| space-14 | 56px | 3.5rem | Massive spacing |
| space-15 | 60px | 3.75rem | Massive spacing |
| space-16 | 64px | 4rem | Maximum spacing |

---

## Common Spacing Patterns

### Button Spacing
```css
.button {
  /* Vertical padding */
  padding-top: 12px;      /* space-3 */
  padding-bottom: 12px;   /* space-3 */

  /* Horizontal padding */
  padding-left: 16px;     /* space-4 */
  padding-right: 16px;    /* space-4 */

  /* Margin below button */
  margin-bottom: 16px;    /* space-4 */
}

.button.small {
  padding: 8px 12px;      /* space-2 / space-3 */
}

.button.large {
  padding: 16px 24px;     /* space-4 / space-6 */
}
```

### Input Field Spacing
```css
.input-group {
  /* Margin below label */
  margin-bottom: 8px;     /* space-2 */
}

.input {
  /* Padding inside input */
  padding: 12px 16px;     /* space-3 / space-4 */

  /* Margin below input */
  margin-bottom: 16px;    /* space-4 */

  /* Border */
  border-width: 1px;
  border-radius: 8px;
}

.input-hint {
  /* Spacing above hint text */
  margin-top: 4px;        /* space-1 */
  font-size: 12px;
}
```

### Card Spacing
```css
.card {
  /* Outer spacing */
  margin-bottom: 24px;    /* space-6 */

  /* Inner padding */
  padding: 24px;          /* space-6 */

  /* Border and shadow */
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-header {
  /* Header margin */
  margin-bottom: 16px;    /* space-4 */
  padding-bottom: 16px;   /* space-4 */
  border-bottom: 1px solid #E5E7EB;
}

.card-content {
  /* Content padding */
  padding: 0;
}

.card-footer {
  /* Footer spacing */
  margin-top: 24px;       /* space-6 */
  padding-top: 16px;      /* space-4 */
  border-top: 1px solid #E5E7EB;
}
```

### Form Layout Spacing
```css
.form {
  /* Form container padding */
  padding: 32px;          /* space-8 */
}

.form-row {
  /* Row spacing */
  margin-bottom: 24px;    /* space-6 */
  display: flex;
  gap: 24px;              /* space-6 */
}

.form-field {
  /* Field spacing */
  margin-bottom: 24px;    /* space-6 */
  flex: 1;
}

.form-actions {
  /* Action buttons spacing */
  margin-top: 32px;       /* space-8 */
  display: flex;
  gap: 12px;              /* space-3 */
}
```

### Section Spacing
```css
.section {
  /* Top and bottom padding */
  padding: 48px 32px;     /* space-12 / space-8 */
}

.section-header {
  /* Header spacing */
  margin-bottom: 32px;    /* space-8 */
}

.section-content {
  /* Content area */
  max-width: 1200px;
  margin: 0 auto;
}

.section + .section {
  /* Spacing between sections */
  border-top: 1px solid #E5E7EB;
}
```

### List Spacing
```css
.list {
  /* List container */
  padding: 0;
  margin: 0;
  list-style: none;
}

.list-item {
  /* Item spacing */
  padding: 12px 0;        /* space-3 vertical */
  margin: 0;
}

.list-item + .list-item {
  /* Divider between items */
  border-top: 1px solid #E5E7EB;
}
```

---

## Responsive Spacing

### Mobile Layout (< 640px)
```css
/* Mobile spacing is typically more compact */
.container {
  padding: 16px;          /* space-4 */
}

.section {
  padding: 24px 16px;     /* space-6 / space-4 */
}

.form-row {
  flex-direction: column;
  gap: 16px;              /* space-4 */
}

.card {
  padding: 16px;          /* space-4 */
  margin-bottom: 16px;    /* space-4 */
}
```

### Tablet Layout (640px - 1024px)
```css
/* Tablet spacing is moderate */
.container {
  padding: 24px;          /* space-6 */
}

.section {
  padding: 32px 24px;     /* space-8 / space-6 */
}

.form-row {
  gap: 16px;              /* space-4 */
}

.card {
  padding: 20px;          /* space-5 */
  margin-bottom: 20px;    /* space-5 */
}
```

### Desktop Layout (> 1024px)
```css
/* Desktop spacing is more generous */
.container {
  padding: 32px;          /* space-8 */
}

.section {
  padding: 48px 32px;     /* space-12 / space-8 */
}

.form-row {
  gap: 24px;              /* space-6 */
}

.card {
  padding: 24px;          /* space-6 */
  margin-bottom: 24px;    /* space-6 */
}
```

### Media Query Implementation
```css
/* Mobile first approach */
.card {
  padding: 16px;          /* space-4 */
  margin-bottom: 16px;    /* space-4 */
}

@media (min-width: 640px) {
  .card {
    padding: 20px;        /* space-5 */
    margin-bottom: 20px;  /* space-5 */
  }
}

@media (min-width: 1024px) {
  .card {
    padding: 24px;        /* space-6 */
    margin-bottom: 24px;  /* space-6 */
  }
}
```

---

## CSS Variables & Implementation

### CSS Custom Properties
```css
:root {
  /* Spacing scale */
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-9: 36px;
  --space-10: 40px;
  --space-11: 44px;
  --space-12: 48px;
  --space-13: 52px;
  --space-14: 56px;
  --space-15: 60px;
  --space-16: 64px;
}
```

### Using CSS Variables
```css
.card {
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.button {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
```

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      11: '44px',
      12: '48px',
      13: '52px',
      14: '56px',
      15: '60px',
      16: '64px',
    }
  }
}
```

### Tailwind Classes
```html
<!-- Padding -->
<div class="p-4">p-4 = 16px padding</div>
<div class="px-6 py-4">px-6 py-4 = 24px horizontal, 16px vertical</div>
<div class="pt-8 pb-4">pt-8 pb-4 = 32px top, 16px bottom</div>

<!-- Margin -->
<div class="m-4">m-4 = 16px margin</div>
<div class="mb-6">mb-6 = 24px margin-bottom</div>
<div class="mx-auto">mx-auto = centered</div>

<!-- Gap (flexbox/grid) -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Spacing Guidelines

### General Principles
1. **Consistency:** Use the spacing scale consistently across the application
2. **Hierarchy:** Increase spacing for visual separation of distinct sections
3. **Breathing Room:** Ensure content has adequate whitespace
4. **Alignment:** All spacing should be multiples of 4px base unit
5. **Responsive:** Adjust spacing for different screen sizes

### Decision Tree
```
Is this spacing...
├── Between inline elements? → Use space-1 to space-2 (4-8px)
├── Between related components? → Use space-3 to space-4 (12-16px)
├── Between groups of components? → Use space-6 to space-8 (24-32px)
├── Between major sections? → Use space-8 to space-12 (32-48px)
└── Between page sections? → Use space-12 to space-16 (48-64px)
```

### Common Spacing Relationships
| Relationship | Spacing | Example |
|--------------|---------|---------|
| Inside button padding | space-3 / space-4 | 12px / 16px |
| Input field padding | space-3 / space-4 | 12px / 16px |
| Card padding | space-5 / space-6 | 20px / 24px |
| Component margin | space-4 / space-6 | 16px / 24px |
| Section padding | space-8 / space-12 | 32px / 48px |
| Page margins | space-8 | 32px |

---

## Density Variations

### Compact Spacing (Density +1)
Use for information-dense interfaces or constrained layouts.
```css
.compact {
  --space-scale: 0.75;  /* Reduces spacing to 75% */
}

.compact .card {
  padding: calc(var(--space-6) * 0.75);  /* 18px instead of 24px */
  margin-bottom: calc(var(--space-6) * 0.75);
}
```

### Comfortable Spacing (Default)
Standard spacing for most interfaces.
```css
.comfortable {
  --space-scale: 1;  /* Standard spacing */
}
```

### Spacious Spacing (Density -1)
Use for premium experiences or content-focused layouts.
```css
.spacious {
  --space-scale: 1.25;  /* Increases spacing to 125% */
}

.spacious .card {
  padding: calc(var(--space-6) * 1.25);  /* 30px instead of 24px */
  margin-bottom: calc(var(--space-6) * 1.25);
}
```

---

## Special Cases

### Negative Spacing
Occasionally negative spacing is used to create overlapping effects.
```css
.overlapping-element {
  margin-top: calc(var(--space-6) * -1);  /* -24px */
}
```

### Zero Spacing
Used when elements should directly touch (rare).
```css
.flush {
  margin: 0;
  padding: 0;
}
```

### Dynamic Spacing
Use CSS custom properties for runtime adjustments.
```css
:root.compact {
  --padding-scale: 0.75;
}

.card {
  padding: calc(24px * var(--padding-scale));
}
```

---

## Accessibility

### Whitespace & Readability
- Adequate spacing improves readability
- Generous line-height and letter-spacing aid comprehension
- Larger touch targets (minimum 44px × 44px) reduce errors

### Touch Targets
```css
.button {
  min-width: 44px;        /* WCAG AAA minimum */
  min-height: 44px;
  padding: 12px 16px;     /* Ensures adequate touch area */
}

.link {
  padding: 4px 8px;       /* Add padding for better touch targeting */
  display: inline-block;
}
```

### Focus Indicators
```css
button:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;    /* space-0.5 - creates breathing room */
}
```

---

## Performance Considerations

### CSS Grid & Flexbox Gaps
Modern layouts using gap property:
```css
.flex-container {
  display: flex;
  gap: 16px;              /* space-4 */
}

.grid-container {
  display: grid;
  gap: 16px 24px;         /* row gap / column gap */
}
```

Benefits:
- Simpler markup (no margin utilities needed)
- Consistent spacing
- Easier to adjust responsively

---

## Migration & Updates

When updating spacing:
1. Maintain backward compatibility with current spacing values
2. Test all components across responsive breakpoints
3. Verify touch targets meet minimum size requirements
4. Update documentation with new spacing ratios
5. Version spacing changes in release notes

---

**Last Updated:** 2026-04-05
**Version:** 1.0.0
