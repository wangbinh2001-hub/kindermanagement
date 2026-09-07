# Navigation and Application Boundaries (P0.3)

> Source: `PLAN.md` P0.3 + `docs/authorization_matrix.md` + `docs/master_data_model.md` + `docs/modules/01..14`.
> Route parameter convention: `[schoolSlug]` matches App Router convention used in module specs. Server resolves `schoolSlug` to `schoolId` for RLS.

---

## 1. Route Groups

Four isolated route groups. No route mixes System Admin and school-operational authority.

| Group | URL prefix | App Router path | Auth method | Primary roles |
|---|---|---|---|---|
| **Auth** | `/auth` | `app/(auth)/` | Unauthenticated | All users |
| **System Admin** | `/sysadmin` | `app/system-admin/` | Better Auth session + `isSystemAdmin` | System Admin |
| **School Operations** | `/school/[schoolSlug]` | `app/(school)/[schoolSlug]/` | Better Auth session + `assertSchoolContext(schoolId)` | School Admin, Teacher, Staff |
| **Parent Portal** | `/parent` | `app/(parent)/` | Phone-based session (`ParentIdentity`) | Parent |

### Route isolation rule
- System Admin routes and School Operations routes share no common layout or context provider.
- A System Admin accessing school data must initiate a `SupportSession` and transition into `/school/[schoolSlug]` context. Never from `/sysadmin` directly.
- Parent Portal is a standalone boundary with phone-based auth, separate from school Better Auth sessions.

---

## 2. Page Map

### 2.1 Auth (`/auth`)

| Route | Purpose | Notes |
|---|---|---|
| `/auth/login` | Username / phone login | Standard Better Auth flow |
| `/auth/reset-password` | Forced password change | Blocks dashboard until completed (see `modules/01` 2.1) |
| `/auth/select-school` | Active school context selection | For users linked to multiple schools |

### 2.2 System Admin (`/sysadmin`)

Boundary: Zero school operational data visible without active `SupportSession`. See `authorization_matrix.md` 3.

| Route | Purpose | Permission |
|---|---|---|
| `/sysadmin` | Platform dashboard (aggregates only) | `isSystemAdmin` |
| `/sysadmin/schools` | School list and lifecycle management | `schools:provision`, `schools:read` |
| `/sysadmin/schools/[id]` | School platform settings and feature flags | `schools:provision` |
| `/sysadmin/support` | Support session management | `schools:support_manage` |
| `/sysadmin/audit` | Platform-wide audit logs | `audit:read` |

### 2.3 School Operations (`/school/[schoolSlug]`)

Boundary: All routes resolve `[schoolSlug]` to `schoolId`. RBAC applies. Feature flags (`SchoolSetting.enableX`) hide modules from sidebar and deny server procedures when disabled.

| Route | Purpose | Key permission(s) |
|---|---|---|
| `/school/[schoolSlug]` | Operational dashboard (role-aware) | Authenticated in school |
| `/school/[schoolSlug]/settings` | School profile and configuration | `school_settings:manage` (SA only) |
| `/school/[schoolSlug]/years` | School year management | `school_years:manage` / `school_years:read` |
| `/school/[schoolSlug]/years/[yearId]/classes` | Class management within a year | `classes:manage` / `classes:read` |
| `/school/[schoolSlug]/students` | Student list and enrollment | `students:read`, `students:manage` |
| `/school/[schoolSlug]/students/[studentId]` | Student profile, enrollment history | `students:read` + `students:pii_read` (PII masked without key) |
| `/school/[schoolSlug]/staff` | Staff management, roles, assignments | `staff:manage` / `staff:read` |
| `/school/[schoolSlug]/attendance` | Daily attendance matrix and QR check-in | `attendance:write` / `attendance:read` |
| `/school/[schoolSlug]/finance` | Fee schedules, tuition, invoices | `tuition:manage` / `tuition:read` |
| `/school/[schoolSlug]/health` | Health measurements and BMI history | `health:write` / `health:read` |
| `/school/[schoolSlug]/nutrition` | Menus, recipes, grocery sheets | `nutrition:manage` / `nutrition:read` / `nutrition:grocery` |
| `/school/[schoolSlug]/requests` | Parent request queue (approve/reject) | `parent_requests:review` / `parent_requests:read` |
| `/school/[schoolSlug]/notifications` | Notification management | `notifications:manage` |

#### Role-based sidebar visibility
- School Admin: all modules. Teacher: Dashboard, Students (assigned), Attendance, Health, Requests. Accountant: Finance, Students (read). Kitchen Staff: Nutrition only. Nurse: Health, Students (read). Driver/Security: Attendance QR gate only. Vice Principal: configurable minus settings/staff unless granted.
- Sidebar hiding reflects permissions. Server denies regardless of UI.

### 2.4 Parent Portal (`/parent`)

Boundary: Parents see authorized children only. All views filter by `selectedChild` + `schoolId`. Read-only except requests. No independent parent profile page.

| Route | Purpose | Notes |
|---|---|---|
| `/parent` | Dashboard with child selector and quick cards | After phone login, list active `ParentChildLink` children |
| `/parent/children/[childId]` | Child timeline and overview | Verify `ParentChildLink.isActive` |
| `/parent/children/[childId]/health` | Read-only health history | Growth chart, BMI |
| `/parent/children/[childId]/finance` | Read-only published invoices | `ISSUED` only |
| `/parent/children/[childId]/nutrition` | Read-only published menus | Published week only |
| `/parent/children/[childId]/requests` | List + create requests for child | Child-scoped requests |
| `/parent/requests` | Global request history across children | Optional convenience route |

Explicitly excluded from Parent Portal:
- Attendance data. Parents cannot view attendance per Module 13 (`docs/modules/13_parent_portal.md` 2, 5, 7). No `/parent/children/[childId]/attendance` route exists.
- Children not linked via `ParentChildLink.isActive`.
- Unpublished data (draft invoices, internal menus).
- Any write except creating/canceling own `ParentRequest`.

---

## 3. Navigation Hierarchies

### 3.1 System Admin Navigation
- Schools: list, provision, suspend, archive
- Support Sessions: active sessions, emergency access, history
- Platform Audit: platform-wide audit log viewer

### 3.2 School Operations Navigation

Dashboard: role-aware metrics per `modules/02`.

Academics:
- School Years: year list, current year indicator
- Classes: class list within year, teacher assignment
- Students: list, profiles, enrollment, responsible persons

Operations:
- Attendance: daily matrix, QR check-in/out, history (edit requires `attendance:edit_history`)
- Health: growth measurements, BMI charts
- Nutrition: weekly menu, recipes, ingredients, grocery sheets (feature-flagged via `enableNutrition`)

Finance:
- Fee Schedules: fee items, student reductions
- Invoices: monthly invoices, status management (feature-flagged via `enableTuition`)

Management:
- Staff: list, roles, permissions, assignments
- Requests: parent request queue (approve/reject)

Settings (SA only): school profile, feature flags, notification config.

### 3.3 Parent Portal Navigation
- My Children (context switcher, always visible)
- Timeline (child overview, quick-access cards)
- Health (read-only)
- Invoices and Payments (read-only, published only)
- Menus (read-only, published only)
- Requests (list + new request)

---

## 4. Boundary Enforcement Rules

| Rule | Detail | Reference |
|---|---|---|
| SysAdmin vs School isolation | `/sysadmin` never loads school workspace UI. SYS initiates `SupportSession` and transitions into `/school/[schoolSlug]`. Session `isActive` checked server-side. | `authorization_matrix.md` 3 |
| Parent Portal isolation | `/parent` uses phone session (`ParentIdentity`). All queries require `ParentChildLink.isActive` + `selectedChild`. Writes limited to `ParentRequest`. | `authorization_matrix.md` 4, Module 13 |
| Parent requests vs authoritative records | Approval triggers distinct domain procedure (e.g. `attendance.recordFromRequest`). Approving never mutates request row into authoritative table. | `authorization_matrix.md` 5 |
| School slug resolution | Middleware resolves `[schoolSlug]` to `schoolId`, verifies membership. Invalid slug or missing membership redirects to `/auth/login`. | `authorization_matrix.md` 7 |
| Feature flag enforcement | `SchoolSetting.enableX` hides sidebar modules and denies server procedures when disabled. | `authorization_matrix.md` 6 |
| Suspended school | All school members retain read; all writes blocked until re-activated. | `authorization_matrix.md` 6 |
| Tenant isolation (RLS) | Every school query includes `schoolId`. Cross-school read denied. Teacher queries filter by assigned `classId`. | `authorization_matrix.md` 1, 7 |
| PII masking | `students:pii_read` required for CCCD/passport full view. Audit UI masks PII. | `authorization_matrix.md` 6 |

---

## 5. Middleware and Route Guard Summary

| Guard | Scope | Behavior |
|---|---|---|
| `assertSchoolContext(schoolSlug)` | All `/school/[schoolSlug]/*` | Resolve slug to schoolId, verify membership and role, inject schoolId |
| `requirePermission(key)` | All school-side procedures | Deny by default; SA bypass in own tenant; others checked per role |
| `isSystemAdmin` | All `/sysadmin/*` | Verify SYS role; redirect if not |
| `assertSupportSession` | SYS accessing school data | Verify `SupportSession.isActive` and not expired; scope to target `schoolId` |
| `parentPortalGuard` | All `/parent/*` | Verify phone session, `ParentChildLink.isActive` for target child |
| `requireFeatureFlag(flag)` | Module school routes | Deny if `SchoolSetting[flag]` false; hide in sidebar |

---

*Status: P0.3 DONE. Boundaries approved as contract for P1+ implementation. Changes require user approval per PLAN.md Planning Rules.*
