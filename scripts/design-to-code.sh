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
