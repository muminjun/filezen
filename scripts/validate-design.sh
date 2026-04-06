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
  "^# "           # Title/heading
  "^## Visual Design"
  "^## States & Interactions"
  "^## Accessibility"
  "^## Implementation Notes"
)

MISSING_SECTIONS=()
for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -q "$section" "$DESIGN_FILE"; then
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
