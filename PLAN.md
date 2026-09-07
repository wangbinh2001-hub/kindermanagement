# KinderManagement — Master Implementation Plan

## Status
Draft. This is the only active implementation plan.

## Product Boundary
KinderManagement is a multi-tenant preschool and kindergarten operations SaaS.

Primary areas:
- Platform System Admin.
- School Admin, Teachers, and Staff operations.
- Parent Portal.

Technology baseline:
- Next.js 16, App Router, TypeScript strict.
- tRPC v11, Prisma, Supabase PostgreSQL with RLS.
- Better Auth.
- Tailwind CSS, shadcn/ui, Radix UI.
- Zod, React Hook Form.
- Website only; no native mobile app.
- No in-product payment processing. Financial records may link to third-party payment applications in a future approved task.

## Planning Rules
- Follow phases in order.
- Complete each task's done criteria before starting the next task.
- Do not add tasks, alter scope, or mark a phase complete without user approval.
- Every code task follows `AGENT.md` and its routed rule files.
- Details not specified here or in `CLAUDE.md` remain unresolved and require approval before implementation.

---

# Phase 0 — Product Decisions and System Blueprint

## Goal
Convert product intent into approved implementation contracts before scaffolding.

## Tasks

### P0.1 Define master data model [DONE]
Define ownership, identifiers, lifecycle, audit policy, soft-delete policy, and tenant scope for every core entity.

Documented at `docs/master_data_model.md`.

Includes:
- Global identities: User, Parent, Student.
- Platform: School, System Admin, support access, feature flags.
- School operations: enrollment, responsible persons, school year, class, class membership, staff assignment.
- Domain module entities: attendance, finance, health, nutrition, requests, notifications, audit logs.

Done when:
- Every entity has a documented owner and tenancy rule.
- Global identity versus school operational data is explicit.
- Unresolved entities and lifecycle decisions are listed.

### P0.2 Define authorization matrix [DONE]
Define permissions by System Admin, School Admin, Teacher, Staff role, and Parent.

Done when:
- Read/write boundaries are defined per module.
- System Admin support access is explicitly constrained.
- Parent-submitted requests are distinct from authoritative school records.

Documented at `docs/authorization_matrix.md`.

### P0.3 Define navigation and application boundaries [DONE]
Define route groups, page map, and navigation for Auth, School Operations, Parent Portal, and System Admin.

Done when:
- No route mixes System Admin and school-operational authority.
- Parent Portal information boundaries are explicit.

Documented at `docs/navigation_boundaries.md`.

---

# Phase 1 — Foundation and Platform Core

## Goal
Create a runnable, secure project foundation without business modules.

## Tasks

### P1.1 Bootstrap application [DONE]
Create the Next.js 16 application and baseline TypeScript, linting, formatting, environment validation, and test configuration.

Done when:
- Development, build, type-check, lint, and test commands run.
- Secrets are not committed.
- No production feature code exists yet.

### P1.2 Configure Supabase, Prisma, and migration workflow [DONE]
Connect a dedicated Supabase PostgreSQL project, define Prisma workflow, and establish safe migrations.

Done when:
- Development and test database environments are distinct.
- Migration creation and application workflow is documented and runs.
- RLS-compatible connection and request-context strategy is validated.

### P1.3 Establish tenancy and audit primitives
Implement only shared primitives required by later modules.

Includes:
- School context resolution.
- RLS policy pattern.
- Audit log service.
- Soft-delete query pattern.
- Idempotency key pattern.

Done when:
- Two-school isolation test passes on the real test database.
- Audit records are created for a test mutation.
- Deleted rows are excluded by default.

### P1.4 Establish authentication foundation [DONE]
Implement account/session foundations only.

Includes:
- Supabase Auth setup with admin (service-role) and anon (publishable) clients.
- Email/password sign-up and sign-in.
- Phone OTP sign-in and verification.
- Password reset flow (email-based).
- Temporary-password and forced-password-change state via `is_temporary_password` claim.
- Active school context for multi-school users via `x-school-id` header and JWT claim.
- JWT claims extraction for RLS policy integration.
- RLS context setting via `set_config('request.jwt.claims')` in `@km/db`.
- Auth validation schemas in `@km/validators`.
- Auth tRPC router with sign-up, sign-in, phone OTP, password reset, and session endpoints.
- Admin-only user management (create, update, delete, list) via service-role.

Done when:
- Authentication flow works on test data.
- A temporary account cannot enter normal operations before password change.
- No role-specific dashboard is built yet.

### P1.5 Establish UI foundation [DONE]
Create design tokens, theme switching, shared shell primitives, i18n setup, and accessible baseline components.

Done when:
- Light and dark themes work.
- Vietnamese locale infrastructure works.
- Shared loading, empty, error, and data states are available.

---

# Phase 2 — System Admin Portal

## Goal
Enable platform-level school provisioning without implicit access to school operations.

## Tasks

### P2.1 System Admin boundary
Create isolated System Admin authentication, route layout, authorization guard, and navigation.

Done when:
- School users cannot enter System Admin routes.
- System Admin does not receive an active school-operational context by default.

### P2.2 School lifecycle management
Implement school provisioning, status changes, and initial School Admin provisioning with temporary credentials.

Done when:
- A school can be created, activated, suspended, and archived according to approved lifecycle rules.
- Initial School Admin is created with forced password change.
- All mutations are audited.

### P2.3 Support access workflow
Implement explicit, time-bounded support access for one target school.

Done when:
- A support session requires reason, target school, scope, start/end time, and audit trail.
- Expired access is denied.
- Support actions are visible in audit records.

### P2.4 Per-school feature flags
Implement feature flag storage and server-side evaluation.

Done when:
- Flags are isolated per school.
- Disabled modules are unavailable through UI and server authorization.

---

## Module reference for Phase 2
- `docs/modules/01_system_admin.md`

---

# Phase 3 — School Operations Foundation

## Goal
Create the tenant workspace and structures required before child operations.

## Tasks

### P3.1 School workspace shell
Create school route boundary, role-aware sidebar, active-school selector, and operational dashboard shell.

Done when:
- All data views resolve through one active school context.
- Role-based navigation hides unavailable modules without relying only on UI checks.

### P3.2 School settings
Implement school profile and operational settings that are explicitly approved in the data model.

Done when:
- Only School Admin can modify school settings.
- Changes are audited and tenant-isolated.

### P3.3 School years & classes
Implement the combined year/class workspace where selecting a school year shows the classes inside that year, and creating a class happens inside the selected year context.

Done when:
- A school has controlled current-year state.
- Historical school years remain readable.
- Classes belong to exactly one school year.
- The UI flow is: choose year -> view classes -> create class within that year.

---

## Module reference for Phase 3
- `docs/modules/03_school_years_and_classes.md`
- `docs/modules/12_school_settings.md`
- `docs/modules/02_school_overview.md`

---

# Phase 3 Completion Note

The school-year and class modules are intentionally combined into one module file. Do not recreate separate year/class spec files unless the user explicitly requests it.

---

# Phase 4 — Students, Families, and Enrollment History

## Goal
Implement the child and family model before attendance, finance, health, or parent views.

## Tasks

### P4.1 Global student identity and CCCD matching
Implement global Student identity and controlled CCCD duplicate matching.

Done when:
- Valid authoritative CCCD prevents duplicate global student identity.
- Matching a student never exposes another school's operational data.
- CCCD handling and visibility follow approved privacy rules.

### P4.2 Student-school enrollment
Implement StudentSchoolRelationship lifecycle.

Done when:
- Enrollment is school-scoped and auditable.
- Withdrawal does not delete identity or history.
- Transfer creates a new school relationship, not copied operational data.

### P4.3 Responsible persons and parent identity linking
Implement Father, Mother, Guardian records and authorized phone linking.

Done when:
- At least one valid responsible-person section is required.
- Same phone reuses one Parent identity across schools.
- Parent authorization stays scoped to each child and school relationship.

### P4.4 Class membership history
Implement append-only class membership by school year.

Done when:
- Class moves preserve prior membership history.
- Current class is derived or safely maintained without replacing historical records.

### P4.5 Student workspace
Implement School Admin student list, student profile, enrollment history, and family views.

Done when:
- All four UI states exist.
- Role-based fields and PII visibility are enforced.

---

## Module reference for Phase 4
- `docs/modules/05_students_and_families.md`

---

# Phase 5 — Teachers, Staff, and School Authorization

## Goal
Manage school personnel and assign operational permissions.

## Tasks

### P5.1 Staff member lifecycle
Implement staff-school relationship, employment status, and school-specific personnel records.

Done when:
- One User can work across schools without duplicate identity.
- Employment data remains school-isolated.

### P5.2 Role and permission assignment
Implement approved RBAC/ABAC permission model.

Done when:
- Teacher, staff, and School Admin permissions are enforced server-side.
- Users receive no permissions merely because they can see a route.

### P5.3 Class staff assignments
Implement homeroom and assistant-teacher assignments.

Done when:
- Class access is limited to assignments and approved role scope.
- Assignment changes are auditable.

---

## Module reference for Phase 5
- `docs/modules/06_staff.md`

---

# Phase 6 — Attendance

## Goal
Implement daily attendance after student, class, staff, and permissions foundations are stable.

## Tasks

### P6.1 Attendance domain and manual class attendance
Implement attendance records, status lifecycle, and class-based daily marking.

Done when:
- Attendance belongs to student enrollment, class, school, and date.
- Teacher permissions are verified.
- Idempotent mutations prevent duplicate attendance records.

### P6.2 Attendance matrix
Implement class × date matrix workflow with guarded bulk operations.

Done when:
- Bulk updates are tenant-scoped, audited, validated, and recoverable on failure.
- Historical attendance is not silently overwritten.

### P6.3 QR attendance workflow
Implement approved QR check-in/out workflow.

Done when:
- QR tokens have explicit expiry, authorization, and replay-protection behavior.
- Attendance is created through the same authoritative domain flow.

### P6.4 Real-time attendance updates
Add real-time updates only after core attendance flow works.

Done when:
- Updates expose only authorized school/class data.
- Reconnection and stale state behavior are tested.

---

## Module reference for Phase 6
- `docs/modules/07_attendance.md`

---

# Phase 7 — Fee Schedules, Tuition, and Invoices [DONE]

## Goal
Implement financial configuration and immutable historical billing records.

## Tasks

### P7.1 Fee schedules [DONE]
Implement school-defined fee schedule versions, fee items, effective dates, and applicability rules.

Done when:
- A fee schedule is tenant-scoped, versioned, auditable, and cannot silently rewrite history.

### P7.2 Student reductions [DONE]
Implement percentage and fixed-amount reductions with approved effective periods.

Done when:
- Reduction configuration is validated and audited.
- Changes affect only future calculations unless explicit correction workflow is approved.

### P7.3 Tuition calculation [DONE]
Implement deterministic calculation from explicit inputs and calculation snapshot.

Done when:
- Money uses a decimal-safe representation.
- Calculation rules, applied schedule version, reductions, and inputs are stored.
- Unspecified adjustment order is not invented.

### P7.4 Invoices and corrections [DONE]
Implement invoice issuance, immutable snapshots, and explicit correction records.

Done when:
- Historical invoices are never rewritten by current configuration.
- Corrections are explicit, auditable, and preserve original invoice history.

### P7.5 External payment references
Deferred. Add only after the user approves a third-party payment-link workflow.

---

## Module reference for Phase 7
- `docs/modules/08_fees_and_tuition.md`

---

# Phase 8 — Health

## Goal
Track health information as an append-only, school-scoped history.

## Tasks

### P8.1 Health measurements [DONE]
Implement height, weight, measurement metadata, and history.

Done when:
- Measurements are append-only.
- Only authorized school roles can record or see appropriate health data.

### P8.2 BMI and approved WHO context [DONE]
Implement BMI calculation and WHO-related interpretation only after exact product rules are approved.

Done when:
- Formula, age/sex inputs, reference standard/version, and display wording are specified.
- Historical measurement interpretation remains traceable.

### P8.3 Health views [DONE]
Implement role-appropriate child health history and parent read-only view.

Done when:
- PII and health access boundaries are tested.

---

## Module reference for Phase 8
- `docs/modules/09_health.md`

---

# Phase 9 — Nutrition

## Goal
Manage school menu and nutrition operations.

## Tasks

### P9.1 Menus [DONE]
Implement school menu planning and publishing.

Done when:
- Menus are school-scoped and can be presented to authorized parents.

### P9.2 Daily meal information [DONE]
Implement approved daily meal record workflow.

Done when:
- Records preserve historical information and authorized staff access.

### P9.3 Grocery and market purchase sheets [DONE]
Implement purchase-sheet workflow only after fields, cost rules, approval flow, and export requirements are approved.

---

## Module reference for Phase 9
- `docs/modules/10_nutrition.md`

---

# Phase 10 — Parent Portal

## Goal
Give parents a mobile-friendly website to view authorized child information and submit requests.

## Tasks

### P10.1 Parent portal boundary
Implement Parent route layout, phone-based parent identity, child selection, and authorization.

Done when:
- Parent sees only children explicitly authorized through responsible-person relationship.
- Multi-school children are correctly isolated by school context.

### P10.2 Parent read-only information
Implement approved views for attendance, invoices, health history, timelines, and menus.

Done when:
- Each view honors source-module permission and publication rules.
- Parent cannot alter authoritative school records.

### P10.3 Parent requests
Implement requests for medication instruction, late pickup, pickup authorization, absence/leave, and child condition notes.

Done when:
- Parent submissions are clearly marked as parent-originated requests.
- Requests require school review; they do not automatically become authoritative records.
- All submissions are auditable and tenant-scoped.

---

## Module reference for Phase 10
- `docs/modules/13_parent_portal.md`
- `docs/modules/11_parent_requests.md`

---

# Phase 11 — Logs, Notifications, and Operational Visibility

## Goal
Make system activity visible without exposing sensitive or unauthorized data.

## Tasks

### P11.1 Audit log viewer
Implement authorized audit-log search and detail views.

Done when:
- Logs are immutable and tenant-scoped.
- PII is masked where policy requires.

### P11.2 Notifications
Define notification types, recipients, delivery channels, read state, and retention before implementation.

Done when:
- Notification delivery is authorization-aware and does not leak school data.

### P11.3 Approved exports and reports
Implement exports only after each report's field set, permission boundary, format, and retention expectation are approved.

---

## Module reference for Phase 11
- `docs/modules/14_logs_and_audit.md`

---

# Phase 12 — Quality, Security, and Release Readiness

## Goal
Prepare approved modules for production release.

## Tasks

### P12.1 Critical end-to-end flows
Implement E2E coverage for approved critical flows.

Initial target flows:
- System Admin provisions a school and School Admin.
- School Admin creates student enrollment and class membership.
- Teacher records attendance.
- School Admin generates a tuition invoice.
- Parent views an authorized child and submits a request.

Done when:
- Tests use real test infrastructure and clean up all test data.

### P12.2 Security and tenancy review
Review RLS, authorization, audit coverage, secrets, rate limits, CSRF, CSP, and PII logging.

Done when:
- Tenant-isolation tests pass across all completed modules.
- No known critical security issue remains open.

### P12.3 Performance and accessibility review
Measure approved screens against project budgets and WCAG 2.1 AA baseline.

Done when:
- LCP < 2.5s, CLS < 0.1, TBT < 200ms for measured primary flows.
- Accessibility test results and remediation are recorded.

### P12.4 Deployment and recovery readiness
Define and validate CI, environments, migrations, backups, observability, rollback, and incident response.

Done when:
- Build, test, migration, deployment, and rollback runbooks are verified.
- Production data is never used in automated tests.

---

# Deferred Decisions

Do not implement these without explicit approval:
- Monorepo versus single Next.js app structure.
- Exact Supabase RLS request-context mechanism with Prisma.
- Real-time provider and event architecture.
- File storage provider and upload policy.
- Third-party payment-link workflow.
- Notification delivery providers.
- Exact WHO standards and interpretation policy.
- School timeline feature scope.
- Report/export catalog.
- Subscription/billing for schools.

# Phase Completion Format

Only the user may mark a phase complete. Each completed task must report using `RULES_PLANNING.md` final report format.
