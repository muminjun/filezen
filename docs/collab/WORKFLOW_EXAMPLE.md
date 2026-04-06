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
