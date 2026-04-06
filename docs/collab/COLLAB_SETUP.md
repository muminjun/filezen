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
**Last Updated:** 2026-04-06
