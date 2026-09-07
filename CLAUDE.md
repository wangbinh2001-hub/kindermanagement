# KinderManagement — AI Rules & Context

## Project Identity
Multi-tenant SaaS for preschool/kindergarten operations. Schools manage: attendance, students, classes, tuition, health, nutrition, staff, parent communication. Separate System Admin area + Parent Portal.

## Primary Users
- **System Admin** — Platform provisioning, support access (exceptional)
- **School Admin** — Full school operations
- **Teacher** — Assigned class: attendance, timelines, student info
- **Staff** — Role-scoped (accounting, kitchen, etc.)
- **Parent** — Read-only for own children + submit requests (meds, pickup, absence)

## Core Domains
1. Overview
2. Attendance (QR, matrix, class-based)
3. Tuition (calc, history, invoices, student reductions)
4. Fee Schedule (school-defined fees, financial rules)
5. Student Records (identity, profile, responsible persons, class history)
6. Health (height, weight, BMI, measurements, WHO context)
7. Nutrition (menus, meals, grocery sheets)
8. School Years & Classes (structure, membership, history)
9. Teachers & Staff (personnel, responsibilities, multi-school)
10. School Settings
11. Logs & Audit History
12. Parent Portal

## Key Invariants
- **Student identity ≠ school relationship** — deduplicate by CCCD, but isolate operational data per school
- **Class history preserved** — never overwrite with current class only
- **Responsible persons**: Father, Mother, Guardian — each: name, YOB, CCCD, phone; ≥1 required
- **Parent identity reused** — same phone = same parent across schools
- **Tuition reductions**: % or fixed amount; changes don't rewrite history
- **Initial passwords temporary** — must change on first login
- **Auth**: phone or username

## Design Character
Modern, mature, friendly not childish, expressive not distracting. Professional, clear, approachable, daily-use comfortable. Light + Dark themes. Sidebar navigation.

## Coding Rules (Stack-Neutral)
1. **TypeScript strict** — types for all domain entities, API contracts, DB schema
2. **Domain-driven structure** — modules map 1:1 to core domains above
3. **Tenancy first** — every query scoped to `school_id`; RLS or middleware enforcement
4. **Audit by default** — all mutations log: who, when, what changed
5. **Soft deletes** — `deleted_at` on all operational entities
6. **Optimistic UI** — server actions + client cache; rollback on error
7. **Server-side validation** — Zod/equivalent on every input boundary
8. **Idempotent mutations** — client-generated keys for retry safety
9. **No direct DB in UI** — API layer only; data access via service/repository
10. **Feature flags** — per-school toggles for optional modules
11. **Internationalization ready** — all user strings externalized (vi-VN primary)
12. **Accessibility** — WCAG 2.1 AA baseline; semantic HTML, focus management
13. **Performance budgets** — LCP < 2.5s, CLS < 0.1, TBT < 200ms
14. **Security** — CSP, CSRF, rate limiting, secrets in vault, no PII in logs
15. **Testing** — unit (domain logic), integration (API), e2e (critical flows)

## Don't Do
- ❌ Generic CRM/admin patterns — stay preschool-specific
- ❌ Overwrite class history with current assignment
- ❌ Duplicate student/parent identities across schools
- ❌ Silent tuition history rewrites on config change
- ❌ Childish UI (bright primary colors, cartoon icons)
- ❌ Hardcoded tenancy — every feature must work multi-school

## When Uncertain
Treat as unresolved. Ask before assuming product behavior.