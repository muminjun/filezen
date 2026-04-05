# Design System - Shadows

## Overview
The FileZen shadow system creates visual hierarchy through elevation and depth. Shadows establish clear relationships between components and guide user attention across the interface.

---

## Shadow Elevations

### Shadow System Hierarchy
The shadow system uses 5 elevation levels, each creating a distinct visual depth. Higher numbers indicate greater elevation and more prominent shadows.

---

## Shadow Levels & Specifications

### Shadow-1 (Subtle)
**Use Case:** Slight depth for contained interactive elements

**CSS Box-Shadow:**
```css
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
```

**Values:**
- Offset X: 0px
- Offset Y: 1px
- Blur Radius: 2px
- Spread Radius: 0px
- Color: rgba(0, 0, 0, 0.05)

**Visual Effect:** Barely perceptible, used for very subtle elevation

**Components:**
- Input fields (focus state)
- Buttons (subtle hover state)
- Small tooltips
- Card separators

**Example:**
```css
.button:hover {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

---

### Shadow-2 (Light)
**Use Case:** Light elevation for normal interactive elements

**CSS Box-Shadow:**
```css
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

**Values:**
- Offset X: 0px
- Offset Y: 2px
- Blur Radius: 4px
- Spread Radius: 0px
- Color: rgba(0, 0, 0, 0.1)

**Visual Effect:** Noticeable but not prominent, creates clear separation

**Components:**
- Standard cards
- Dropdown menus
- Hover states on interactive elements
- Content panels

**Example:**
```css
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

### Shadow-3 (Medium)
**Use Case:** Moderate elevation for prominent interactive elements

**CSS Box-Shadow:**
```css
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
```

**Values:**
- Offset X: 0px
- Offset Y: 4px
- Blur Radius: 8px
- Spread Radius: 0px
- Color: rgba(0, 0, 0, 0.12)

**Visual Effect:** Clear elevation that commands attention

**Components:**
- Dialog/modal backgrounds
- Elevated cards
- Floating action buttons
- Navigation overlays

**Example:**
```css
.modal-overlay {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

---

### Shadow-4 (Strong)
**Use Case:** Strong elevation for critical overlays and elevated UI

**CSS Box-Shadow:**
```css
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
```

**Values:**
- Offset X: 0px
- Offset Y: 8px
- Blur Radius: 16px
- Spread Radius: 0px
- Color: rgba(0, 0, 0, 0.15)

**Visual Effect:** Prominent elevation, creates significant visual separation

**Components:**
- Modals and dialogs
- Popups
- Elevated navigation
- Drag-and-drop floating elements
- Context menus

**Example:**
```css
.modal {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

---

### Shadow-5 (Maximum)
**Use Case:** Maximum elevation for top-level overlays and critical UI

**CSS Box-Shadow:**
```css
box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
```

**Values:**
- Offset X: 0px
- Offset Y: 16px
- Blur Radius: 32px
- Spread Radius: 0px
- Color: rgba(0, 0, 0, 0.2)

**Visual Effect:** Maximum depth, draws maximum attention

**Components:**
- Top-level modals
- Notifications (toast/snackbar)
- Important alerts
- Fullscreen overlays

**Example:**
```css
.notification {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}
```

---

## Shadow Comparison Table

| Level | CSS Box-Shadow | Offset Y | Blur | Use Case | Example |
|-------|----------------|----------|------|----------|---------|
| 1 | `0 1px 2px rgba(0,0,0,0.05)` | 1px | 2px | Subtle | Input focus |
| 2 | `0 2px 4px rgba(0,0,0,0.1)` | 2px | 4px | Light | Cards |
| 3 | `0 4px 8px rgba(0,0,0,0.12)` | 4px | 8px | Medium | Dialogs |
| 4 | `0 8px 16px rgba(0,0,0,0.15)` | 8px | 16px | Strong | Modals |
| 5 | `0 16px 32px rgba(0,0,0,0.2)` | 16px | 32px | Maximum | Notifications |

---

## Component Shadow Mapping

### Buttons
```css
/* Default button - no shadow */
.button {
  box-shadow: none;
}

/* Button hover - subtle shadow */
.button:hover {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Button active/pressed */
.button:active {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Cards
```css
/* Standard card - light shadow */
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Elevated card - medium shadow */
.card.elevated {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* Card hover */
.card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

### Modals and Dialogs
```css
/* Modal container - strong shadow */
.modal {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

/* Dialog - strong to maximum shadow */
.dialog {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

/* Full-screen overlay - maximum shadow */
.overlay-fullscreen {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}
```

### Dropdowns and Menus
```css
/* Dropdown menu - light shadow */
.dropdown-menu {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Context menu - medium shadow */
.context-menu {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* Nested menu - stronger shadow */
.submenu {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

### Navigation
```css
/* Top navigation - light shadow */
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Sticky header - medium shadow */
.sticky-header {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* Navigation drawer - medium shadow */
.nav-drawer {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

### Floating Elements
```css
/* Floating action button - light shadow */
.fab {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* FAB hover - medium shadow */
.fab:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* FAB active - stronger shadow */
.fab:active {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

### Notifications
```css
/* Toast notification - maximum shadow */
.toast {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}

/* Snackbar - strong shadow */
.snackbar {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

/* Alert - medium shadow */
.alert {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

---

## CSS Variables & Implementation

### CSS Custom Properties
```css
:root {
  /* Shadow elevations */
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-2: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-3: 0 4px 8px rgba(0, 0, 0, 0.12);
  --shadow-4: 0 8px 16px rgba(0, 0, 0, 0.15);
  --shadow-5: 0 16px 32px rgba(0, 0, 0, 0.2);
}
```

### Using CSS Variables
```css
.card {
  box-shadow: var(--shadow-2);
}

.modal {
  box-shadow: var(--shadow-4);
}
```

---

## Tailwind Implementation

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    boxShadow: {
      none: 'none',
      shadow1: '0 1px 2px rgba(0, 0, 0, 0.05)',
      shadow2: '0 2px 4px rgba(0, 0, 0, 0.1)',
      shadow3: '0 4px 8px rgba(0, 0, 0, 0.12)',
      shadow4: '0 8px 16px rgba(0, 0, 0, 0.15)',
      shadow5: '0 16px 32px rgba(0, 0, 0, 0.2)',
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      base: '0 2px 4px rgba(0, 0, 0, 0.1)',
      md: '0 4px 8px rgba(0, 0, 0, 0.12)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
      xl: '0 16px 32px rgba(0, 0, 0, 0.2)',
    }
  }
}
```

### Tailwind Classes
```html
<!-- Standard card shadow -->
<div class="shadow-shadow2">Card content</div>

<!-- Modal shadow -->
<div class="shadow-shadow4">Modal content</div>

<!-- Notification shadow -->
<div class="shadow-shadow5">Notification</div>

<!-- No shadow -->
<div class="shadow-none">Flat element</div>
```

---

## React Component Examples

### Card Component
```jsx
const Card = ({ children, elevated = false }) => {
  return (
    <div
      style={{
        boxShadow: elevated ? 'var(--shadow-3)' : 'var(--shadow-2)',
      }}
      className="card"
    >
      {children}
    </div>
  );
};
```

### Modal Component
```jsx
const Modal = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        boxShadow: 'var(--shadow-4)',
      }}
      className="modal"
    >
      {children}
    </div>
  );
};
```

### Button Component
```jsx
const Button = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="button"
      style={{
        boxShadow: 'none',
        transition: 'box-shadow 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
};
```

### Notification Component
```jsx
const Notification = ({ message, type = 'info' }) => {
  return (
    <div
      style={{
        boxShadow: 'var(--shadow-5)',
      }}
      className={`notification notification-${type}`}
    >
      {message}
    </div>
  );
};
```

---

## Shadow Accessibility

### Visibility
- Shadows enhance visual hierarchy without requiring color
- Users with color blindness can still perceive depth
- Shadows create perceived elevation independently of color cues

### Performance
- Shadows are hardware-accelerated on modern browsers
- Excessive shadows can impact performance on low-end devices
- Consider reducing shadow count on performance-critical interfaces

---

## Dark Mode Shadows

### Dark Theme Considerations
In dark mode, shadows appear less visible due to dark background. Adjust opacity:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-2: 0 2px 4px rgba(0, 0, 0, 0.4);
    --shadow-3: 0 4px 8px rgba(0, 0, 0, 0.5);
    --shadow-4: 0 8px 16px rgba(0, 0, 0, 0.6);
    --shadow-5: 0 16px 32px rgba(0, 0, 0, 0.7);
  }
}
```

Or use lighter shadows with white:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-1: 0 1px 3px rgba(255, 255, 255, 0.1);
    --shadow-2: 0 4px 6px rgba(255, 255, 255, 0.1);
    --shadow-3: 0 10px 15px rgba(255, 255, 255, 0.1);
    --shadow-4: 0 20px 25px rgba(255, 255, 255, 0.1);
    --shadow-5: 0 25px 50px rgba(255, 255, 255, 0.1);
  }
}
```

---

## Animation with Shadows

### Elevation Transitions
```css
.card {
  box-shadow: var(--shadow-2);
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-3);
}
```

### Interactive State Changes
```css
.button {
  box-shadow: none;
  transition: all 0.15s ease-in-out;
}

.button:hover {
  box-shadow: var(--shadow-1);
}

.button:active {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

## Best Practices

### Guidelines
1. **Use shadows purposefully** - Each shadow should create clear elevation
2. **Maintain consistency** - Use defined shadow levels, avoid custom shadows
3. **Test visibility** - Ensure shadows are visible on all backgrounds
4. **Consider performance** - Use shadows on critical elements only
5. **Animate smoothly** - Use transitions when shadows change

### Anti-Patterns
- Multiple different shadow values across components
- Shadows too dark for the content
- Shadows that clash with background colors
- Excessive use of strong shadows

---

## Migration & Updates

When updating shadows:
1. Test on all background colors (light, gray, dark)
2. Verify visibility in high-light conditions (mobile outdoors)
3. Ensure consistency across all affected components
4. Update documentation with new shadow levels
5. Test performance impact

---

**Last Updated:** 2026-04-05
**Version:** 1.0.0
