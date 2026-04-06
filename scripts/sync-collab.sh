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
  if ! jq -e ".${field}" design/COLLAB.json > /dev/null 2>&1; then
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
