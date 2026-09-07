# Master Data Model Specification

This document defines the ownership, identifiers, lifecycle, audit policy, soft-delete policy, and tenant scope for every core entity in KinderManagement per task **P0.1**.

---

## 1. Global Identity vs. School Operational Data

| Entity | Tenancy Scope | Owner | Identifier | Audit Policy | Soft-Delete Policy | Lifecycle & Description |
|---|---|---|---|---|---|---|
| **User** | Global | Platform / Better Auth | `id` (cuid/uuid) | Full (AuditLog) | Yes (`deletedAt`) | Platform user credentials, auth methods, global status. |
| **ParentIdentity** | Global | Platform | `phone` (E.164) / `id` | Full (AuditLog) | Yes (`deletedAt`) | Global parent account keyed by phone number; links to students across schools. |
| **Student** | Global | Platform | `id`, unique `cccd` | Full (AuditLog) | Yes (`deletedAt`) | Global student record deduplicated via national CCCD or passport. Never scoped to a specific school. |

---

## 2. Platform & Tenancy Entities

| Entity | Tenancy Scope | Owner | Identifier | Audit Policy | Soft-Delete Policy | Lifecycle & Description |
|---|---|---|---|---|---|---|
| **School** | Tenant Root | System Admin | `id`, unique `code`, `slug` | Full (AuditLog) | Yes (`deletedAt`) | Represents a tenant preschool/kindergarten institution. |
| **SchoolAdmin** | Tenant Scoped | School / System Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | School administrative user account and setup metadata. |
| **SupportRequest** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | No (Archived/Closed) | Support ticket initiated by School Admin requesting platform assistance. |
| **SupportSession** | Tenant Scoped | System Admin | `id` | Full (AuditLog) | No (Time-bounded) | Time-bounded session granting temporary System Admin access to a school's tenant. |
| **SchoolSetting** | Tenant Scoped | School Admin | `id`, unique `schoolId` | Full (AuditLog) | No | Config, enabled modules (attendance, tuition, health, nutrition), notifications. |

---

## 3. School Operations & Personnel

| Entity | Tenancy Scope | Owner | Identifier | Audit Policy | Soft-Delete Policy | Lifecycle & Description |
|---|---|---|---|---|---|---|
| **SchoolYear** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Academic year definition (e.g. 2025-2026) with current/archived status. |
| **Class** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Belongs to a single `SchoolYear` within a `School`. |
| **StudentSchoolRelationship** | Tenant Scoped | School Admin | `id`, unique (`studentId`, `schoolId`, `schoolYearId`) | Full (AuditLog) | Yes (`deletedAt`) | Operational enrollment linking a global Student to a specific School and Year. |
| **ResponsiblePerson** | Tenant Scoped | School Admin / Parent | `id` | Full (AuditLog) | No (Cascade/Historical) | Father, Mother, or Guardian information attached to a school enrollment. |
| **ClassMembership** | Tenant Scoped | School Admin / Teacher | `id` | Full (AuditLog) | No (Append-only) | Append-only history of a student's class assignments across or within terms. |
| **StaffMember** | Tenant Scoped | School Admin | `id`, unique (`userId`, `schoolId`) | Full (AuditLog) | Yes (`deletedAt`) | School personnel record, assigning role(s), employment status, and class assignments. |

---

## 4. Domain Modules

| Entity | Tenancy Scope | Owner | Identifier | Audit Policy | Soft-Delete Policy | Lifecycle & Description |
|---|---|---|---|---|---|---|
| **AttendanceRecord** | Tenant Scoped | Teacher / School Admin | `id`, unique (`studentSchoolRelationshipId`, `date`) | None (High volume) | Yes (`deletedAt`) | Daily check-in/out and attendance status per student enrollment. |
| **FeeItem** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Master list of configurable billable fees per school. |
| **StudentReduction** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Percentage or fixed-amount discounts assigned to an enrollment. |
| **Invoice** | Tenant Scoped | School Admin | `id`, unique (`studentSchoolRelationshipId`, `periodMonth`, `periodYear`) | Full (AuditLog) | Yes (`deletedAt`) | Monthly/termly billing snapshot. Immutable once issued; corrections are separate. |
| **InvoiceItem** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | No (Cascade with Invoice) | Line item breakdown of an invoice snapshot. |
| **HealthRecord** | Tenant Scoped | School Nurse / Teacher | `id` | Full (AuditLog) | Yes (`deletedAt`) | Periodic growth measurements (height, weight, BMI, WHO standards). |
| **Ingredient** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Master list of food ingredients with unit prices and kcal. |
| **FoodItem** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Recipe library (dish name, meal slot, ingredients). |
| **Menu** | Tenant Scoped | School Admin | `id`, unique (`schoolId`, `date`, `mealSlot`) | Full (AuditLog) | Yes (`deletedAt`) | Daily meal plan assignment. |
| **GrocerySheet** | Tenant Scoped | School Admin | `id` | Full (AuditLog) | Yes (`deletedAt`) | Monthly purchase sheet with budget validation. |
| **ParentRequest** | Tenant Scoped | Parent | `id` | Full (AuditLog) | Yes (`deletedAt`) | Leave, medication, pickup authorization requests needing school approval. |
| **Notification** | Tenant Scoped | System / School Admin | `id` | Minimal | Yes (`deletedAt`) | In-app/push alerts dispatched to teachers, parents, or staff. |
| **AuditLog** | Global / Tenant Scoped | System Root | `id` | Append-only | No (Immutable) | Security and audit trail capturing all critical mutations. |

---

## 5. Unresolved Entities & Lifecycle Decisions

1. **Third-party Payment Gateway Integration**: Whether external payments create transaction webhooks directly or remain manual transfer proof receipts (Deferred).
2. **Notification Delivery Providers**: SMS/Zalo ZNS/Email delivery integration models and fallback retry lifecycles (Deferred).
3. **Nutrition Market Purchase Sheets**: Detailed supplier, unit price reconciliation, and inventory tracking lifecycles (Deferred to P9.3).
4. **School Timeline / Social Feed**: Media storage and comment lifecycle policies (Deferred).
