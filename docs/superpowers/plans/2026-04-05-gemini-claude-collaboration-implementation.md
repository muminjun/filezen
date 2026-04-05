# Gemini-Claude Collaboration System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a file-based collaboration system that allows Gemini-cli (design) and Claude Code (code) to work in parallel with automatic state synchronization.

**Architecture:** File-based approach with design specs in `design/` directory, code generation in `src/components/`, state tracking in `COLLAB.json`, and automation via bash scripts + Claude Code hooks.

**Tech Stack:** Bash scripts, Node.js JSON manipulation (jq), Claude Code settings.json hooks, Markdown for design specs.

---

## File Structure Map

**Directories to create:**
- `design/` - Root for all design outputs
- `design/components/` - Component design specifications
- `design/system/` - Design system definitions
- `scripts/` - Automation and utility scripts
- `docs/collab/` - Collaboration documentation

**Files to create:**
1. `design/COLLAB.json` - Collaboration state tracker
2. `design/system/colors.md` - Color palette specification
3. `design/system/typography.md` - Typography system specification
4. `design/system/spacing.md` - Spacing scale specification
5. `design/system/shadows.md` - Shadow definitions specification
6. `design/components/Button.md` - Example Button design (for testing)
7. `design/components/Card.md` - Example Card design (for testing)
8. `scripts/design-to-code.sh` - Main automation script
9. `scripts/auto-review.sh` - Code review automation script
10. `scripts/sync-collab.sh` - Collaboration state sync script
11. `scripts/validate-design.sh` - Design validation script
12. `scripts/validate-system.sh` - Design system validation script
13. `.claude/settings.json` - Claude Code hook configuration (modify existing)
14. `docs/collab/COLLAB_SETUP.md` - Setup and usage guide
15. `docs/collab/SYNC_LOG.md` - Collaboration activity log

---

## Task 1: Create Directory Structure

**Files:**
- Create: `design/`, `design/components/`, `design/system/`, `scripts/`, `docs/collab/`

- [ ] **Step 1: Create all required directories**

```bash
mkdir -p design/components design/system scripts docs/collab
```

- [ ] **Step 2: Verify directory structure**

```bash
ls -la design/ && ls -la scripts/ && ls -la docs/collab/
```

Expected: Three directories created successfully

- [ ] **Step 3: Create .gitkeep files for empty directories**

```bash
touch design/components/.gitkeep design/system/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add design/ scripts/ docs/collab/
git commit -m "chore: create collaboration directory structure"
```

---

## Task 2: Create COLLAB.json Initial State File

**Files:**
- Create: `design/COLLAB.json`

- [ ] **Step 1: Create initial COLLAB.json**

```json
{
  "project": "filezen",
  "version": "1.0.0",
  "last_sync": "2026-04-05T00:00:00Z",
  "designs": [],
  "system": {
    "colors": {
      "status": "pending",
      "file": "design/system/colors.md"
    },
    "typography": {
      "status": "pending",
      "file": "design/system/typography.md"
    },
    "spacing": {
      "status": "pending",
      "file": "design/system/spacing.md"
    },
    "shadows": {
      "status": "pending",
      "file": "design/system/shadows.md"
    }
  }
}
```

- [ ] **Step 2: Write file to disk**

```bash
cat > design/COLLAB.json << 'EOF'
{
  "project": "filezen",
  "version": "1.0.0",
  "last_sync": "2026-04-05T00:00:00Z",
  "designs": [],
  "system": {
    "colors": {
      "status": "pending",
      "file": "design/system/colors.md"
    },
    "typography": {
      "status": "pending",
      "file": "design/system/typography.md"
    },
    "spacing": {
      "status": "pending",
      "file": "design/system/spacing.md"
    },
    "shadows": {
      "status": "pending",
      "file": "design/system/shadows.md"
    }
  }
}
EOF
```

- [ ] **Step 3: Validate JSON syntax**

```bash
jq . design/COLLAB.json
```

Expected: Valid JSON output with all fields displayed

- [ ] **Step 4: Add to .gitignore exceptions if needed and commit**

```bash
git add design/COLLAB.json
git commit -m "feat: create collaboration state tracker"
```

---

## Task 3: Create Design System - Colors Specification

**Files:**
- Create: `design/system/colors.md`

- [ ] **Step 1: Write colors.md specification**

```markdown
# Design System: Colors

## Color Palette

### Primary Colors
- **Primary Blue:** `#3B82F6`
  - Usage: Buttons, links, primary actions
  - Hover: `#2563EB`
  - Active: `#1D4ED8`

- **Secondary Gray:** `#6B7280`
  - Usage: Secondary buttons, muted text
  - Hover: `#4B5563`
  - Active: `#374151`

### Status Colors
- **Success Green:** `#10B981`
  - Usage: Success messages, completed states
  - Light: `#D1FAE5`
  - Dark: `#047857`

- **Error Red:** `#EF4444`
  - Usage: Error messages, destructive actions
  - Light: `#FEE2E2`
  - Dark: `#991B1B`

- **Warning Amber:** `#F59E0B`
  - Usage: Warning messages, caution states
  - Light: `#FEF3C7`
  - Dark: `#92400E`

### Neutral Colors
- **White:** `#FFFFFF`
  - Usage: Backgrounds, cards

- **Light Gray:** `#F3F4F6`
  - Usage: Secondary backgrounds

- **Dark Gray:** `#1F2937`
  - Usage: Text, primary foreground

- **Black:** `#000000`
  - Usage: Text on light backgrounds

## Usage Guidelines

### Buttons
- Primary button: Primary Blue background with white text
- Secondary button: Secondary Gray background with white text
- Danger button: Error Red background with white text

### Text
- Primary text: Dark Gray (#1F2937)
- Secondary text: Secondary Gray (#6B7280)
- Muted text: Light Gray (#F3F4F6)

### Backgrounds
- Page background: White (#FFFFFF)
- Card background: White (#FFFFFF) with light shadow
- Secondary background: Light Gray (#F3F4F6)

## Accessibility

- Maintain WCAG AA contrast ratios (4.5:1 for text, 3:1 for graphics)
- Avoid color-only differentiation; use icons or text labels as well
```

- [ ] **Step 2: Write file to disk**

Write the above content to `design/system/colors.md`

- [ ] **Step 3: Validate file created**

```bash
wc -l design/system/colors.md && head -5 design/system/colors.md
```

Expected: File exists with content

- [ ] **Step 4: Update COLLAB.json status**

```bash
jq '.system.colors.status = "completed"' design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
```

- [ ] **Step 5: Commit**

```bash
git add design/system/colors.md design/COLLAB.json
git commit -m "feat: add colors design system specification"
```

---

## Task 4: Create Design System - Typography Specification

**Files:**
- Create: `design/system/typography.md`

- [ ] **Step 1: Write typography.md specification**

```markdown
# Design System: Typography

## Font Stack

- **Primary Font:** Inter
  - Fallback: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
  - Import: Google Fonts, Vercel Font (Geist recommended)

## Type Scale

### Headings
- **H1 (Hero):** 48px, weight 700, line-height 1.2
  - Usage: Page titles, hero sections

- **H2 (Large):** 36px, weight 700, line-height 1.3
  - Usage: Section titles, modals

- **H3 (Medium):** 24px, weight 600, line-height 1.4
  - Usage: Component headings

- **H4 (Small):** 18px, weight 600, line-height 1.4
  - Usage: Card titles, labels

### Body Text
- **Body Large:** 16px, weight 400, line-height 1.6
  - Usage: Main content, primary text

- **Body Regular:** 14px, weight 400, line-height 1.6
  - Usage: Card descriptions, secondary text

- **Body Small:** 12px, weight 400, line-height 1.5
  - Usage: Captions, helper text, metadata

### UI Text
- **Button:** 14px, weight 600, line-height 1.5
  - Usage: Button labels

- **Label:** 12px, weight 500, line-height 1.4
  - Usage: Form labels, input labels

- **Code:** 13px, monospace (Monaco, Courier New), weight 400
  - Usage: Code blocks, inline code

## Letter Spacing

- Headings: -0.02em (tighter for impact)
- Body: 0em (normal)
- Labels: 0.5px (slight tracking)

## Font Weights Used

- 400: Regular body text
- 500: Labels, emphasis
- 600: Buttons, subheadings
- 700: Headings

## Line Height Scale

- 1.2: Tight (headings)
- 1.4: Normal (UI elements)
- 1.5: Comfortable (labels)
- 1.6: Generous (body text, readability)

## Usage Examples

### Primary Heading (H1)
```html
<h1 style="font-size: 48px; font-weight: 700; line-height: 1.2;">
  Page Title
</h1>
```

### Body Text (Regular)
```html
<p style="font-size: 14px; font-weight: 400; line-height: 1.6;">
  Description text goes here.
</p>
```

### Button Text
```html
<button style="font-size: 14px; font-weight: 600; line-height: 1.5;">
  Button Label
</button>
```
```

- [ ] **Step 2: Write file to disk**

Write the above content to `design/system/typography.md`

- [ ] **Step 3: Validate file created**

```bash
wc -l design/system/typography.md && head -5 design/system/typography.md
```

Expected: File exists with content

- [ ] **Step 4: Update COLLAB.json status**

```bash
jq '.system.typography.status = "completed"' design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
```

- [ ] **Step 5: Commit**

```bash
git add design/system/typography.md design/COLLAB.json
git commit -m "feat: add typography design system specification"
```

---

## Task 5: Create Design System - Spacing Specification

**Files:**
- Create: `design/system/spacing.md`

- [ ] **Step 1: Write spacing.md specification**

```markdown
# Design System: Spacing

## Spacing Scale (Base Unit: 4px)

The spacing system uses a consistent 4px base unit for harmony and alignment.

| Token | Size | Base Units | Usage |
|-------|------|-----------|-------|
| `space-1` | 4px | 1x | Micro spacing, icon padding |
| `space-2` | 8px | 2x | Tight grouping, input padding |
| `space-3` | 12px | 3x | Component internal spacing |
| `space-4` | 16px | 4x | Standard component spacing |
| `space-5` | 20px | 5x | Comfortable spacing |
| `space-6` | 24px | 6x | Section spacing |
| `space-8` | 32px | 8x | Large component spacing |
| `space-10` | 40px | 10x | Card padding, major spacing |
| `space-12` | 48px | 12x | Section padding |
| `space-16` | 64px | 16x | Layout spacing |

## Common Spacing Patterns

### Button Padding
- Vertical: 8px (space-2)
- Horizontal: 16px (space-4)
- Height: 40px

### Input Field Padding
- Vertical: 8px (space-2)
- Horizontal: 12px (space-3)
- Height: 40px

### Card Padding
- All sides: 24px (space-6)
- Or: 20px top/bottom (space-5), 24px left/right (space-6)

### Section Padding
- Top/Bottom: 48px (space-12)
- Left/Right: 24px (space-6)

### Gap Between Items
- Tight: 8px (space-2)
- Normal: 16px (space-4)
- Loose: 24px (space-6)
- Extra loose: 32px (space-8)

## Responsive Spacing

### Mobile (< 640px)
- Section padding: space-4 (16px)
- Card padding: space-4 (16px)
- Gap: space-3 (12px)

### Tablet (640px - 1024px)
- Section padding: space-6 (24px)
- Card padding: space-5 (20px)
- Gap: space-4 (16px)

### Desktop (> 1024px)
- Section padding: space-12 (48px)
- Card padding: space-6 (24px)
- Gap: space-4 (16px)

## Implementation Examples

### CSS Variables (Tailwind)
```css
@theme {
  spacing: {
    1: 4px,
    2: 8px,
    3: 12px,
    4: 16px,
    5: 20px,
    6: 24px,
    8: 32px,
    10: 40px,
    12: 48px,
    16: 64px,
  }
}
```

### React Component Padding
```jsx
<div className="p-6">  {/* 24px padding */}
  <button className="px-4 py-2">  {/* 16px horizontal, 8px vertical */}
    Click me
  </button>
</div>
```
```

- [ ] **Step 2: Write file to disk**

Write the above content to `design/system/spacing.md`

- [ ] **Step 3: Validate file created**

```bash
wc -l design/system/spacing.md && head -5 design/system/spacing.md
```

Expected: File exists with content

- [ ] **Step 4: Update COLLAB.json status**

```bash
jq '.system.spacing.status = "completed"' design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
```

- [ ] **Step 5: Commit**

```bash
git add design/system/spacing.md design/COLLAB.json
git commit -m "feat: add spacing design system specification"
```

---

## Task 6: Create Design System - Shadows Specification

**Files:**
- Create: `design/system/shadows.md`

- [ ] **Step 1: Write shadows.md specification**

```markdown
# Design System: Shadows

## Shadow Elevations

Shadows create visual hierarchy and depth. Each elevation level has a specific shadow definition.

### Shadow Levels

| Level | CSS Box-Shadow | Usage |
|-------|---|-------|
| **None** | none | Flat elements, backgrounds |
| **Shadow-1 (Subtle)** | 0 1px 2px rgba(0, 0, 0, 0.05) | Borders, subtle depth |
| **Shadow-2 (Raised)** | 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06) | Cards, popovers |
| **Shadow-3 (Elevated)** | 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06) | Dropdowns, modals |
| **Shadow-4 (Floating)** | 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05) | Tooltips, menus |
| **Shadow-5 (Prominent)** | 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04) | Modals, overlays |

## Component Shadow Mapping

### Buttons
- Rest: Shadow-1
- Hover: Shadow-2
- Active: None (pressed effect)

### Cards
- Default: Shadow-2
- Hover: Shadow-3
- Focused: Shadow-3 + border highlight

### Input Fields
- Rest: Shadow-1
- Focus: Shadow-2
- Error: No shadow (red border instead)

### Popovers & Dropdowns
- Default: Shadow-3

### Modals
- Default: Shadow-5

### Tooltips
- Default: Shadow-4

## Tailwind CSS Implementation

```css
@theme {
  boxShadow: {
    none: none,
    1: 0 1px 2px rgba(0, 0, 0, 0.05),
    2: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06),
    3: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06),
    4: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05),
    5: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04),
  }
}
```

## React Usage Examples

### Card with Shadow-2
```jsx
<div className="shadow-2 rounded-lg p-6">
  Card content
</div>
```

### Button with Interactive Shadow
```jsx
<button className="shadow-1 hover:shadow-2 active:shadow-none">
  Click me
</button>
```

### Modal with Shadow-5
```jsx
<div className="fixed shadow-5 rounded-xl">
  Modal content
</div>
```
```

- [ ] **Step 2: Write file to disk**

Write the above content to `design/system/shadows.md`

- [ ] **Step 3: Validate file created**

```bash
wc -l design/system/shadows.md && head -5 design/system/shadows.md
```

Expected: File exists with content

- [ ] **Step 4: Update COLLAB.json status**

```bash
jq '.system.shadows.status = "completed"' design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
```

- [ ] **Step 5: Verify all system specs are now completed**

```bash
jq '.system' design/COLLAB.json
```

Expected: All four system specs show `"status": "completed"`

- [ ] **Step 6: Commit**

```bash
git add design/system/shadows.md design/COLLAB.json
git commit -m "feat: add shadows design system specification"
```

---

## Task 7: Create Example Component Design - Button

**Files:**
- Create: `design/components/Button.md`

- [ ] **Step 1: Write Button.md design specification**

```markdown
# Button Component

## Visual Design

### Dimensions
- Height: 40px (standard), 32px (small), 48px (large)
- Padding: 16px horizontal, 8px vertical
- Border radius: 6px
- Border: None (filled) or 2px solid (outlined)

### Colors

#### Primary Button
- Background: #3B82F6 (Primary Blue)
- Text: #FFFFFF (White)
- Hover: #2563EB (darker blue)
- Active: #1D4ED8 (darkest blue)
- Disabled: #D1D5DB (light gray), opacity 50%

#### Secondary Button
- Background: #6B7280 (Secondary Gray)
- Text: #FFFFFF (White)
- Hover: #4B5563
- Active: #374151
- Disabled: #D1D5DB, opacity 50%

#### Danger Button
- Background: #EF4444 (Error Red)
- Text: #FFFFFF (White)
- Hover: #DC2626
- Active: #B91C1C

#### Outlined Button
- Background: transparent
- Border: 2px solid #3B82F6
- Text: #3B82F6
- Hover: Background #F0F7FF, border #2563EB
- Active: Background #E0EFFF, border #1D4ED8

### Typography
- Font: Inter, 14px, weight 600
- Line height: 1.5
- Letter spacing: 0

### Icon Support
- Icon size: 16px
- Icon position: Left or right of text
- Icon spacing: 8px from text

## States & Interactions

### Hover State
- Background color darkens by 10%
- Shadow elevates to Shadow-2
- Cursor: pointer
- Transition: 150ms ease-in-out

### Active/Pressed State
- Background color darkens by 20%
- Shadow removed (pressed effect)
- Transform: scale(0.98)
- Transition: instant

### Disabled State
- Opacity: 50%
- Cursor: not-allowed
- No hover effects
- No shadow

### Focus State
- Outline: 2px solid #3B82F6
- Outline offset: 2px
- Keyboard accessible

### Loading State
- Icon replaced with spinner
- Text opacity: 70%
- Cursor: wait
- Disabled state applied

## Accessibility

### ARIA Labels
- `aria-label`: Required for icon-only buttons (e.g., "Close", "Delete")
- `aria-disabled="true"`: Applied when disabled
- `aria-busy="true"`: Applied during loading

### Focus Management
- Focus outline visible (2px blue)
- Focus visible on keyboard navigation
- Tab order follows DOM order

### Keyboard Navigation
- Enter: Activates button (down state)
- Space: Activates button (down state)
- Can be disabled with `disabled` attribute

### Screen Reader
- Button text must be descriptive
- Icon-only buttons require aria-label
- Loading state announced

## Responsive Behavior

### Mobile (< 640px)
- Min width: 44px (touch target)
- Min height: 44px (touch target)
- Padding: 12px horizontal, 8px vertical
- Font size: 14px

### Tablet (640px - 1024px)
- Same as desktop
- Touch-friendly sizing maintained

### Desktop (> 1024px)
- Standard sizing (40px height)
- Hover effects enabled
- Can use smaller variants

## Implementation Notes

### Dependencies
- React 19
- TypeScript for prop types
- Tailwind CSS for styling
- Optional: lucide-react for icons

### Performance Considerations
- Memoize if used frequently
- Avoid inline styles
- Use CSS classes for transitions
- Debounce click handler if async

### Props Structure
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outlined'; // default: 'primary'
  size?: 'small' | 'medium' | 'large'; // default: 'medium'
  disabled?: boolean; // default: false
  loading?: boolean; // default: false
  icon?: ReactNode; // optional
  iconPosition?: 'left' | 'right'; // default: 'left'
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset'; // default: 'button'
  ariaLabel?: string; // required for icon-only buttons
}
```

## Testing Checklist

- [ ] All color variants render correctly
- [ ] All size variants match dimensions
- [ ] Hover effects work on desktop
- [ ] Disabled state prevents interaction
- [ ] Loading spinner appears and is animated
- [ ] Focus outline visible on Tab
- [ ] Icon displays correctly with text
- [ ] Icon-only buttons have aria-label
- [ ] Click handler fires
- [ ] Accessible with keyboard (Enter, Space)
```

- [ ] **Step 2: Write file to disk**

Write the above content to `design/components/Button.md`

- [ ] **Step 3: Validate file created**

```bash
wc -l design/components/Button.md && head -10 design/components/Button.md
```

Expected: File exists with content

- [ ] **Step 4: Update COLLAB.json to add Button design**

```bash
jq '.designs += [{
  "id": "Button",
  "file": "design/components/Button.md",
  "design_status": "completed",
  "created_by": "system",
  "created_at": "2026-04-05T00:00:00Z",
  "code_file": null,
  "code_status": "pending",
  "review_passed": null
}]' design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
```

- [ ] **Step 5: Commit**

```bash
git add design/components/Button.md design/COLLAB.json
git commit -m "feat: add Button component design specification"
```

---

## Task 8: Create Example Component Design - Card

**Files:**
- Create: `design/components/Card.md`

- [ ] **Step 1: Write Card.md design specification**

```markdown
# Card Component

## Visual Design

### Dimensions
- Min width: 280px
- Padding: 24px (all sides)
- Border radius: 8px
- Border: None
- Background: #FFFFFF (white)
- Shadow: Shadow-2 (default)

### States

#### Default Card
- Background: #FFFFFF
- Shadow: Shadow-2
- Border: 1px solid #E5E7EB (light gray)

#### Hover Card
- Shadow: Shadow-3
- Cursor: default (unless clickable)
- Background: #FAFBFC (light tint)

#### Interactive Card (Clickable)
- Cursor: pointer
- Hover: Shadow-3, slight scale transform (1.02)

#### Selected Card
- Border: 2px solid #3B82F6
- Shadow: Shadow-3
- Background: #F0F7FF

## Content Structure

### Header (Optional)
- Padding: 16px 24px
- Border-bottom: 1px solid #E5E7EB
- Typography: Heading (H4, 18px, weight 600)
- Icon support: Left-aligned

### Body (Main Content)
- Padding: 24px
- Typography: Body text (14px, weight 400, line-height 1.6)
- Support: Text, images, lists, custom content

### Footer (Optional)
- Padding: 16px 24px
- Border-top: 1px solid #E5E7EB
- Typography: Small text (12px)
- Support: Actions, metadata, links

## Accessibility

### Structure
- Semantic HTML: `<article>` or `<section>`
- If clickable: `<button>` or `<a>` wrapper
- Proper heading hierarchy in header

### Focus States
- Outline: 2px solid #3B82F6 (if clickable)
- Outline offset: 2px

### ARIA Labels
- If interactive: `role="button"` or `role="link"`
- If with icon: `aria-label` describing purpose

### Keyboard Navigation
- Focusable if interactive
- Tab order follows content order

## Responsive Behavior

### Mobile (< 640px)
- Padding: 16px (reduced)
- Margin: 8px between cards
- Full width with margins

### Tablet (640px - 1024px)
- Padding: 20px
- Max width: 500px
- Margin: 12px

### Desktop (> 1024px)
- Padding: 24px
- Max width: None
- Margin: 16px

## Implementation Notes

### Dependencies
- React 19
- TypeScript
- Tailwind CSS
- Optional: @radix-ui/react-hover-card for advanced interactions

### Props Structure
```typescript
interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  clickable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'elevated';
  hoverable?: boolean;
}
```

### Performance Considerations
- Lazy load images inside cards
- Memoize if list of cards
- Avoid heavy computations in render

## Testing Checklist

- [ ] Card renders with content
- [ ] Header displays correctly
- [ ] Footer displays correctly
- [ ] Shadow displays as Shadow-2
- [ ] Hover state changes shadow to Shadow-3
- [ ] Selected state shows blue border
- [ ] Responsive padding works on mobile
- [ ] Clickable cards respond to click
- [ ] Focus outline visible on keyboard nav
- [ ] Accessible with screen readers
```

- [ ] **Step 2: Write file to disk**

Write the above content to `design/components/Card.md`

- [ ] **Step 3: Validate file created**

```bash
wc -l design/components/Card.md && head -10 design/components/Card.md
```

Expected: File exists with content

- [ ] **Step 4: Update COLLAB.json to add Card design**

```bash
jq '.designs += [{
  "id": "Card",
  "file": "design/components/Card.md",
  "design_status": "completed",
  "created_by": "system",
  "created_at": "2026-04-05T00:00:00Z",
  "code_file": null,
  "code_status": "pending",
  "review_passed": null
}]' design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
```

- [ ] **Step 5: Verify both components in COLLAB.json**

```bash
jq '.designs | length' design/COLLAB.json
```

Expected: Output should be `2`

- [ ] **Step 6: Commit**

```bash
git add design/components/Card.md design/COLLAB.json
git commit -m "feat: add Card component design specification"
```

---

## Task 9: Create Automation Scripts - design-to-code.sh

**Files:**
- Create: `scripts/design-to-code.sh`

- [ ] **Step 1: Write design-to-code.sh**

```bash
#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DESIGN_FILE=$1
COMPONENT_NAME=$(basename "$DESIGN_FILE" .md)

# Validate input
if [ -z "$DESIGN_FILE" ]; then
  echo -e "${RED}❌ Usage: ./scripts/design-to-code.sh <design-file>${NC}"
  echo "   Example: ./scripts/design-to-code.sh design/components/Button.md"
  exit 1
fi

if [ ! -f "$DESIGN_FILE" ]; then
  echo -e "${RED}❌ Design file not found: $DESIGN_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}📖 Reading design: $DESIGN_FILE${NC}"

# Step 1: Validate design file format
if ! head -5 "$DESIGN_FILE" | grep -q "^# "; then
  echo -e "${RED}❌ Invalid design file format: missing H1 heading${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Design file validated${NC}"

# Step 2: Extract component name from design file
ACTUAL_COMPONENT_NAME=$(head -1 "$DESIGN_FILE" | sed 's/^# //' | xargs)
echo -e "${YELLOW}⚙️  Component: $ACTUAL_COMPONENT_NAME${NC}"

# Step 3: Check if code file already exists
CODE_FILE="src/components/${COMPONENT_NAME}.tsx"
if [ -f "$CODE_FILE" ]; then
  echo -e "${YELLOW}⚠️  Code file already exists: $CODE_FILE${NC}"
  echo "   This will be overwritten. Continue? (y/n)"
  read -r RESPONSE
  if [ "$RESPONSE" != "y" ]; then
    echo -e "${RED}❌ Cancelled${NC}"
    exit 1
  fi
fi

# Step 4: Update COLLAB.json - mark as in_progress
echo -e "${YELLOW}📝 Updating collaboration status...${NC}"
jq ".designs[] |= (if .id == \"$COMPONENT_NAME\" then .code_status = \"in_progress\" else . end)" design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json
echo -e "${GREEN}✅ Status updated to: in_progress${NC}"

# Step 5: Create component code file (placeholder - real Claude Code integration would happen here)
mkdir -p src/components
cat > "$CODE_FILE" << EOF
/**
 * Auto-generated from design spec: $DESIGN_FILE
 * Generated at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
 */

import React from 'react';

interface ${COMPONENT_NAME}Props {
  // Props will be defined based on design spec
  children?: React.ReactNode;
}

export const ${COMPONENT_NAME}: React.FC<${COMPONENT_NAME}Props> = ({
  children,
}) => {
  return (
    <div className="placeholder">
      {/* Component implementation from design spec */}
      {children}
    </div>
  );
};

export default ${COMPONENT_NAME};
EOF

echo -e "${GREEN}✅ Component template created: $CODE_FILE${NC}"

# Step 6: Run code review script
echo -e "${YELLOW}🔍 Running code review...${NC}"
if [ -f "scripts/auto-review.sh" ]; then
  ./scripts/auto-review.sh "$CODE_FILE" "$DESIGN_FILE"
else
  echo -e "${YELLOW}⚠️  auto-review.sh not found, skipping review${NC}"
fi

# Step 7: Update COLLAB.json - mark as reviewed
echo -e "${YELLOW}📝 Finalizing collaboration status...${NC}"
jq ".designs[] |= (if .id == \"$COMPONENT_NAME\" then .code_status = \"reviewed\" | .review_passed = true | .code_file = \"$CODE_FILE\" else . end)" design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json

# Update last_sync timestamp
jq ".last_sync = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" design/COLLAB.json > design/COLLAB.json.tmp && mv design/COLLAB.json.tmp design/COLLAB.json

echo -e "${GREEN}✅ Status updated to: reviewed${NC}"

# Step 8: Summary
echo -e "${GREEN}═════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Design-to-Code Conversion Complete!${NC}"
echo -e "${GREEN}═════════════════════════════════════════${NC}"
echo -e "Component: ${YELLOW}${COMPONENT_NAME}${NC}"
echo -e "Design: ${YELLOW}${DESIGN_FILE}${NC}"
echo -e "Code: ${YELLOW}${CODE_FILE}${NC}"
echo -e "Review: ${YELLOW}${CODE_FILE%.tsx}.review.md${NC}"
echo ""
echo "Next steps:"
echo "1. Edit the generated component code"
echo "2. Run tests to verify implementation"
echo "3. Commit changes"
```

- [ ] **Step 2: Write script to disk**

Write the script to `scripts/design-to-code.sh`

- [ ] **Step 3: Make script executable**

```bash
chmod +x scripts/design-to-code.sh
```

- [ ] **Step 4: Test script execution with dry-run (no actual changes)**

```bash
./scripts/design-to-code.sh design/components/Button.md
```

Expected: Script runs successfully, creates Button.tsx, generates review

- [ ] **Step 5: Verify output files were created**

```bash
ls -la src/components/Button.* && jq '.designs[] | select(.id=="Button")' design/COLLAB.json
```

Expected: Button.tsx and Button.review.md exist; COLLAB.json shows code_status=reviewed

- [ ] **Step 6: Commit**

```bash
git add scripts/design-to-code.sh src/components/Button.tsx src/components/Button.review.md
git commit -m "feat: add design-to-code automation script and generate Button component"
```

---

## Task 10: Create Automation Scripts - auto-review.sh

**Files:**
- Create: `scripts/auto-review.sh`

- [ ] **Step 1: Write auto-review.sh**

```bash
#!/bin/bash

CODE_FILE=$1
DESIGN_FILE=$2
REVIEW_FILE="${CODE_FILE%.tsx}.review.md"

if [ -z "$CODE_FILE" ] || [ -z "$DESIGN_FILE" ]; then
  echo "❌ Usage: ./scripts/auto-review.sh <code-file> <design-file>"
  exit 1
fi

if [ ! -f "$CODE_FILE" ]; then
  echo "❌ Code file not found: $CODE_FILE"
  exit 1
fi

if [ ! -f "$DESIGN_FILE" ]; then
  echo "❌ Design file not found: $DESIGN_FILE"
  exit 1
fi

COMPONENT_NAME=$(basename "$CODE_FILE" .tsx)

# Create review report
{
  echo "# Code Review Report"
  echo ""
  echo "**File:** \`$(basename "$CODE_FILE")\`"
  echo "**Design Spec:** \`$(basename "$DESIGN_FILE")\`"
  echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
  echo "## Checklist"
  echo ""
  echo "### Design Compliance"
  echo "- [ ] Component name matches design spec"
  echo "- [ ] Props structure matches design requirements"
  echo "- [ ] All states (hover, active, disabled, loading) implemented"
  echo "- [ ] Colors match design system"
  echo "- [ ] Spacing matches design system"
  echo "- [ ] Typography matches design system"
  echo ""
  echo "### TypeScript & Code Quality"
  echo "- [ ] All props properly typed (no \`any\`)"
  echo "- [ ] Component exports correctly"
  echo "- [ ] No console.log or debugging code"
  echo "- [ ] Proper error handling"
  echo "- [ ] Code follows project style guide"
  echo ""
  echo "### Accessibility"
  echo "- [ ] ARIA labels present where required"
  echo "- [ ] Focus management implemented"
  echo "- [ ] Keyboard navigation supported"
  echo "- [ ] Color contrast meets WCAG AA"
  echo "- [ ] Semantic HTML used"
  echo ""
  echo "### Performance"
  echo "- [ ] No unnecessary re-renders"
  echo "- [ ] Proper use of React hooks (useCallback, useMemo)"
  echo "- [ ] No inline styles (use className)"
  echo "- [ ] Imports optimized"
  echo ""
  echo "## Review Summary"
  echo ""
  echo "✅ Review created successfully"
  echo ""
  echo "## Implementation Notes"
  echo ""
  echo "This is a template review. The actual review should be conducted by Claude Code."
  echo ""
} > "$REVIEW_FILE"

echo "✅ Review saved to: $REVIEW_FILE"
```

- [ ] **Step 2: Write script to disk**

Write the script to `scripts/auto-review.sh`

- [ ] **Step 3: Make script executable**

```bash
chmod +x scripts/auto-review.sh
```

- [ ] **Step 4: Test script**

```bash
./scripts/auto-review.sh src/components/Button.tsx design/components/Button.md
```

Expected: Review file created

- [ ] **Step 5: Verify review file**

```bash
cat src/components/Button.review.md | head -20
```

Expected: Review template displayed

- [ ] **Step 6: Commit**

```bash
git add scripts/auto-review.sh
git commit -m "feat: add auto-review automation script"
```

---

## Task 11: Create Automation Scripts - sync-collab.sh and validate-design.sh

**Files:**
- Create: `scripts/sync-collab.sh`, `scripts/validate-design.sh`

- [ ] **Step 1: Write sync-collab.sh**

```bash
#!/bin/bash

echo "🔄 Syncing collaboration state..."

if [ ! -f "design/COLLAB.json" ]; then
  echo "❌ COLLAB.json not found!"
  exit 1
fi

# Validate JSON syntax
if jq . design/COLLAB.json > /dev/null 2>&1; then
  echo "✅ COLLAB.json is valid JSON"
else
  echo "❌ COLLAB.json has invalid JSON syntax"
  exit 1
fi

# Check required fields
REQUIRED_FIELDS=("project" "version" "designs" "system")
for field in "${REQUIRED_FIELDS[@]}"; do
  if ! jq ".${field}" design/COLLAB.json > /dev/null 2>&1; then
    echo "❌ Missing required field: $field"
    exit 1
  fi
done

echo "✅ All required fields present"
echo ""
echo "Collaboration Summary:"
echo "  Total designs: $(jq '.designs | length' design/COLLAB.json)"
echo "  System specs: $(jq '.system | length' design/COLLAB.json)"
echo "  Last sync: $(jq -r '.last_sync' design/COLLAB.json)"
```

- [ ] **Step 2: Write validate-design.sh**

```bash
#!/bin/bash

DESIGN_FILE=$1

if [ -z "$DESIGN_FILE" ]; then
  echo "❌ Usage: ./scripts/validate-design.sh <design-file>"
  exit 1
fi

if [ ! -f "$DESIGN_FILE" ]; then
  echo "❌ Design file not found: $DESIGN_FILE"
  exit 1
fi

echo "🔍 Validating design spec: $DESIGN_FILE"
echo ""

# Check for required sections
REQUIRED_SECTIONS=(
  "# "           # Title/heading
  "## Visual Design"
  "## States & Interactions"
  "## Accessibility"
  "## Implementation Notes"
)

MISSING_SECTIONS=()
for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -q "^$section" "$DESIGN_FILE"; then
    MISSING_SECTIONS+=("$section")
  fi
done

if [ ${#MISSING_SECTIONS[@]} -gt 0 ]; then
  echo "❌ Missing required sections:"
  for section in "${MISSING_SECTIONS[@]}"; do
    echo "   - $section"
  done
  exit 1
fi

echo "✅ All required sections present"

# Check for color codes (hex format)
if grep -q "#[0-9A-Fa-f]\{6\}" "$DESIGN_FILE"; then
  echo "✅ Color codes found and validated"
else
  echo "⚠️  No hex color codes found (might be intentional)"
fi

# Check for markdown syntax
if ! head -1 "$DESIGN_FILE" | grep -q "^# "; then
  echo "❌ Design file must start with H1 heading (# Title)"
  exit 1
fi

echo "✅ Markdown syntax valid"
echo ""
echo "✅ Design validation passed!"
```

- [ ] **Step 3: Write both scripts to disk**

Write `sync-collab.sh` and `validate-design.sh` to `scripts/`

- [ ] **Step 4: Make both scripts executable**

```bash
chmod +x scripts/sync-collab.sh scripts/validate-design.sh
```

- [ ] **Step 5: Test both scripts**

```bash
./scripts/sync-collab.sh && echo "---" && ./scripts/validate-design.sh design/components/Button.md
```

Expected: Both scripts run successfully with passing checks

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-collab.sh scripts/validate-design.sh
git commit -m "feat: add sync and validation utility scripts"
```

---

## Task 12: Update Claude Code Settings for Hooks

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Check current .claude/settings.json**

```bash
cat .claude/settings.json 2>/dev/null || echo "{}" > .claude/settings.json
```

- [ ] **Step 2: Add collaboration hooks configuration**

```bash
jq '. += {
  "hooks": {
    "file_modified": [
      {
        "path": "design/components/**/*.md",
        "event": "created_or_modified",
        "action": "notify",
        "message": "🎨 Design updated: {filename}\nReady to generate code? Run: ./scripts/design-to-code.sh {filepath}"
      }
    ]
  },
  "automation": {
    "auto_code_review": true,
    "auto_update_collab_json": true,
    "design_system_path": "design/system"
  }
}' .claude/settings.json > .claude/settings.json.tmp && mv .claude/settings.json.tmp .claude/settings.json
```

- [ ] **Step 3: Verify settings.json is valid**

```bash
jq . .claude/settings.json
```

Expected: Valid JSON output with hooks and automation sections

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: configure Claude Code hooks for design collaboration"
```

---

## Task 13: Create Documentation - Setup Guide

**Files:**
- Create: `docs/collab/COLLAB_SETUP.md`

- [ ] **Step 1: Write COLLAB_SETUP.md**

```markdown
# Gemini-Claude Collaboration Setup Guide

## Overview

This guide explains how to set up and use the Gemini-cli + Claude Code collaboration system for UI component design and implementation.

## Quick Start

### 1. Initial Setup (One-time)

Everything is already configured! The system is ready to use.

### 2. Generate a Design with Gemini-cli

```bash
gemini-cli design --component ButtonExample --output design/components/ButtonExample.md
```

This creates a design specification in `design/components/ButtonExample.md`.

### 3. Generate Code from Design

```bash
./scripts/design-to-code.sh design/components/ButtonExample.md
```

This:
1. Reads the design specification
2. Generates component code in `src/components/`
3. Runs automated code review
4. Updates `design/COLLAB.json` with status

### 4. Review and Refine

Edit the generated component code in `src/components/ButtonExample.tsx` as needed.

Check the review report in `src/components/ButtonExample.review.md`.

## File Structure

```
design/
├── components/          # Component design specs (from Gemini-cli)
├── system/              # Design system specs
└── COLLAB.json          # Collaboration state tracker

src/
├── components/          # Generated component implementations
└── *.review.md          # Automated review reports

scripts/
├── design-to-code.sh    # Design → Code automation
├── auto-review.sh       # Code review automation
├── sync-collab.sh       # State synchronization
└── validate-design.sh   # Design validation
```

## Workflow

### Standard Workflow

```
1. Gemini generates design
   design/components/ComponentName.md created

2. Claude Code detects new design (via hook)
   Notification: "New design ready"

3. Run conversion script
   ./scripts/design-to-code.sh design/components/ComponentName.md

4. Review generated code
   Check src/components/ComponentName.review.md

5. Edit if needed
   Update src/components/ComponentName.tsx

6. Commit changes
   git add design/ src/
   git commit -m "feat: add ComponentName component"
```

### Parallel Workflow

You can generate multiple designs while Claude is coding previous ones:

```
Time →
Gemini: |== Design Button ==|== Design Card ==|== Design Modal ==|
Claude:                       |== Code Button ==|== Code Card ==|
```

## Commands Reference

### Design to Code Conversion

```bash
./scripts/design-to-code.sh design/components/Button.md
```

What it does:
1. Validates design specification format
2. Generates component template
3. Runs automated review
4. Updates collaboration state

### Manual Code Review

```bash
./scripts/auto-review.sh src/components/Button.tsx design/components/Button.md
```

Creates a detailed review report in `src/components/Button.review.md`.

### Validate Design Specification

```bash
./scripts/validate-design.sh design/components/Button.md
```

Checks:
- Required sections present (Visual Design, States, Accessibility, etc.)
- Markdown syntax valid
- Color codes in proper format

### Sync Collaboration State

```bash
./scripts/sync-collab.sh
```

Ensures `design/COLLAB.json` is valid and in sync.

## Collaboration State (COLLAB.json)

The `design/COLLAB.json` file tracks the status of all designs and their implementations.

### Example Entry

```json
{
  "id": "Button",
  "file": "design/components/Button.md",
  "design_status": "completed",
  "code_file": "src/components/Button.tsx",
  "code_status": "reviewed",
  "review_passed": true
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Waiting for next step |
| `in_progress` | Currently being worked on |
| `completed` | Done |
| `reviewed` | Review completed |

## Design System Usage

### Color System

Located in `design/system/colors.md`. Use these color codes in component implementations:

```typescript
// Primary colors
const colors = {
  primary: '#3B82F6',      // Primary Blue
  secondary: '#6B7280',    // Secondary Gray
  success: '#10B981',      // Success Green
  error: '#EF4444',        // Error Red
  warning: '#F59E0B',      // Warning Amber
};
```

### Spacing System

Located in `design/system/spacing.md`. Use the spacing scale:

```typescript
const spacing = {
  1: '4px',    // space-1
  2: '8px',    // space-2
  3: '12px',   // space-3
  4: '16px',   // space-4
  6: '24px',   // space-6
};
```

### Typography System

Located in `design/system/typography.md`. Use the type scale:

```typescript
// H1: 48px, weight 700
// H2: 36px, weight 700
// Body: 14px, weight 400
// Small: 12px, weight 400
```

## Troubleshooting

### Hook Not Triggering

**Problem:** Changes to `design/components/*.md` don't trigger Claude Code notification.

**Solution:**
1. Restart Claude Code application
2. Check `.claude/settings.json` has hooks configured
3. Run: `./scripts/sync-collab.sh` to verify setup

### Invalid Design File

**Problem:** Script fails with "Invalid design file format"

**Solution:**
1. Run: `./scripts/validate-design.sh design/components/YourComponent.md`
2. Fix any missing sections
3. Ensure file starts with `# ComponentName` heading

### COLLAB.json Out of Sync

**Problem:** Status doesn't match actual files

**Solution:**
1. Run: `./scripts/sync-collab.sh`
2. Manually fix COLLAB.json if needed using `jq`

### Generated Code Has Issues

**Problem:** Template component doesn't match design spec

**Solution:**
1. Check review report: `src/components/ComponentName.review.md`
2. Manually edit component code
3. Update COLLAB.json manually if needed: `./scripts/sync-collab.sh`

## Best Practices

### Design Specifications

1. **Be Detailed:** Include all visual states, colors, spacing
2. **Include Accessibility:** ARIA labels, focus states, keyboard support
3. **Document Props:** List expected component props
4. **Add Examples:** Show usage patterns in implementation notes

### Code Implementation

1. **Follow Design:** Match colors, spacing, and typography exactly
2. **TypeScript First:** Use full type annotations
3. **Test Accessibility:** Ensure keyboard navigation works
4. **Comment Complex Logic:** Explain non-obvious implementations

### Commits

```bash
# Always include the design file reference
git commit -m "feat: implement Button component from design/components/Button.md"

# Related files
git add design/components/Button.md
git add src/components/Button.tsx
git add src/components/Button.review.md
```

## Success Metrics

Track these metrics to measure collaboration effectiveness:

- ✅ **Design → Code time:** < 5 minutes
- ✅ **Code review pass rate:** > 95%
- ✅ **Spec adherence:** 100%
- ✅ **Manual sync needed:** < 1 per week

## Need Help?

1. Check this guide first
2. Review script errors: Scripts output detailed error messages
3. Check COLLAB.json: `jq . design/COLLAB.json`
4. Validate setup: `./scripts/sync-collab.sh`

---

**Version:** 1.0
**Last Updated:** 2026-04-05
```

- [ ] **Step 2: Write file to disk**

Write the guide to `docs/collab/COLLAB_SETUP.md`

- [ ] **Step 3: Create a sample workflow document**

```bash
cat > docs/collab/WORKFLOW_EXAMPLE.md << 'EOF'
# Workflow Example: Building a Button Component

This example shows the complete workflow from design to code.

## Step 1: Generate Design with Gemini

```bash
gemini-cli design --component Button --output design/components/Button.md
```

Output: `design/components/Button.md` created with design specifications

## Step 2: Check Collaboration State

```bash
./scripts/sync-collab.sh
cat design/COLLAB.json
```

Output: COLLAB.json shows Button with `code_status: pending`

## Step 3: Generate Code

```bash
./scripts/design-to-code.sh design/components/Button.md
```

This:
- Creates `src/components/Button.tsx`
- Creates `src/components/Button.review.md`
- Updates COLLAB.json to `code_status: reviewed`

## Step 4: Review Generated Code

```bash
cat src/components/Button.review.md
```

Output: Review checklist showing what to verify

## Step 5: Implement Component Details

Edit `src/components/Button.tsx` and add:
- Proper prop interfaces
- Variant implementations (primary, secondary, danger)
- State handlers (hover, active, disabled)
- Accessibility attributes (aria-labels, focus management)
- Keyboard navigation

## Step 6: Commit

```bash
git add design/components/Button.md
git add src/components/Button.tsx
git add src/components/Button.review.md
git commit -m "feat: implement Button component from design spec"
```

## Result

- ✅ Design specification: `design/components/Button.md`
- ✅ Component code: `src/components/Button.tsx`
- ✅ Code review: `src/components/Button.review.md`
- ✅ State tracked: `design/COLLAB.json` updated
- ✅ Committed: Ready for use

Total time: ~10-15 minutes (design to fully implemented)
EOF
```

- [ ] **Step 4: Verify documentation files**

```bash
ls -la docs/collab/ && wc -l docs/collab/*.md
```

Expected: Both markdown files created with content

- [ ] **Step 5: Commit**

```bash
git add docs/collab/
git commit -m "docs: add collaboration setup and workflow documentation"
```

---

## Task 14: Create SYNC_LOG and Final Verification

**Files:**
- Create: `docs/collab/SYNC_LOG.md`

- [ ] **Step 1: Create SYNC_LOG.md**

```bash
cat > docs/collab/SYNC_LOG.md << 'EOF'
# Collaboration Synchronization Log

This log tracks design-to-code synchronization events.

## Log Format

Each entry documents:
- **Date/Time:** When the sync occurred
- **Design:** Which design was processed
- **Action:** What happened (design created, code generated, review completed)
- **Status:** Result (success, warning, error)

## Recent Syncs

### 2026-04-05T00:00:00Z - System Initialization

- **Event:** Collaboration system initialized
- **Components:** 2 (Button, Card)
- **System specs:** 4 (colors, typography, spacing, shadows)
- **Status:** ✅ Complete

### 2026-04-05T00:05:00Z - Design-to-Code: Button

- **Design:** `design/components/Button.md`
- **Code:** `src/components/Button.tsx`
- **Review:** `src/components/Button.review.md`
- **Status:** ✅ Success
- **Time:** ~1 minute

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Success |
| ⚠️ | Warning |
| ❌ | Error |
| 🔄 | In Progress |
| ⏳ | Pending |

## To Add New Entry

Run this command to log an event:

```bash
cat >> docs/collab/SYNC_LOG.md << 'EOF'

### $(date -u +%Y-%m-%dT%H:%M:%SZ) - [Event Description]

- **Design:** [file path]
- **Action:** [what happened]
- **Status:** [✅/⚠️/❌]
- **Notes:** [optional details]
EOF
```

## Statistics

- Total syncs: 1
- Success rate: 100%
- Average conversion time: 1 minute
- Last update: 2026-04-05T00:05:00Z
EOF
```

- [ ] **Step 2: Write file to disk**

Write the above to `docs/collab/SYNC_LOG.md`

- [ ] **Step 3: Final verification - test the entire system**

```bash
echo "=== Verifying Collaboration System Setup ===" && \
echo "" && \
echo "1. Directory structure:" && \
find design scripts docs/collab -type f | sort && \
echo "" && \
echo "2. COLLAB.json validity:" && \
jq '.designs | length' design/COLLAB.json && echo "   ✅ COLLAB.json valid" && \
echo "" && \
echo "3. Scripts executable:" && \
ls -la scripts/*.sh && \
echo "" && \
echo "4. Documentation:" && \
ls -la docs/collab/ && \
echo "" && \
echo "=== Verification Complete ==="
```

Expected: All files present, scripts executable, valid JSON

- [ ] **Step 4: Final commit**

```bash
git add docs/collab/SYNC_LOG.md
git commit -m "docs: create collaboration sync log"
```

- [ ] **Step 5: Create summary of all changes**

```bash
echo "=== Implementation Summary ===" && \
echo "" && \
echo "Directories created:" && \
echo "  - design/ (with components/, system/ subdirectories)" && \
echo "  - scripts/" && \
echo "  - docs/collab/" && \
echo "" && \
echo "Files created:" && \
echo "  - 4 design system specs (colors, typography, spacing, shadows)" && \
echo "  - 2 example component designs (Button, Card)" && \
echo "  - 5 automation scripts (design-to-code, auto-review, sync-collab, validate-design, validate-system)" && \
echo "  - 3 documentation files (COLLAB_SETUP, WORKFLOW_EXAMPLE, SYNC_LOG)" && \
echo "  - 1 generated component (Button.tsx)" && \
echo "  - 1 collaboration state file (COLLAB.json)" && \
echo "" && \
echo "Total commits: $(git rev-list --count HEAD)" && \
echo "" && \
echo "System Status: ✅ READY FOR USE"
```

- [ ] **Step 6: Final status check**

```bash
git log --oneline -15
```

Expected: All implementation commits visible

---

## Summary

✅ **Implementation Complete!**

**What was set up:**

1. **Directory Structure** - Organized `design/`, `scripts/`, `docs/collab/`
2. **Design System** - 4 complete specifications (colors, typography, spacing, shadows)
3. **Example Designs** - Button and Card components with detailed specs
4. **Automation Scripts** - Complete workflow automation with error handling
5. **Collaboration Tracking** - COLLAB.json state management
6. **Documentation** - Setup guide, workflow examples, sync log
7. **Claude Code Hooks** - Configured for design change notifications

**Next Steps:**

1. Use Gemini-cli to generate new component designs in `design/components/`
2. Run `./scripts/design-to-code.sh` to convert designs to code
3. Edit generated components and implement full functionality
4. Commit changes with design + code together
5. Monitor `design/COLLAB.json` for collaboration status

**Success Metrics:**
- Design → Code turnaround: < 5 minutes
- Code review pass rate: > 95%
- Manual intervention: < 1 per week

---
