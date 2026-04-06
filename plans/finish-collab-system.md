# Plan: Finish Gemini-Claude Collaboration System Implementation

This plan aims to complete the remaining tasks (9-14) for the Gemini-Claude collaboration system, ensuring consistency and proper automation.

## Objective
- Fix `design/COLLAB.json` structure (should be an array for `designs`).
- Implement missing automation scripts (`auto-review.sh`, `sync-collab.sh`, `validate-design.sh`).
- Configure Claude Code hooks in `.claude/settings.json`.
- Create comprehensive documentation and sync logs.

## Key Files & Context
- `design/COLLAB.json`: State tracker (needs structural fix).
- `scripts/`: Directory for automation scripts.
- `.claude/settings.json`: Configuration for Claude Code hooks.
- `docs/collab/`: Directory for collaboration documentation.

## Implementation Steps

### 1. Fix `design/COLLAB.json` Structure
- Convert `designs` from an object to an array of objects.
- Each object in the array should have an `id` field (e.g., `"id": "Button"`).
- Ensure existing design data for `button` and `card` is preserved.

### 2. Implement `scripts/auto-review.sh` (Task 10)
- Create `scripts/auto-review.sh` with the content specified in the implementation plan.
- Make it executable.
- Test it with `src/components/Button.tsx`.

### 3. Implement Utility Scripts (Task 11)
- Create `scripts/sync-collab.sh` to validate and sync `COLLAB.json`.
- Create `scripts/validate-design.sh` to validate design specification format.
- Make them executable.

### 4. Update Claude Code Settings (Task 12)
- Modify `.claude/settings.json` to include collaboration hooks and automation settings.

### 5. Create Documentation (Task 13)
- Create `docs/collab/COLLAB_SETUP.md` with setup and usage instructions.
- Create `docs/collab/WORKFLOW_EXAMPLE.md` with an example workflow.

### 6. Create Sync Log and Final Verification (Task 14)
- Create `docs/collab/SYNC_LOG.md`.
- Run final verification steps to ensure all scripts and files are correct.

## Verification & Testing
- Run `./scripts/sync-collab.sh` to verify `COLLAB.json`.
- Run `./scripts/validate-design.sh design/components/Button.md` to verify design files.
- Run `./scripts/auto-review.sh src/components/Button.tsx design/components/Button.md` to verify review generation.
- Check `.claude/settings.json` validity using `jq`.
