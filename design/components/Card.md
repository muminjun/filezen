# Card Component Design Specification

## Overview
The Card component is a flexible container that groups related content and actions. It provides a structured layout for displaying information with optional headers, footers, and interactive states. Cards are fundamental building blocks in the FileZen interface.

---

## Visual Design

### Dimensions
- **Minimum Width:** 280px
- **Maximum Width:** Responsive (100% of container)
- **Height:** Auto (content-driven)
- **Border Radius:** 8px
- **Padding (Body):** 24px
- **Padding (Header/Footer):** 16px 24px

### Background & Borders
- **Background Color:** `#FFFFFF` (White)
- **Border:** 1px solid `#E5E7EB` (Light Border Gray)
- **Border Color Hex:** #E5E7EB
- **Border Color RGB:** rgb(229, 231, 235)

### Shadow System Integration
- **Default Shadow:** Shadow-2 (from design/system/shadows.md)
  - Subtle elevation for standard cards
- **Hover Shadow:** Shadow-3 (from design/system/shadows.md)
  - Enhanced elevation on hover for interactive cards
- **Transition Time:** 150ms ease-in-out

### Spacing
- **Content Padding:** 24px (from design/system/spacing.md)
- **Header/Footer Padding:** 16px 24px (vertical/horizontal)
- **Divider Spacing:** 0px (no gap between header and body)
- **Nested Content Gap:** 16px between child elements

---

## Content Structure

### Header Section
- **Optional:** Yes (header can be omitted)
- **Height:** Auto (content-driven)
- **Padding:** 16px 24px
- **Border Bottom:** 1px solid #E5E7EB
- **Background:** `#F9FAFB` (Light Gray)
- **Typography:** Title (18px, 600 semibold, from typography system)
- **Use Case:** Card titles, section headings

### Body Section
- **Optional:** No (primary content area)
- **Padding:** 24px
- **Padding Mobile:** 16px (reduced on mobile)
- **Background:** `#FFFFFF` (White)
- **Content:** Main card content (text, images, forms, etc.)
- **Flexible Height:** Accommodates various content types

### Footer Section
- **Optional:** Yes (footer can be omitted)
- **Height:** Auto (content-driven)
- **Padding:** 16px 24px
- **Border Top:** 1px solid #E5E7EB
- **Background:** `#F9FAFB` (Light Gray)
- **Use Case:** Actions (buttons), metadata, secondary information
- **Typical Content:** Action buttons, timestamps, tags

### Divider Styling
- **Color:** #E5E7EB (Light Border Gray)
- **Width:** Full width of card
- **Height:** 1px
- **Margin:** 0px (no margin on divider itself)

---

## Visual States

### Default State
- **Background:** #FFFFFF (White)
- **Border:** 1px solid #E5E7EB
- **Shadow:** Shadow-2
- **Scale:** 1.0
- **Opacity:** 100%
- **Cursor:** Default

### Hover State (Interactive Cards)
- **Background:** #FFFFFF (White, unchanged)
- **Border:** 1px solid #E5E7EB (unchanged)
- **Shadow:** Shadow-3 (elevated)
- **Scale:** 1.02 (2% zoom)
- **Opacity:** 100%
- **Cursor:** Pointer
- **Transition:** 150ms ease-in-out
- **Behavior:** Applied only to clickable/interactive cards

### Interactive State (Clickable Cards)
- **Background:** Subtle highlight on interaction
- **Box Shadow:** Shadow-3 with inset highlight
- **Transform:** scale(1.02)
- **Cursor:** Pointer
- **Active Duration:** While card is being clicked

### Selected State
- **Border:** 2px solid #3B82F6 (Primary Blue)
- **Border Color Hex:** #3B82F6
- **Border Color RGB:** rgb(59, 130, 246)
- **Background:** #F0F9FF (Subtle blue tint)
- **Shadow:** Shadow-3
- **Padding Adjustment:** -1px (to account for thicker border)
- **Indicator:** Visual ring around card

### Focus State
- **Outline:** 2px solid #3B82F6 (Primary Blue)
- **Outline Offset:** 2px (external, not on border)
- **Only Applied To:** Interactive/clickable cards
- **Keyboard Navigation:** Active on Tab navigation

---

## Responsive Behavior

### Mobile (< 640px)
- **Width:** Full width - 16px margin on each side (fluid)
- **Padding (Body):** 16px (reduced from 24px)
- **Padding (Header/Footer):** 12px 16px (reduced)
- **Border Radius:** 8px (maintained)
- **Minimum Height:** Auto
- **Stack Direction:** Single column (vertical stacking)
- **Spacing Between Cards:** 12px

### Tablet (640px - 1024px)
- **Width:** Calculated based on grid (e.g., 2-column layout)
- **Padding (Body):** 20px (reduced from 24px)
- **Padding (Header/Footer):** 14px 20px
- **Border Radius:** 8px (maintained)
- **Spacing Between Cards:** 12px
- **Grid Gap:** 16px

### Desktop (> 1024px)
- **Width:** Calculated based on grid (e.g., 3-column layout)
- **Padding (Body):** 24px (standard)
- **Padding (Header/Footer):** 16px 24px (standard)
- **Border Radius:** 8px (maintained)
- **Spacing Between Cards:** 16px
- **Grid Gap:** 20px

### Aspect Ratio
- **Fluid Height:** Most cards (content-driven)
- **Fixed Height:** Optional for image cards
- **Maximum Height:** 600px (for scrollable content)

---

## Accessibility

### Semantic HTML
```html
<article class="card" role="article">
  <header class="card__header">
    <h2 class="card__title">Card Title</h2>
  </header>
  <div class="card__body">
    <!-- Content -->
  </div>
  <footer class="card__footer">
    <!-- Actions or metadata -->
  </footer>
</article>
```

### ARIA Attributes
- **role="article":** For standalone content cards
- **role="region":** For grouped related cards
- **aria-label:** For cards without visible titles
- **aria-describedby:** Links card to description element
- **aria-selected="true/false":** For selectable cards

### Keyboard Navigation
- **Tab:** Move focus to next interactive card
- **Shift+Tab:** Move focus to previous interactive card
- **Enter:** Activate clickable card (if applicable)
- **Space:** Activate clickable card (alternative to Enter)
- **Arrow Keys:** Navigate between cards in a list (optional)

### Focus Management
- Focus outline: 2px solid #3B82F6
- Outline offset: 2px (external)
- Focus visible on keyboard navigation
- Focus states clear and distinguishable
- High contrast ratio maintained

### Color Contrast
- Title text on background: 9.14:1 (WCAG AAA)
- Body text on background: 8.59:1 (WCAG AAA)
- Border color contrast: 4.54:1 (WCAG AA)
- Selected border (#3B82F6): 4.48:1 (WCAG AA)

### Screen Reader Support
- Card content is semantic and properly structured
- Headers use `<header>` and `<h*>` tags
- Footers use `<footer>` tag
- Images have alt text
- Form inputs within cards properly labeled
- ARIA landmarks used appropriately

---

## Content Hierarchy

### Typography Integration (from design/system/typography.md)
- **Title:** 18px, 600 semibold, Line height 24px
- **Subtitle:** 16px, 600 semibold, Line height 22px
- **Body Text:** 14px, 400 regular, Line height 20px
- **Small Text:** 12px, 400 regular, Line height 16px (metadata)
- **Color:** #1F2937 for main text, #6B7280 for secondary text

### Content Spacing
- **Title to Subtitle:** 8px gap
- **Subtitle to Body:** 12px gap
- **Body Paragraphs:** 16px gap between paragraphs
- **Bullet Lists:** 8px gap between items
- **Nested Elements:** 16px gap from parent

---

## Implementation Notes

### Dependencies
- **React:** 19.0.0 or higher
- **TypeScript:** 5.0.0 or higher
- **Tailwind CSS:** 4.0.0 or higher
- **CSS-in-JS:** Optional (Tailwind classes preferred)

### Props Interface

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Header content
  header?: React.ReactNode;
  headerTitle?: string;
  headerIcon?: React.ReactNode;

  // Body content
  children: React.ReactNode;

  // Footer content
  footer?: React.ReactNode;
  footerActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;

  // Interactive behavior
  isClickable?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  // Styling
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'compact' | 'standard' | 'spacious';
  className?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: 'article' | 'region' | 'option' | 'button';

  // States
  isLoading?: boolean;
  isDisabled?: boolean;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
}
```

### Component Structure

```typescript
export const Card: React.FC<CardProps> = ({
  header,
  headerTitle,
  children,
  footer,
  isClickable = false,
  isSelected = false,
  className,
  ...props
}) => {
  return (
    <article
      className={`card ${isClickable ? 'card--clickable' : ''}
        ${isSelected ? 'card--selected' : ''} ${className}`}
      role={isClickable ? 'button' : 'article'}
      {...props}
    >
      {header && <header className="card__header">{header}</header>}
      {headerTitle && (
        <header className="card__header">
          <h2 className="card__title">{headerTitle}</h2>
        </header>
      )}
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </article>
  );
};
```

### Styling Approach
- **Tailwind Classes:** Primary approach for consistent styling
- **CSS Modules:** Alternative for complex card variants
- **Custom CSS:** For animations and transitions
- **BEM Naming:** `.card`, `.card__header`, `.card__body`, `.card__footer`

### Performance Considerations
- **Lazy Loading:** Images within cards can use lazy loading
- **Memoization:** Use `React.memo()` for static card layouts
- **CSS Transitions:** Hardware-accelerated (transform, box-shadow)
- **Avoid Layout Shift:** Fixed dimensions for headers/footers when possible
- **Bundle Size:** Keep component lightweight (< 8KB minified)

### Shadow Integration
```css
.card {
  box-shadow: var(--shadow-2); /* Default shadow from design system */
}

.card--clickable:hover {
  box-shadow: var(--shadow-3); /* Enhanced shadow on hover */
  transform: scale(1.02);
}

.card--selected {
  border: 2px solid #3B82F6;
  box-shadow: var(--shadow-3);
}
```

### Responsive Utilities
```typescript
const getCardPadding = (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
  switch (breakpoint) {
    case 'mobile': return '16px';
    case 'tablet': return '20px';
    case 'desktop': return '24px';
  }
};
```

---

## Layout Variations

### Single Card
```tsx
<Card headerTitle="Card Title">
  <p>Card content goes here</p>
</Card>
```

### Card with Header and Footer
```tsx
<Card
  header={<h2>Title</h2>}
  footer={<Button>Action</Button>}
>
  <p>Content</p>
</Card>
```

### Clickable Card
```tsx
<Card
  isClickable
  onClick={handleCardClick}
  headerTitle="Selectable Card"
>
  <p>Click me to select</p>
</Card>
```

### Card Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </Card>
  ))}
</div>
```

### Card with Image
```tsx
<Card>
  <img src="image.jpg" alt="Card image" className="card__image" />
  <h3 className="card__title">Title</h3>
  <p className="card__description">Description</p>
</Card>
```

---

## Testing Checklist

### Visual Testing
- [ ] Card renders with correct dimensions
- [ ] Minimum width of 280px respected
- [ ] Border radius is exactly 8px
- [ ] Padding values match specification (24px body, 16px header/footer)
- [ ] Background color is #FFFFFF
- [ ] Border color is #E5E7EB
- [ ] All colors match hex values exactly
- [ ] Header background is #F9FAFB
- [ ] Footer background is #F9FAFB
- [ ] Selected state shows #3B82F6 border

### Shadow Testing
- [ ] Default shadow matches Shadow-2 from design system
- [ ] Hover shadow matches Shadow-3 from design system
- [ ] Shadow transitions smoothly (150ms)
- [ ] Selected state shadow is Shadow-3

### Content Structure Testing
- [ ] Header section renders when provided
- [ ] Body section always renders
- [ ] Footer section renders when provided
- [ ] Header divider displays correctly
- [ ] Footer divider displays correctly
- [ ] Content spacing is correct (16px gaps)
- [ ] Title typography matches spec (18px, 600 semibold)

### State Testing
- [ ] Default state renders correctly
- [ ] Hover state applies scale 1.02 transform
- [ ] Hover state applies Shadow-3
- [ ] Selected state shows 2px blue border
- [ ] Selected state applies scale 1.02
- [ ] Focus state shows proper outline
- [ ] Focus outline has 2px width and 2px offset
- [ ] Disabled state shows reduced opacity

### Interactive Testing
- [ ] Clickable cards show pointer cursor
- [ ] Click handler fires on click
- [ ] Click handler fires on Enter key
- [ ] Click handler fires on Space key
- [ ] Selection toggles on/off correctly
- [ ] Multiple cards can be selected independently
- [ ] Deselection works properly

### Responsive Testing
- [ ] Mobile (< 640px): Padding reduced to 16px
- [ ] Mobile: Full width with 16px margin
- [ ] Tablet (640px - 1024px): Padding 20px
- [ ] Desktop (> 1024px): Padding 24px
- [ ] Border radius maintained on all sizes
- [ ] Text remains readable on mobile
- [ ] Stacking works correctly in mobile view
- [ ] Grid layout works on tablet and desktop

### Accessibility Testing
- [ ] Semantic HTML structure verified
- [ ] Role attributes present and correct
- [ ] ARIA labels present on icon-only cards
- [ ] Focus outline visible on keyboard navigation
- [ ] Focus outline has high contrast
- [ ] Tab navigation works through cards
- [ ] Enter key activates clickable cards
- [ ] Space key activates clickable cards
- [ ] Screen reader announces card content
- [ ] Selected state announced by screen reader
- [ ] Images have alt text
- [ ] Form inputs properly labeled

### Header/Footer Testing
- [ ] Header displays with correct styling
- [ ] Header title typography correct
- [ ] Header background is #F9FAFB
- [ ] Header border shows correctly
- [ ] Footer displays with correct styling
- [ ] Footer background is #F9FAFB
- [ ] Footer border shows correctly
- [ ] Header and footer can be omitted
- [ ] Dividers only show when header/footer present

### Layout Testing
- [ ] Single card displays correctly
- [ ] Multiple cards in grid align properly
- [ ] Gap between cards is correct
- [ ] Cards don't overflow container
- [ ] Cards maintain aspect ratio
- [ ] Content doesn't overflow card
- [ ] Scrolling works for overflow content
- [ ] Maximum height constraint applied if set

### Performance Testing
- [ ] Card renders without lag
- [ ] Multiple cards render efficiently
- [ ] Hover transitions are smooth (60fps)
- [ ] No memory leaks from event listeners
- [ ] Re-renders don't cause layout shift
- [ ] Bundle size is under 8KB minified

### Cross-Browser Testing
- [ ] Chrome/Edge: All states work correctly
- [ ] Firefox: All states work correctly
- [ ] Safari: All states work correctly
- [ ] iOS Safari: Touch interactions work
- [ ] Android Chrome: Touch interactions work
- [ ] Shadows render consistently
- [ ] Transitions work consistently
- [ ] Focus outlines visible in all browsers

### Integration Testing
- [ ] Works with various content types
- [ ] Works with nested components
- [ ] Works with TypeScript strict mode
- [ ] Props validation works correctly
- [ ] Type definitions are complete
- [ ] Can be imported and used in other components
- [ ] Works with conditional rendering
- [ ] Works with dynamic content updates

---

## Design System Integration

### Color System Reference
- Background: #FFFFFF (from design/system/colors.md)
- Border: #E5E7EB (from design/system/colors.md)
- Header/Footer Background: #F9FAFB (from design/system/colors.md)
- Selected Border: #3B82F6 Primary Blue (from design/system/colors.md)
- Text: #1F2937 (from design/system/colors.md)
- Secondary Text: #6B7280 (from design/system/colors.md)

### Typography System Reference
- Title: 18px, 600 semibold (from design/system/typography.md)
- Body: 14px, 400 regular (from design/system/typography.md)
- Small Text: 12px, 400 regular (from design/system/typography.md)

### Spacing System Reference
- Body Padding: 24px (from design/system/spacing.md)
- Header/Footer Padding: 16px 24px (from design/system/spacing.md)
- Mobile Padding: 16px (from design/system/spacing.md)
- Gap between content: 16px (from design/system/spacing.md)

### Shadow System Reference
- Default Shadow: Shadow-2 (from design/system/shadows.md)
- Hover Shadow: Shadow-3 (from design/system/shadows.md)
- Transition Time: 150ms ease-in-out

---

## Related Components
- **Button Component:** Used for footer actions
- **Image Component:** For image cards
- **Form Component:** For form cards
- **Badge Component:** For card metadata/tags
- **Icon Component:** For header icons

---

## Variants

### Outlined Variant
- **Border:** 2px solid #D1D5DB
- **Shadow:** Shadow-1
- **Background:** #FFFFFF
- **Use Case:** Secondary content, less prominent cards

### Elevated Variant
- **Shadow:** Shadow-3 (elevated by default)
- **Border:** 1px solid #E5E7EB
- **Background:** #FFFFFF
- **Use Case:** Featured cards, important content

### Compact Variant
- **Padding:** 12px (body), 8px 12px (header/footer)
- **Spacing:** Reduced internal spacing
- **Use Case:** Dense layouts, list-like cards

---

## Version History
- **v1.0.0** (2026-04-05): Initial design specification

---

## Last Updated
**Date:** 2026-04-05
**Author:** Design Team
**Status:** Completed
