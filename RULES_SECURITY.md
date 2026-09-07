# RULES_SECURITY.md

## Purpose
Rules for secure behavior in code, configuration, and operational changes.

## Secrets
- Never hardcode secrets.
- Never print secrets to logs.
- Never commit `.env` values.
- Use server-side secret storage only.

## Dangerous Operations
- No destructive commands without explicit approval.
- No hard reset, force push, or data wipe unless approved.
- No deleting production-like data casually.

## Dependency Policy
- Do not add packages unless necessary.
- If a new dependency is required, explain why before changing the stack.
- Prefer built-in or already installed tools first.

## Tenant Security
- Enforce RLS for school-scoped data.
- Do not bypass tenant controls with service-role keys in normal app code.
- Do not expose one school’s records to another school.

## Logging and PII
- Avoid logging CCCD, phone numbers, or other sensitive personal data in full.
- Mask sensitive fields when logs are necessary.
- Keep audit logs structured and minimal.

## Input Safety
- Validate all user input.
- Treat every external boundary as untrusted.
- Use parameterized queries and safe APIs.

## File Safety
- Do not write outside the project scope.
- Do not overwrite files unless the task requires it.
- Do not create shadow copies of the same source of truth.

## Security Mindset
- Prefer explicit permission checks.
- Fail closed, not open.
- If security and convenience conflict, security wins.
