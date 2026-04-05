# Gemini-Claude Collaboration System Design

**Date:** 2026-04-05
**Project:** filezen (Image Conversion Tool)
**Status:** Design Phase

---

## 1. Executive Summary

This document specifies a **file-based collaboration system** that allows Gemini-cli (design generation) and Claude Code (implementation & review) to work in parallel on the same project.

**Key Design Principle:** Minimize infrastructure overhead while maximizing clarity and automation.

---

## 2. Purpose & Goals

### What We're Building
A system where:
- **Gemini-cli** generates UI/UX designs and design system specifications
- **Claude Code** reads those designs and generates component code
- **Claude Code** automatically reviews the generated code
- Both tools share state through file-based synchronization

### Success Criteria
- ✅ Fast: Setup takes <30 minutes
- ✅ Accurate: Design specs → code translation is deterministic
- ✅ Efficient: Minimal manual intervention after initial setup

---

## 3. Architecture Overview

### 3.1 Directory Structure

```
filezen/
├── .claude/
│   ├── settings.json              # Claude Code hooks config
│   └── hooks.json                 # Auto-trigger rules
├── design/                        # Gemini-cli outputs
│   ├── components/                # Component design specs
│   │   ├── Button.md
│   │   ├── Card.md
│   │   └── ...
│   ├── system/                    # Design system specs
│   │   ├── colors.md
│   │   ├── typography.md
│   │   ├── spacing.md
│   │   └── shadows.md
│   └── COLLAB.json                # State tracking
├── src/
│   ├── components/                # Claude Code outputs
│   │   ├── Button.tsx
│   │   ├── Button.review.md
│   │   └── ...
│   └── ...
├── scripts/
│   ├── design-to-code.sh          # Automation script
│   └── sync-collab.sh             # State sync utility
└── docs/collab/
    └── SYNC_LOG.md                # Collaboration log
```

### 3.2 Data Flow

```
Gemini-cli generates design
         ↓
design/components/*.md created
         ↓ (Hook triggers)
Claude Code detects new design
         ↓
Claude Code generates code
         ↓
src/components/*.tsx created
         ↓
Claude Code auto-reviews
         ↓
COLLAB.json updated with status
```

---

## 4. Component Specifications

### 4.1 Design Specification Format

**File:** `design/components/<ComponentName>.md`

**Content Structure:**
```markdown
# ComponentName

## Visual Design
- Dimensions: [width]x[height]
- Colors: [primary], [secondary], [tertiary]
- Border radius: [value]
- Font family: [font], size: [size]

## States & Interactions
- Hover: [description]
- Active: [description]
- Disabled: [description]
- Loading: [description]

## Accessibility
- ARIA labels: [requirements]
- Focus states: [requirements]
- Keyboard navigation: [requirements]

## Responsive Behavior
- Mobile: [layout]
- Tablet: [layout]
- Desktop: [layout]

## Implementation Notes
- Dependencies: [list]
- Performance considerations: [notes]
```

### 4.2 Design System Specification

**File:** `design/system/<System>.md`

Examples:
- `colors.md`: Color palette with hex values, usage guidelines
- `typography.md`: Font families, sizes, line heights, weights
- `spacing.md`: Spacing scale (4px, 8px, 16px, etc.)
- `shadows.md`: Shadow definitions for depth

### 4.3 Collaboration State File

**File:** `design/COLLAB.json`

```json
{
  "project": "filezen",
  "version": "1.0.0",
  "last_sync": "2026-04-05T10:30:00Z",
  "designs": [
    {
      "id": "Button",
      "file": "design/components/Button.md",
      "design_status": "completed",
      "created_by": "gemini-cli",
      "created_at": "2026-04-05T10:00:00Z",
      "code_file": "src/components/Button.tsx",
      "code_status": "reviewed",
      "code_created_at": "2026-04-05T10:15:00Z",
      "review_passed": true,
      "review_notes": "✅ All checks passed"
    },
    {
      "id": "Card",
      "file": "design/components/Card.md",
      "design_status": "completed",
      "created_by": "gemini-cli",
      "created_at": "2026-04-05T10:05:00Z",
      "code_file": null,
      "code_status": "pending",
      "review_passed": null
    }
  ],
  "system": {
    "colors": { "status": "completed", "file": "design/system/colors.md" },
    "typography": { "status": "completed", "file": "design/system/typography.md" }
  }
}
```

**Status Values:**
- `pending` — Waiting for next step
- `in_progress` — Currently being worked on
- `completed` — Done
- `review_pending` — Waiting for review
- `reviewed` — Review completed

---

## 5. Workflow & Automation

### 5.1 Gemini-cli Workflow

1. **User triggers design generation:**
   ```bash
   gemini-cli design --component Button --output design/components/Button.md
   ```

2. **Gemini generates markdown spec** with UI design details, states, accessibility requirements

3. **File created automatically triggers Claude Code hook**

### 5.2 Claude Code Workflow

#### Phase 1: Code Generation
```bash
./scripts/design-to-code.sh design/components/Button.md
```

Actions:
1. Read design specification from `design/components/Button.md`
2. Parse design requirements
3. Generate TypeScript component in `src/components/Button.tsx`
4. Extract design system requirements (colors, spacing, fonts)
5. Update `COLLAB.json` → `code_status: "in_progress"`

#### Phase 2: Code Review
Automatically triggers after code generation:
```bash
./scripts/auto-review.sh src/components/Button.tsx design/components/Button.md
```

Review checklist:
- ✅ **Design Compliance:** Does code match design spec?
- ✅ **TypeScript:** Proper types, no `any`, generics used correctly?
- ✅ **Accessibility:** ARIA labels, focus management, keyboard support?
- ✅ **Performance:** Unnecessary re-renders, memoization where needed?
- ✅ **Code Quality:** Naming, structure, error handling?

Output: `src/components/Button.review.md`

#### Phase 3: State Sync
Update `COLLAB.json`:
```json
{
  "code_status": "reviewed",
  "review_passed": true,
  "review_notes": "✅ Passed all checks"
}
```

### 5.3 Hook Configuration

**File:** `.claude/settings.json`

```json
{
  "hooks": {
    "file_modified": [
      {
        "path": "design/components/**/*.md",
        "event": "created_or_modified",
        "action": "notify",
        "message": "🎨 Design updated: {filename}\nReady to generate code? Run: ./scripts/design-to-code.sh {filepath}"
      }
    ]
  },
  "automation": {
    "auto_code_review": true,
    "auto_update_collab_json": true
  }
}
```

---

## 6. Scripts & Utilities

### 6.1 `scripts/design-to-code.sh`

**Purpose:** Convert a design spec into code and review it

```bash
#!/bin/bash
set -e

DESIGN_FILE=$1
COMPONENT_NAME=$(basename "$DESIGN_FILE" .md)

echo "📖 Reading design: $DESIGN_FILE"

# 1. Validate design file exists
if [ ! -f "$DESIGN_FILE" ]; then
  echo "❌ Design file not found: $DESIGN_FILE"
  exit 1
fi

# 2. Generate component
echo "⚙️  Generating component code..."
claude generate-component "$DESIGN_FILE" \
  --output "src/components/${COMPONENT_NAME}.tsx" \
  --design-system "design/system"

# 3. Run code review
echo "🔍 Running code review..."
./scripts/auto-review.sh "src/components/${COMPONENT_NAME}.tsx" "$DESIGN_FILE"

# 4. Update collaboration state
echo "📝 Updating collaboration status..."
jq ".designs[] |= (if .file == \"$DESIGN_FILE\" then .code_status = \"reviewed\" | .review_passed = true else . end)" \
  design/COLLAB.json > design/COLLAB.json.tmp && \
  mv design/COLLAB.json.tmp design/COLLAB.json

echo "✅ Done! Component ready at: src/components/${COMPONENT_NAME}.tsx"
```

### 6.2 `scripts/auto-review.sh`

**Purpose:** Automatically review generated code against design spec

```bash
#!/bin/bash

CODE_FILE=$1
DESIGN_FILE=$2
REVIEW_FILE="${CODE_FILE%.tsx}.review.md"

echo "## Code Review Report" > "$REVIEW_FILE"
echo "**File:** $(basename "$CODE_FILE")" >> "$REVIEW_FILE"
echo "**Design Spec:** $(basename "$DESIGN_FILE")" >> "$REVIEW_FILE"
echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Run checks using Claude Code
claude review "$CODE_FILE" --design-spec "$DESIGN_FILE" >> "$REVIEW_FILE"

echo "✅ Review saved to: $REVIEW_FILE"
```

### 6.3 `scripts/sync-collab.sh`

**Purpose:** Manually sync COLLAB.json if auto-update fails

```bash
#!/bin/bash
echo "🔄 Syncing collaboration state..."
jq '.' design/COLLAB.json > /dev/null && echo "✅ COLLAB.json is valid"
```

---

## 7. Error Handling & Recovery

### 7.1 Common Failure Scenarios

| Scenario | Cause | Resolution |
|----------|-------|-----------|
| Design file invalid markdown | Gemini output format issue | Validate with `markdownlint` |
| Code generation fails | Design spec incomplete | Add missing sections to design file |
| Review rejects code | Code doesn't match spec | Fix code or update design |
| COLLAB.json out of sync | Process interrupted | Run `./scripts/sync-collab.sh` |
| Hook not triggering | Settings not loaded | Restart Claude Code |

### 7.2 Validation

Before code generation:
```bash
# Validate design spec format
./scripts/validate-design.sh design/components/Button.md

# Validate design system consistency
./scripts/validate-system.sh design/system/
```

---

## 8. Testing Strategy

### 8.1 Design Validation
- ✅ Markdown structure valid
- ✅ All required sections present
- ✅ Color codes valid hex format
- ✅ Dimensions are valid numbers

### 8.2 Code Generation Testing
- ✅ Component exports correctly
- ✅ Props match design spec
- ✅ TypeScript compiles with no errors
- ✅ Component renders without crashing

### 8.3 Integration Testing
- ✅ Design → Code → Review cycle completes
- ✅ COLLAB.json updates correctly
- ✅ Hooks trigger appropriately

---

## 9. Parallel Execution Capability

Since Gemini-cli and Claude Code operate on **different files** with clear dependencies:

```
Time →
Gemini: |== Design Button ==|
Claude:                       |== Code Button ==|== Review ==|

Gemini: |== Design Card ==|
Claude:                     |== Code Card ==|== Review ==|
```

**Multiple designs can be generated while Claude is coding previous designs.**

---

## 10. Future Extensions (Phase 2+)

- **MCP Server:** Upgrade to real-time sync if needed
- **Version Control:** Track design → code mapping in git history
- **Design Tokens:** Auto-extract tokens from design specs
- **Storybook Integration:** Auto-generate Storybook stories from specs
- **Visual Regression Testing:** Screenshot-based design validation

---

## 11. Success Metrics

After implementation:
- ⏱️ Design → Code turnaround: < 5 minutes per component
- 📊 Code review pass rate: > 95% on first generation
- 🎯 Design spec adherence: 100% (checked by review)
- 🔄 Manual sync interventions: < 1 per week

---

## 12. Summary

This design provides:
1. **Clarity:** File-based approach is easy to understand and debug
2. **Speed:** Minimal setup, immediate productivity
3. **Scalability:** Can handle multiple components in parallel
4. **Flexibility:** Easy to upgrade to MCP if needed later

**Ready to implement.**
