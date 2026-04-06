#!/bin/bash

CODE_FILE=$1
DESIGN_FILE=$2

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

REVIEW_FILE="${CODE_FILE%.tsx}.review.md"
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
chmod +x "$0" # Ensuring script itself is executable is redundant but follow plan if asked. Wait, I should make the file executable.
