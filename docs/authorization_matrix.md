# Authorization Matrix — KinderManagement (P0.2)

> Source: `PLAN.md` P0.2 + `docs/master_data_model.md` + `docs/modules/01..14`.
> Roles: **System Admin (SYS)**, **School Admin (SA)**, **Teacher** (Homeroom / Assistant), **Staff** (Accountant, Kitchen, Nurse, Driver, Security, Vice Principal, Other), **Parent (P)**.
> Enforcement: server-side `requirePermission()` / tRPC guard + RLS (`schoolId`). UI hiding is not authorization.

---

## 1. Principles

1. **Tenant isolation:** Every school-scoped entity requires `schoolId` in context. Cross-school read is denied even if global identity (Student/User) exists.
2. **System Admin has no school context by default.** Operational data (students, attendance, invoices, health, menus) is invisible without an **active `SupportSession`** (§3).
3. **School Admin bypasses permission checks inside own tenant** (full CRUD + audit). All other school roles go through permission keys.
4. **Parent is not a school member.** Parent sees only children where `phone` appears in `ResponsiblePerson` (Father/Mother/Guardian) and via `ParentChildLink`. Writes are limited to `ParentRequest`; never authoritative records.
5. **ParentRequest ≠ Authoritative record.** Approval creates/updates the authoritative record (e.g. `AttendanceRecord`) but the request itself stays `PENDING → APPROVED/REJECTED`.
6. **Soft-delete / append-only / immutability** are enforced per `master_data_model.md`; delete never removes history without audit.
7. **Deny by default.** Unknown permission key → denied.

---

## 2. Permission Keys (canonical)

| Key | Intended holders (default) | Notes |
|---|---|---|
| `schools:provision` | SYS | create/suspend/archive school |
| `schools:read` | SYS, SA | SYS sees platform list; SA sees own school |
| `schools:support_manage` | SYS | open/close SupportSession |
| `school_settings:manage` | SA | only SA (Module 12) |
| `school_settings:read` | SA, VICE_PRINCIPAL | others denied |
| `school_years:manage` | SA | create/update/archive/setCurrent |
| `school_years:read` | SA, Teacher, Staff | scoped to school |
| `classes:manage` | SA | create/update/soft-delete, assign teachers |
| `classes:read` | SA, Teacher, Staff | Teacher sees assigned classes |
| `students:manage` | SA | create/update/withdraw |
| `students:read` | SA, Teacher (assigned), ACCOUNTANT, NURSE | RLS + class assignment filter |
| `students:pii_read` | SA, Teacher (assigned) | CCCD/passport full view; others masked |
| `class_membership:manage` | SA, Teacher | append-only transfer |
| `staff:manage` | SA | CRUD, roles, permissions, status |
| `staff:read` | SA, VICE_PRINCIPAL | others limited |
| `attendance:write` | SA, Teacher (assigned), SECURITY, DRIVER* | daily/matrix/QR check-in/out |
| `attendance:edit_history` | SA only (+ explicit grant) | edit past dates / overtime |
| `attendance:read` | SA, Teacher (assigned) | |
| `tuition:manage` | SA, ACCOUNTANT | fee items, reductions, invoices |
| `tuition:read` | SA, ACCOUNTANT, VICE_PRINCIPAL | |
| `tuition:cancel_invoice` | SA | requires reason, audit |
| `health:write` | SA, Teacher (assigned), NURSE | append-only measurements |
| `health:read` | SA, Teacher (assigned), NURSE | Parent read via portal only |
| `nutrition:manage` | SA | ingredients, recipes, menus |
| `nutrition:grocery` | SA, KITCHEN_STAFF | create/approve grocery sheets |
| `nutrition:read` | SA, KITCHEN_STAFF, Teacher | Parent sees published week only |
| `parent_requests:review` | SA, Teacher (assigned) | approve/reject |
| `parent_requests:read` | SA, Teacher (assigned) | list for school |
| `audit:read` | SA, SYS | Staff/Teacher/Parent denied (Module 14) |
| `notifications:manage` | SA, SYS | |
| `parent_portal:access` | P | phone-based, child-scoped |

*DRIVER/SECURITY limited to QR gate check-in/out; no matrix/bulk edit.

Role → default permission sets (SA can override per StaffMember):

- **TEACHER (homeroom):** `classes:read`, `students:read`, `students:pii_read` (assigned class), `class_membership:manage`, `attendance:write`, `attendance:read`, `health:write`, `health:read`, `parent_requests:review`, `parent_requests:read`, `school_years:read`, `nutrition:read`
- **ASSISTANT_TEACHER:** same but `class_membership:manage` optional; may assist many classes.
- **ACCOUNTANT:** `tuition:manage`, `tuition:read`, `students:read` (no PII), `school_years:read`, `classes:read`
- **KITCHEN_STAFF:** `nutrition:grocery`, `nutrition:read`, `nutrition:manage` (if granted)
- **NURSE:** `health:write`, `health:read`, `students:read`
- **VICE_PRINCIPAL:** configurable; typically SA-like minus `school_settings:manage`/`staff:manage` unless granted.
- **OTHER/DRIVER/SECURITY:** minimal; explicit grant only.

---

## 3. System Admin — Support Access Constraints

| Rule | Detail |
|---|---|
| Default access | **No school operational data.** Dashboard shows only platform aggregates: school list (name/code/owner/phone/createdAt/status), counts, storage, DB/server health, system error logs. Student/parent/teacher/attendance/invoice/health/menu are hidden. |
| Normal support | `SupportRequest` (OPEN) created by SA → SYS picks "Nhận hỗ trợ" → `SupportSession` ACTIVE (`isActive=true`, `startedAt`, `endedAt?`, `reason`). While ACTIVE, SYS is granted temporary read (and write if scope allows) on that `schoolId`. |
| Emergency support | SYS self-opens session without request; **reason ≥20 chars** required; `AuditLog` level `CRITICAL` + alert notification. |
| Expiry | `endedAt` or `isActive=false` → immediately denied. Re-entry requires new session. |
| Audit | `SUPPORT_ACCESS_START` / `SUPPORT_ACCESS_END` + all mutations inside session tagged with `supportSessionId`, `systemAdminId`, `reason`. |
| School lifecycle | SYS can suspend (`SUSPENDED` → school users read-only, writes blocked) and soft-delete (2-step: retype `school.code` + SYS password/OTP, sets `deletedAt`). |

---

## 4. Module Read/Write Matrix

Legend: **R**=read, **W**=create/update, **D**=soft-delete/cancel, **—**=no access, **P-**=via portal only.

| Module / Entity | SYS (no session) | SYS (active session) | School Admin | Teacher (assigned) | Staff (by permission) | Parent |
|---|---|---|---|---|---|---|
| **School / SchoolSetting** | R (list) / W (provision, suspend, delete) | R/W same + read SchoolSetting of target school | R/W own school (only SA can manage settings) | — | — (VICE_PRINCIPAL R if granted) | — |
| **SchoolYear** | — | R | R/W/D | R | R | — |
| **Class** | — | R | R/W/D + assign homeroom/assistant | R (assigned) / W assign if SA grants | R | — |
| **ClassMembership** (append-only) | — | R | W (transfer) | W (transfer assigned) | — | — |
| **Student (global)** | — | R (no cross-school PII leak) | R/W | R (assigned, PII masked unless `students:pii_read`) | R per key | — |
| **StudentSchoolRelationship** | — | R | R/W/D (enroll/withdraw) | R (assigned) | R per key | — (child switcher lists own children) |
| **ResponsiblePerson** | — | R | R/W | R (assigned) | — | — |
| **StaffMember** | — | R | R/W/D + `staff:manage` (roles/permissions/status) | — | R self; manage only if SA | — |
| **AttendanceRecord** | — | R | R/W + `attendance:edit_history` | W today (assigned) ; past requires `attendance:edit_history` | W if `attendance:write`; past requires `attendance:edit_history` | — (not visible per Module 13) |
| **FeeItem / StudentReduction** | — | R | R/W/D | — | R/W if `tuition:manage` | — |
| **Invoice** | — | R | R/W/D (cancel with reason, issue replacement) | — | R/W if `tuition:manage`; cancel only SA | R (ISSUED only, published) |
| **HealthRecord** (append-only) | — | R | R/W | R/W (assigned) | R/W if `health:write` | R (own child, read-only) |
| **Ingredient / FoodItem** | — | R | R/W/D | R | R/W if `nutrition:manage` | — |
| **Menu** | — | R | R/W/D | R | R / W if `nutrition:manage` | R (published week only) |
| **GrocerySheet / GroceryItem** | — | R | R/W + approve | — | W if `nutrition:grocery`; approve SA | — |
| **ParentRequest** | — | R | R + review (approve/reject) | R + review (assigned) | — | W (create own) / R own / cancel own PENDING |
| **AuditLog** | R (platform-wide) | R | R (own school) | — | — | — |
| **Notification** | R/W platform | R/W | R/W own school | R own | R own | R own |
| **School Overview dashboard** | platform metrics only | + target school metrics | full school metrics | my-classes metrics only | per permission | — (Parent Portal home) |

---

## 5. ParentRequest vs Authoritative Records

| Aspect | ParentRequest | Authoritative record |
|---|---|---|
| Origin | `requestedById` = ParentIdentity, `requestedByPhone`, `requestType`, `metadata` | `recordedById` = StaffMember, `schoolId`, `classId`, etc. |
| Types | `LEAVE_REQUEST`, `MEDICATION_REQUEST`, `LATE_PICKUP_REQUEST`, `PICKUP_AUTHORIZATION_REQUEST`, `HEALTH_NOTE_REQUEST`, `OTHER_REQUEST` | `AttendanceRecord`, `HealthRecord`, `Invoice` snapshot, `Menu`, etc. |
| Lifecycle | `PENDING → APPROVED/REJECTED/CANCELLED/EXPIRED`; `reviewedById` + `reviewedByRole` | Created/updated only by school staff approval flow; immutable/snapshot rules apply |
| Auto-effects on APPROVE | LEAVE → creates `AttendanceRecord(ABSENT_EXCUSED)` (one per date); MEDICATION → surfaces in teacher dashboard; LATE_PICKUP → feeds overtime input; PICKUP_AUTH → adds to approved pickup list; HEALTH_NOTE → reference in student profile | No write-back to ParentRequest; request stays as audit trail |
| Permissions | Parent: `create`, `listForParent`, `cancel` (own PENDING). School: `approve`/`reject` requires `parent_requests:review` | Governed by module keys above |
| Audit | Every status change → AuditLog (APPROVE/REJECT) + notification to parent | Authoritative mutation → separate AuditLog (CREATE/UPDATE) |
| Tenant scope | `schoolId` + `studentSchoolRelationshipId`; parent cannot target unlinked child | Same `schoolId`; RLS enforced |

**Invariant:** Approving a ParentRequest never mutates the request into the authoritative table; it triggers a distinct creation/update of the authoritative record through its domain procedure.

---

## 6. Cross-cutting Rules

- **PII masking:** AuditLog UI masks CCCD (`0963******2477`), phone (`098****6003`), email (`h***@gmail.com`). Full values never rendered in audit views.
- **Attendance audit exception:** Daily `AttendanceRecord` writes are **not** audit-logged (volume); history edits (`attendance:edit_history`) are logged.
- **Invoice immutability:** `ISSUED` invoices are frozen (`itemsSnapshot` + amounts). Correction = `CANCELLED` + reason + new invoice. Direct amount edit denied.
- **Finance deferral:** No in-product payment processing; external payment links deferred (no permission granted).
- **Feature flags:** `SchoolSetting.enableNutrition / enableHealthTracking / enableQRAttendance / enableTuition` hide modules in sidebar **and** deny server procedures when disabled.
- **Suspended school:** All school members retain R, all W/D denied until re-activated.

---

## 7. Enforcement Checklist for Implementers

- [ ] Every tRPC procedure / Server Action calls `requirePermission(key)` (or SA bypass) + `assertSchoolContext(schoolId)`.
- [ ] RLS policies filter by `schoolId` (and `classId` for teachers) — not just UI.
- [ ] System Admin routes under `system-admin/` with guard `isSystemAdmin && (hasActiveSupportSession || isPlatformRoute)`.
- [ ] Parent Portal routes under `(parent)/` with `phone` session + `ParentChildLink.isActive` check per query.
- [ ] ParentRequest approval path calls authoritative domain service (e.g. `attendance.recordFromRequest`) — not direct table write.

---

*Status: P0.2 DONE — matrix approved as contract for P1+ implementation. Changes require user approval per PLAN.md Planning Rules.*
