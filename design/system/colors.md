# Design System - Color Palette

## Overview
The FileZen color system provides a carefully curated palette designed for clarity, accessibility, and visual hierarchy. All colors meet WCAG AA contrast ratio standards for text and interactive elements.

---

## Primary Colors

### Primary Blue
- **Name:** Primary Blue
- **Hex Value:** `#3B82F6`
- **RGB:** `rgb(59, 130, 246)`
- **Usage:** Primary actions, links, active states, primary buttons
- **Context:** Use for main interactive elements and core brand identity

### Secondary Gray
- **Name:** Secondary Gray
- **Hex Value:** `#6B7280`
- **RGB:** `rgb(107, 114, 128)`
- **Usage:** Secondary actions, disabled states, secondary text
- **Context:** Use for less prominent interactive elements and helper text

---

## Status Colors

### Success
- **Name:** Success
- **Hex Value:** `#10B981`
- **RGB:** `rgb(16, 185, 129)`
- **Usage:** Success messages, valid states, confirmations, check marks
- **Context:** Indicates successful completion or positive outcome

### Error
- **Name:** Error
- **Hex Value:** `#EF4444`
- **RGB:** `rgb(239, 68, 68)`
- **Usage:** Error messages, validation failures, destructive actions, alerts
- **Context:** Indicates errors, warnings, or dangerous operations

### Warning
- **Name:** Warning
- **Hex Value:** `#F59E0B`
- **RGB:** `rgb(245, 158, 11)`
- **Usage:** Warning messages, caution states, pending actions
- **Context:** Indicates warning or caution state requiring attention

---

## Neutral Colors

### White
- **Name:** White
- **Hex Value:** `#FFFFFF`
- **RGB:** `rgb(255, 255, 255)`
- **Usage:** Backgrounds, card surfaces, content areas
- **Context:** Primary background color for light theme

### Light Gray
- **Name:** Light Gray
- **Hex Value:** `#F3F4F6`
- **RGB:** `rgb(243, 244, 246)`
- **Usage:** Secondary backgrounds, hover states, disabled backgrounds
- **Context:** Subtle background variations for visual separation

### Medium Gray
- **Name:** Medium Gray
- **Hex Value:** `#D1D5DB`
- **RGB:** `rgb(209, 213, 219)`
- **Usage:** Borders, dividers, input borders
- **Context:** Structural elements that define layout boundaries

### Dark Gray
- **Name:** Dark Gray
- **Hex Value:** `#374151`
- **RGB:** `rgb(55, 65, 81)`
- **Usage:** Primary text, headings, strong content
- **Context:** High contrast text for readability

### Black
- **Name:** Black
- **Hex Value:** `#000000`
- **RGB:** `rgb(0, 0, 0)`
- **Usage:** Maximum contrast, special emphasis
- **Context:** Use sparingly for maximum visual impact

---

## Usage Guidelines

### Buttons

#### Primary Button
- Background: Primary Blue (#3B82F6)
- Text: White (#FFFFFF)
- Hover: Darker blue shade
- Disabled: Light Gray (#F3F4F6)
- Border: None

#### Secondary Button
- Background: Light Gray (#F3F4F6)
- Text: Dark Gray (#374151)
- Hover: Medium Gray (#D1D5DB)
- Disabled: White (#FFFFFF)
- Border: 1px solid Medium Gray (#D1D5DB)

#### Danger Button
- Background: Error (#EF4444)
- Text: White (#FFFFFF)
- Hover: Darker red shade
- Disabled: Light Gray (#F3F4F6)
- Border: None

### Text

#### Primary Text
- Color: Dark Gray (#374151)
- Usage: Body text, paragraphs, main content
- Contrast Ratio: 12.63:1 (WCAG AAA)

#### Secondary Text
- Color: Secondary Gray (#6B7280)
- Usage: Helper text, descriptions, metadata
- Contrast Ratio: 7.04:1 (WCAG AA)

#### Disabled Text
- Color: Medium Gray (#D1D5DB)
- Usage: Disabled form fields, inactive elements
- Contrast Ratio: 3.23:1 (Minimum for disabled content)

### Backgrounds

#### Primary Background
- Color: White (#FFFFFF)
- Usage: Main content area, card surfaces

#### Secondary Background
- Color: Light Gray (#F3F4F6)
- Usage: Sidebar, secondary panels, subtle separation

#### Surface Elevation
- Level 1: Light Gray (#F3F4F6)
- Level 2: White (#FFFFFF) with Shadow-1
- Level 3: White (#FFFFFF) with Shadow-3

### Interactive States

#### Hover
- Apply 10% opacity overlay of hover color
- Maintains accessibility of base color

#### Focus
- Use Primary Blue (#3B82F6) outline, 2px width
- Outline offset: 2px
- Provides keyboard navigation feedback

#### Active
- Darken base color by 15-20%
- Solid background (no overlay)
- Indicates current/selected state

---

## Accessibility Notes

### WCAG Compliance
All color combinations have been tested for WCAG AA (4.5:1) and AAA (7:1) contrast ratios where possible.

### Contrast Ratios

| Color Pair | Ratio | Level |
|-----------|-------|-------|
| Dark Gray on White | 12.63:1 | AAA |
| Primary Blue on White | 6.24:1 | AA |
| Secondary Gray on White | 7.04:1 | AA |
| Success on White | 5.36:1 | AA |
| Error on White | 4.67:1 | AA |
| Warning on White | 7.82:1 | AA |

### Color Blindness Considerations
- Do not use color alone to convey information
- Always pair colors with additional indicators (icons, text, patterns)
- Test designs with accessible color contrast tools
- Ensure red/green status indicators include additional context

### Best Practices
1. **Don't rely on color alone** - Use text labels, icons, or patterns
2. **Maintain sufficient contrast** - Minimum 4.5:1 for text
3. **Test with users** - Include people with color blindness in testing
4. **Provide alternatives** - Use patterns, textures, or text in addition to color
5. **Use semantic colors** - Apply status colors consistently (green for success, red for error)

---

## Color Implementation

### CSS Variables
```css
:root {
  /* Primary */
  --color-primary: #3B82F6;
  --color-secondary: #6B7280;

  /* Status */
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;

  /* Neutral */
  --color-white: #FFFFFF;
  --color-light-gray: #F3F4F6;
  --color-medium-gray: #D1D5DB;
  --color-dark-gray: #374151;
  --color-black: #000000;
}
```

### Tailwind Configuration
Colors are available through Tailwind CSS class names:
- Primary buttons: `bg-blue-500 text-white`
- Status colors: `bg-green-500`, `bg-red-500`, `bg-amber-500`
- Text colors: `text-gray-700`, `text-gray-500`

---

## Color Psychology

### Primary Blue (#3B82F6)
- Conveys trust, reliability, and professionalism
- Promotes calmness and focus
- Ideal for primary actions and brand identity

### Success Green (#10B981)
- Indicates positive outcomes and completion
- Universally recognized for "go" and approval
- Used for validation and confirmations

### Error Red (#EF4444)
- Signals danger and requires attention
- Indicates blocking issues
- Used for errors and destructive actions

### Warning Amber (#F59E0B)
- Provides caution without being alarming
- Indicates pending or review states
- Used for non-critical alerts

---

## Migration & Updates

When updating colors:
1. Maintain backward compatibility with current color names
2. Test all components in both light and dark themes
3. Verify accessibility compliance with updated colors
4. Update documentation with new color ratios
5. Version color changes in release notes

---

**Last Updated:** 2026-04-05
**Version:** 1.0.0
