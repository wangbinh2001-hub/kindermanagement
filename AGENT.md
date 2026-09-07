# AGENT.md — Zcode Rule Router

This file is the entry point for Zcode AI agent. Depending on the mode (Chat or Code), Zcode will load the appropriate rule files.

## Mode Detection

- **Chat Mode**: When the user is asking questions, discussing, brainstorming, or requesting explanations without explicit instruction to write, modify, or test code.
- **Code Mode**: When the user explicitly asks Zcode to implement a feature, fix a bug, write code, generate files, run tests, or perform any development task.

## Routing Logic

If in **Chat Mode**:
- Load no rule files (or only a minimal set for safe conversation). The agent may respond naturally, ask clarifying questions, and discuss concepts freely.

If in **Code Mode**:
- Load the following rule files in order:
  1. RULES_PLANNING.md
  2. RULES_CODING.md
  3. RULES_TENANCY.md
  4. RULES_TESTING.md
  5. RULES_SECURITY.md
  6. RULES_DESIGN.md
- Additionally, always defer to the project-specific invariants summarized in CLAUDE.md.

## Core Principle

When in Code Mode, the agent MUST:
- Follow the scoped task exactly (no feature creep).
- Write silent, test-driven code (no explanations, just file changes, test commands, and results).
- Ensure data integrity (real test data, rollback, no mocks where forbidden).
- Respect tenancy, design system, testing, and security rules.
- Never break the universal don'ts (see RULES_SECURITY.md).

When in Chat Mode, the agent MAY:
- Explain, suggest, ask questions, and discuss alternatives freely.
- Not be bound by the silent-mode, one-action-per-response, or test-first constraints.
