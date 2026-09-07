# RULES_TENANCY.md

## Purpose
Rules for tenant isolation and school-scoped data handling.

## Core Rule
Every operational query must be scoped to one school.
If a query is not school-scoped, it is wrong.

## Required Model
- Every operational table must have `school_id`.
- Every school-scoped record must be isolated by tenant.
- Multi-school users still operate through the active school context.

## Enforcement
- Use PostgreSQL RLS.
- Use middleware or repository guards as backup.
- Never rely on UI filtering as the only protection.
- Never use service-role access as a normal shortcut.

## Support Access
- System Admin support access is exceptional.
- It must be explicit, time-bounded, reasoned, and audited.
- It must target one school at a time.
- It must not become permanent operational access.

## Soft Delete
- Use `deleted_at` on operational entities.
- Default queries must ignore deleted rows.
- Restoration must be explicit and audited.

## Cross-School Safety
- Student identity and school relationship are separate concepts.
- Same person across schools does not mean shared school data.
- No accidental leakage through joins, filters, or cached state.

## Review Rule
Any feature touching multi-school data must be checked against tenant leakage before it is accepted.