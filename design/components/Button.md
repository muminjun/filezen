# Button Component Design Specification

## Overview
The Button component is a fundamental interactive element that triggers actions within the FileZen application. It supports multiple variants, sizes, and states to accommodate various use cases across the platform.

---

## Visual Design

### Dimensions
- **Height:** 40px (standard)
- **Padding:** 16px horizontal, 8px vertical
- **Border Radius:** 6px
- **Icon Size:** 16px
- **Icon Spacing:** 8px (from text)
- **Minimum Width:** 100px (excluding icon variants)

### Color Variants

#### Primary Button
- **Background Color:** `#3B82F6` (Primary Blue)
- **Text Color:** `#FFFFFF` (White)
- **Border:** None
- **Usage:** Main actions, primary calls-to-action
- **Hex Code:** Primary Blue (#3B82F6)
- **RGB:** rgb(59, 130, 246)

#### Secondary Button
- **Background Color:** `#6B7280` (Secondary Gray)
- **Text Color:** `#FFFFFF` (White)
- **Border:** None
- **Usage:** Secondary actions, alternative options
- **Hex Code:** Secondary Gray (#6B7280)
- **RGB:** rgb(107, 114, 128)

#### Danger Button
- **Background Color:** `#EF4444` (Error Red)
- **Text Color:** `#FFFFFF` (White)
- **Border:** None
- **Usage:** Destructive actions, deletions, warnings
- **Hex Code:** Error (#EF4444)
- **RGB:** rgb(239, 68, 68)

#### Outlined Button
- **Background Color:** Transparent
- **Text Color:** `#3B82F6` (Primary Blue)
- **Border:** 2px solid `#3B82F6`
- **Usage:** Tertiary actions, cancellations
- **Hex Code:** Primary Blue (#3B82F6)
- **RGB:** rgb(59, 130, 246)

### Typography
- **Font Family:** System font stack (inherits from design system)
- **Font Size:** 14px (standard button)
- **Font Weight:** 600 (semibold)
- **Line Height:** 20px
- **Text Alignment:** Center

---

## States & Interactions

### Default State
- **Background:** Solid color based on variant
- **Opacity:** 100%
- **Cursor:** Pointer
- **Box Shadow:** None
- **Transition:** All properties 150ms ease-in-out

### Hover State
- **Background:** 10% darker shade of variant color
- **Opacity:** 95%
- **Cursor:** Pointer
- **Transform:** Scale 1.02
- **Box Shadow:** Shadow-2 (from design system)
- **Transition Time:** 150ms ease-in-out

### Active State
- **Background:** 15% darker shade of variant color
- **Opacity:** 100%
- **Cursor:** Pointer
- **Transform:** Scale 0.98
- **Box Shadow:** Shadow-1 (inset)
- **Transition Time:** Instant (0ms)

### Disabled State
- **Background:** `#D1D5DB` (Light Gray)
- **Text Color:** `#9CA3AF` (Disabled Gray)
- **Cursor:** Not-allowed
- **Opacity:** 60%
- **Box Shadow:** None
- **Behavior:** Non-interactive, no hover effects
- **Transition:** None

### Focus State
- **Outline:** 2px solid `#3B82F6` (Primary Blue)
- **Outline Offset:** 2px
- **Focus Ring:** Always visible for accessibility
- **Transition:** Instant
- **Behavior:** Applied via :focus-visible

### Loading State
- **Background:** Slightly dimmed (opacity 80%)
- **Text:** Hidden or replaced with loading indicator
- **Cursor:** Wait
- **Interactive:** Disabled (pointer-events: none)
- **Spinner:** 16px circular spinner animation
- **Animation Duration:** 1s linear infinite rotation
- **Behavior:** Disabled state while loading is active

---

## Accessibility

### ARIA Labels
- `aria-label`: Recommended for icon-only buttons
  - Example: `aria-label="Submit form"`
- `aria-pressed`: For toggle buttons
  - Example: `aria-pressed="false"`
- `aria-busy`: For loading state
  - Example: `aria-busy="true"`
- `aria-disabled`: For disabled buttons
  - Example: `aria-disabled="true"`

### Keyboard Navigation
- **Tab:** Move focus to next button
- **Shift+Tab:** Move focus to previous button
- **Enter:** Activate button (triggers click handler)
- **Space:** Activate button (alternative to Enter)
- **Escape:** (Context-dependent) May cancel actions in modal dialogs

### Focus Management
- Focus outline visible at all times (2px solid #3B82F6)
- Focus ring offset by 2px for visibility
- High contrast ratio maintained (WCAG AA: 4.5:1)
- Focus state applies via :focus-visible (not :focus)
- Focus trap management in modal contexts

### Color Contrast
- Primary Blue (#3B82F6) on White: 4.48:1 (WCAG AAA)
- Error Red (#EF4444) on White: 3.98:1 (WCAG AA)
- Secondary Gray (#6B7280) on White: 4.54:1 (WCAG AAA)
- All text-background combinations meet WCAG AA standard

### Semantic HTML
```html
<button type="button" class="button button--primary">
  Click me
</button>
```
- Use native `<button>` element
- Proper `type` attribute (button, submit, reset)
- Never use `<div>` or `<a>` as button substitute
- Support for form submission via `type="submit"`

---

## Icon Support

### Icon Sizing
- **Icon Size:** 16px × 16px
- **Icon Spacing:** 8px from text
- **Icon Position:** Before or after text

### Icon-Only Buttons
- **Width & Height:** 40px (square)
- **Padding:** 12px
- **Icon Centered:** Both horizontally and vertically
- **Accessibility:** Required `aria-label` attribute
- **Example:** Close button, back button, menu toggle

### Icon Positioning
- **Left Icon:** Used for most cases
- **Right Icon:** For navigation forward, external links
- **Icon Alignment:** Vertical center with text

---

## Responsive Behavior

### Mobile (< 640px)
- **Height:** 44px (increased for touch targets)
- **Padding:** 16px horizontal, 12px vertical
- **Font Size:** 14px
- **Minimum Touch Target:** 44×44px (WCAG 2.5.5 level AAA)
- **Spacing Between Buttons:** 12px minimum
- **Full Width:** Buttons may be full-width on mobile for better usability

### Tablet (640px - 1024px)
- **Height:** 40px (standard)
- **Padding:** 16px horizontal, 8px vertical
- **Font Size:** 14px
- **Minimum Touch Target:** 40×40px
- **Spacing Between Buttons:** 12px

### Desktop (> 1024px)
- **Height:** 40px (standard)
- **Padding:** 16px horizontal, 8px vertical
- **Font Size:** 14px
- **Touch Target:** 40px (mouse-based interaction)
- **Spacing Between Buttons:** 8px minimum

### Size Variants
- **Small:** 32px height, 12px padding, 12px font
- **Medium (default):** 40px height, 16px padding, 14px font
- **Large:** 48px height, 20px padding, 16px font

---

## Implementation Notes

### Dependencies
- **React:** 19.0.0 or higher
- **TypeScript:** 5.0.0 or higher
- **Tailwind CSS:** 4.0.0 or higher (for styling)
- **CSS-in-JS:** Optional (can use Tailwind classes)

### Props Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Variant type
  variant?: 'primary' | 'secondary' | 'danger' | 'outlined';

  // Size variant
  size?: 'small' | 'medium' | 'large';

  // Loading state
  isLoading?: boolean;
  loadingText?: string;

  // Icon support
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';

  // Disabled state
  disabled?: boolean;

  // Full width
  fullWidth?: boolean;

  // Custom class names
  className?: string;

  // ARIA attributes
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaDescribedBy?: string;

  // Event handlers
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;

  // Children
  children: React.ReactNode;
}
```

### Component Structure

```typescript
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className,
  children,
  ...props
}) => {
  // Implementation logic
  return (
    <button
      className={`button button--${variant} button--${size}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};
```

### Styling Approach
- **Tailwind Classes:** Preferred for flexibility and maintainability
- **CSS Modules:** Alternative for scoped styling
- **Inline Styles:** Avoid except for dynamic values
- **BEM Naming:** Use `.button--variant` for modifier classes

### Performance Considerations
- **Memoization:** Use `React.memo()` if re-renders are frequent
- **Event Handler Optimization:** Use useCallback for handlers passed as props
- **CSS Transitions:** Hardware-accelerated (transform, opacity)
- **Avoid Full Reflows:** Use transform for scale animations instead of width/height
- **Bundle Size:** Keep component lightweight (< 5KB minified)

### Loading State Implementation
```typescript
{isLoading && (
  <span className="button__spinner">
    <svg className="button__spinner-icon" viewBox="0 0 24 24">
      {/* Spinner SVG */}
    </svg>
  </span>
)}
```

### Transition Timing
- **Default Transition:** 150ms ease-in-out
- **Hover to Active:** Instant visual feedback
- **Disabled State:** No transition
- **Focus Outline:** Instant appearance

---

## Testing Checklist

### Visual Testing
- [ ] Primary variant renders correctly
- [ ] Secondary variant renders correctly
- [ ] Danger variant renders correctly
- [ ] Outlined variant renders correctly
- [ ] All color values match hex codes exactly
- [ ] Border radius matches 6px specification
- [ ] Padding values are correct (16px × 8px)
- [ ] Icon sizing is 16px × 16px
- [ ] Icon spacing is 8px from text

### State Testing
- [ ] Hover state darkens color appropriately
- [ ] Hover state applies scale 1.02 transform
- [ ] Active state applies scale 0.98 transform
- [ ] Disabled state shows correct styling
- [ ] Disabled state is not interactive
- [ ] Focus outline appears on keyboard navigation
- [ ] Focus outline has 2px width and proper offset
- [ ] Loading state shows spinner animation
- [ ] Loading state prevents interaction

### Accessibility Testing
- [ ] ARIA labels present on icon-only buttons
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus outline visible at all times
- [ ] Color contrast meets WCAG AA standard
- [ ] Screen reader announces button text
- [ ] Disabled state properly announced
- [ ] Loading state announced via aria-busy
- [ ] Form submission works with type="submit"

### Responsive Testing
- [ ] Mobile: 44px height on touch devices
- [ ] Tablet: 40px height on tablet devices
- [ ] Desktop: 40px height on desktop
- [ ] Full-width button works on mobile
- [ ] Spacing adjusts per breakpoint
- [ ] Touch targets are minimum 44×44px on mobile
- [ ] Text remains readable on all screen sizes
- [ ] Icon spacing adjusts appropriately

### Icon Testing
- [ ] Icon-only button has aria-label
- [ ] Icon size is exactly 16px
- [ ] Icon spacing from text is 8px
- [ ] Icon position (left/right) renders correctly
- [ ] Icon and text are vertically aligned
- [ ] Icon color matches text color

### Interaction Testing
- [ ] onClick handler fires on button click
- [ ] onClick handler fires on Enter key press
- [ ] onClick handler fires on Space bar press
- [ ] Multiple clicks don't fire multiple times (debouncing)
- [ ] onFocus handler fires on keyboard focus
- [ ] onBlur handler fires on focus loss
- [ ] Button prevents default form submission when needed

### Performance Testing
- [ ] Component renders without unnecessary re-renders
- [ ] Transitions are smooth (60fps)
- [ ] No memory leaks from event listeners
- [ ] Loading spinner animation is smooth
- [ ] Bundle size is under 5KB minified

### Cross-Browser Testing
- [ ] Chrome/Edge: All states work correctly
- [ ] Firefox: All states work correctly
- [ ] Safari: All states work correctly
- [ ] iOS Safari: Touch interactions work
- [ ] Android Chrome: Touch interactions work
- [ ] Transitions work consistently across browsers
- [ ] Focus outline visible in all browsers

### Integration Testing
- [ ] Works within form elements
- [ ] Works with TypeScript strict mode
- [ ] Props validation works correctly
- [ ] Type definitions are complete and accurate
- [ ] Can be imported and used in other components
- [ ] Works with conditional rendering
- [ ] Works with event delegation

---

## Usage Examples

### Primary Button
```tsx
<Button variant="primary" onClick={handleSubmit}>
  Submit Form
</Button>
```

### Button with Icon
```tsx
<Button icon={<CheckIcon />} iconPosition="left">
  Confirm Action
</Button>
```

### Loading State
```tsx
<Button isLoading={isSaving} disabled={isSaving}>
  {isSaving ? 'Saving...' : 'Save'}
</Button>
```

### Icon-Only Button
```tsx
<Button
  variant="outlined"
  size="small"
  aria-label="Close dialog"
  onClick={handleClose}
>
  <XIcon />
</Button>
```

### Full Width Button
```tsx
<Button fullWidth variant="primary">
  Continue
</Button>
```

---

## Design System Integration

### Color System Reference
- Primary Blue: #3B82F6 (from design/system/colors.md)
- Secondary Gray: #6B7280 (from design/system/colors.md)
- Error Red: #EF4444 (from design/system/colors.md)
- Light Gray: #D1D5DB (from design/system/colors.md)
- Disabled Gray: #9CA3AF (from design/system/colors.md)

### Typography System Reference
- Font Size: 14px (from design/system/typography.md)
- Font Weight: 600 semibold (from design/system/typography.md)
- Line Height: 20px (from design/system/typography.md)

### Spacing System Reference
- Standard Padding: 16px horizontal (from design/system/spacing.md)
- Vertical Padding: 8px (from design/system/spacing.md)
- Gap between elements: 8px (from design/system/spacing.md)

### Shadow System Reference
- Shadow-1: For active/inset states (from design/system/shadows.md)
- Shadow-2: For hover states (from design/system/shadows.md)

---

## Related Components
- **Icon Component:** Used within Button for icon support
- **Spinner Component:** Used for loading state indicator
- **Form Component:** Buttons used as form submit triggers
- **Modal Component:** Buttons used for modal actions (confirm/cancel)

---

## Version History
- **v1.0.0** (2026-04-05): Initial design specification

---

## Last Updated
**Date:** 2026-04-05
**Author:** Design Team
**Status:** Completed
