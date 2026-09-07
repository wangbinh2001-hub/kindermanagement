# RULES_PLANNING.md

## Purpose
Rules for planning, sequencing, scope control, and final reporting when an AI agent works on KinderManagement.

## One Active Plan
- Use only one active `PLAN.md`.
- Do not create side plans unless the user asks.
- Do not change the plan without approval.

## Phase Order
- Work phase by phase.
- Work one task at a time.
- Do not move to the next task until the current task meets Definition of Done.
- Do not implement features from later phases early.

## Task Scope
Each task must define:
- Goal.
- Files or areas allowed to change.
- Files or areas not allowed to change.
- Done criteria.
- Required verification commands.

If required information is missing, stop and ask. Do not guess.

## Before Coding
Before changing code, the agent must:
- Read the current task.
- Read rule files routed by `AGENT.md`.
- Inspect relevant existing code.
- Confirm needed dependency and schema already exist.
- Avoid creating missing foundations unless the task explicitly asks for them.

## Silent Execution
During implementation:
- Do not chat about progress.
- Code, test, fix, and retest silently.
- Stop only for out-of-scope decisions, architecture changes, new dependencies, dangerous operations, or missing requirements.

## No Scope Expansion
The agent must not independently:
- Add features.
- Refactor unrelated code.
- Change architecture.
- Add packages.
- Modify database schema outside the task.
- Fix unrelated issues.

Out-of-scope issues may be reported under `Out-of-scope findings`, but must not be fixed without approval.

## Completion Gate
A task may be reported complete only when:
- The requested scope is fully implemented.
- Type-check passes.
- Lint passes.
- Relevant tests pass.
- Test data is cleaned up.
- No unrelated file changes remain.
- `git diff` has been reviewed.

Do not claim completion if verification was skipped.

## Final Report Format
Use this format only:

```text
Status: PASS | BLOCKED | FAIL

Changed:
- ...

Verified:
- command: PASS | FAIL

Cleanup:
- PASS | NOT APPLICABLE | FAIL

Out-of-scope findings:
- None
```

No long explanations.
No progress storytelling.
No claims without commands.

## Blocked Report Format
If blocked, use this format:

```text
Status: BLOCKED

Reason:
- ...

Required decision:
- ...

Files changed:
- Yes | No
```

Then stop and wait for approval.

## Plan Changes
Only the user may:
- Add tasks.
- Remove tasks.
- Reorder phases.
- Expand scope.
- Accept exceptions.
- Mark a phase complete.

## Git Workflow
Branch, commit, and PR behavior is not universal.
Use it only when the current task or user explicitly requests it.
Do not force a Git workflow into local-only work.
