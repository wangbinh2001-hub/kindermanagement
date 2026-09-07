# DOMAIN.md

## Purpose

This file defines the core business-domain model and relationships for the preschool management SaaS.

It describes domain meaning, ownership, relationships, invariants, and reasoning boundaries.

It is NOT a database schema.

Do not automatically convert every domain concept in this file into a table, column, enum, route, component, or service.

> Model the business truth first. Choose implementation structures only when implementation evidence requires them.

---

# 1. Domain Context Map

The product has three major operational contexts:

```text
Platform
│
├── System Administration
│
└── Schools
    │
    ├── Staff / Teachers
    ├── School Years
    ├── Classes
    ├── Students
    ├── Attendance
    ├── Fee Definitions
    ├── Tuition
    ├── Health
    ├── Nutrition
    ├── Settings
    ├── Logs
    └── Parent Portal
```

These contexts are related but must not be collapsed into one undifferentiated authorization or data model.

---

# 2. Core Identity Principle

A person and that person's relationship to a school are different concepts.

The same real person may participate in more than one school context.

Examples:

```text
Teacher Account
├── School A
└── School B
```

```text
Parent Account
├── School A
│   ├── Child A
│   └── Child B
└── School B
    └── Child C
```

Do not duplicate a person's account merely because that person belongs to multiple schools.

Do not treat the currently selected school as proof of authorization.

The selected school/class/child is UI context.

Authorization must come from the person's real relationships and permissions.

---

# 3. School

## Confirmed Truths

- A School is the primary operational tenant/context of the preschool management product.
- School operational data belongs to the relevant school.
- The platform administrator manages school accounts at the system level.
- School users operate inside authorized school contexts.
- One person may have relationships with multiple schools.

## Domain Relationships

A school may be related to:

- staff;
- teachers;
- students;
- parents/guardians through children;
- school years;
- classes;
- attendance;
- fee definitions;
- tuition records;
- health records;
- nutrition records;
- settings;
- logs.

These relationships describe business scope.

They do not require one specific database design.

## Invariant

Data from one school must never become accessible merely because a client sends another school identifier.

---

# 4. User Identity and School Context

## Confirmed Truths

- The same teacher/employee account may work in multiple schools.
- A parent account may have children in multiple schools.
- Multi-school access should not require duplicate accounts for the same person.
- Users should be able to switch between school contexts they are authorized to access.

## Context Switching

A simple school switcher is the preferred product behavior when a user belongs to multiple schools.

Example:

```text
[ School A ▾ ]
```

Changing the selected school changes the active working context.

It does not grant access to that school.

The backend must independently verify that the current user has access to the requested school.

## Domain Implication

The implementation will need some representation of the relationship between an identity and the schools that identity may access.

The exact persistence structure must be determined from the existing architecture.

Do not create unnecessary duplicate identities or account hierarchies to solve multi-school access.

---

# 5. Teacher and Employee

## Confirmed Truths

- Schools manage their own teachers and employees.
- A teacher/employee may work in more than one school.
- A teacher may have access to more than one class.
- When appropriate, the UI should allow switching between authorized schools and classes rather than duplicating accounts.

## Example Context

```text
Teacher
├── School A
│   ├── Class Lá 1
│   └── Class Lá 2
└── School B
    └── Class Mầm 1
```

Possible UI context:

```text
[ School A ▾ ]   [ Class Lá 1 ▾ ]
```

When the school changes, available class choices must reflect the teacher's real access within that school.

## Important Distinction

An employee/person record and authentication access are related concepts but should not be assumed to be identical.

Historical school records may still need to reference a teacher or employee after that person's login access changes.

## Open Decisions

- Exact teacher/staff role model.
- Exact permissions.
- Employment lifecycle.
- Whether non-teaching employees can belong to classes.
- How class responsibility is assigned.

---

# 6. School Year

## Confirmed Truths

- Schools manage school years.
- Student/class history must be preserved across school years.

## Domain Implication

A student's current class must not be modeled conceptually as if class membership never changes.

Historical school-year/class context matters to past records.

Examples include:

- attendance;
- tuition;
- reports;
- teacher assignments;
- student history.

## Invariant

Moving a student into a new school year or class must not destroy the meaning of historical records from previous school years/classes.

---

# 7. Class

## Confirmed Truths

- Classes exist within the school-management domain.
- Students belong to class contexts.
- Teachers may have access to multiple classes.
- Class membership history across school years must be preserved.

## Domain Relationship

Conceptually:

```text
Student
→ Enrollment / Membership Context
→ School Year
→ Class
```

This expresses the business need for historical class membership.

It does not require an entity literally named `Enrollment`.

The implementation should use the simplest structure that preserves the required history and existing project architecture.

## Context Switching

When a teacher has multiple authorized classes, a class switcher may be used:

```text
[ Class Lá 1 ▾ ]
```

The selected class is UI context, not authorization.

---

# 8. Student

## Confirmed Truths

- Student is a central school-domain entity.
- A student belongs to a school context.
- Student records interact with multiple product domains.
- Student class history must be preserved.
- A student profile contains responsible-person information.
- A student profile may contain an active tuition reduction configuration.

## Major Relationships

```text
Student
├── School
├── School Year / Class History
├── Father / Mother / Guardian Information
├── Attendance
├── Tuition Reduction
├── Tuition History
├── Health Measurements
└── Parent Portal Access
```

Other relationships may exist as the product is specified.

## Cross-Domain Impact

Changes to a student may affect:

- attendance;
- tuition;
- health;
- class membership;
- parent access;
- reports.

Changes to central student structures require checking these consumers.

---

# 9. Responsible-Person Information

## Confirmed Form Structure

Each student profile provides three fixed information sections:

```text
Father
├── Full name
├── Year of birth
├── Citizen ID (CCCD)
└── Phone number

Mother
├── Full name
├── Year of birth
├── Citizen ID (CCCD)
└── Phone number

Guardian
├── Full name
├── Year of birth
├── Citizen ID (CCCD)
└── Phone number
```

The form behaves like a student information sheet.

## Required Information Rule

The user is NOT required to complete all three people.

However, the student profile must contain information for at least one responsible/contact person.

Therefore:

```text
Father ───────┐
Mother ───────┼── At least one responsible person must contain information.
Guardian ─────┘
```

Unused sections may remain blank.

Do not remove unused Father, Mother, or Guardian sections from the information form merely because they are blank.

## Validation Implication

Validation must enforce the business rule at the group level rather than incorrectly making every field for all three people mandatory.

Do not interpret "at least one responsible person" as "all three people are required."

The exact minimum fields required for a responsible person to count as sufficiently completed is not yet defined and must not be guessed.

## Open Decision

- Which fields make a responsible-person section valid enough to satisfy the "at least one contact" requirement.

---

# 10. Parent Portal Identity and Student Access

## Confirmed Truths

- Parents authenticate to the Parent Portal.
- A parent account may be linked to multiple children.
- Those children may belong to different schools.
- Parent access is limited to children the parent is authorized to access.
- Parents may switch between their authorized school/child contexts.

## Example

```text
Parent Account
├── School A
│   ├── Child An
│   └── Child Bình
└── School B
    └── Child Minh
```

Possible UI:

```text
[ School A ▾ ]   [ Child An ▾ ]
```

## Important Distinction

The Father/Mother/Guardian information recorded on the student information sheet and an authenticated Parent Portal account are related concepts, but they must not automatically be assumed to be the same technical identity.

A student may contain contact information even when the corresponding person does not yet have portal access.

Likewise, portal access must be based on an authorized relationship, not merely matching a name or phone number.

The exact account-linking process remains to be defined.

## Security Invariant

Selecting or requesting another child ID must never grant access to that child's data without a verified parent-child relationship.

---

# 11. Parent Communication

## Confirmed Truths

- Parents can send instructions or requests to teachers and/or the school.
- Parent communication belongs to the relevant child/school context.

## Domain Implication

A communication workflow must make submitted information appropriately visible to its intended school recipient.

Important or time-sensitive requests may require attention, unread, acknowledgment, or handling semantics.

These semantics must be confirmed before implementation.

## Example

Medication instruction:

```text
Parent
→ selects authorized child
→ submits medication instruction
→ appropriate teacher/school must be able to notice the instruction
→ instruction retains child and timing context
```

This example implies a workflow obligation.

It does not automatically define push notifications, read receipts, dosage validation, or medication administration tracking.

---

# 12. Tuition Reduction

## Confirmed Truths

A student profile may have tuition reduction enabled.

The reduction supports two modes:

```text
Percentage
or
Fixed monetary amount
```

The school enters the applicable value.

Example:

```text
☑ Tuition reduction

Type:
○ Percentage
○ Fixed amount

Value:
[________]
```

When the reduction no longer applies, the school may disable tuition reduction for the student.

## Current-State Semantics

The student's current reduction configuration describes how future/applicable tuition calculations should treat the student according to the product's calculation rules.

It must not rewrite historical tuition that has already been calculated.

## Historical Invariant

Example:

```text
August
Reduction = 20%
Tuition calculated and recorded
```

Later:

```text
September
Reduction disabled
```

The August tuition result must remain based on the 20% reduction that applied when August tuition was calculated.

Disabling or changing the student's current reduction must not retroactively alter already-calculated historical tuition.

## Domain Implication

Historical tuition needs to preserve enough calculation context to explain its recorded result even when current student settings or fee definitions later change.

Do not solve this by blindly recalculating historical periods from current configuration.

## Open Decisions

- Whether both fixed and percentage reductions may coexist at the same time.
- Whether reductions apply to all fees or selected fee items.
- Exact ordering between student reductions and attendance-related deductions.
- Effective-date behavior when reduction changes mid-period.
- Exact calculation snapshot/audit representation.

---

# 13. Fee Definition

## Confirmed Truths

- Schools define fee items.
- Fee definitions are used in tuition calculation.
- Some fee behavior may relate to student absence.

## Domain Relationships

Potential relationship:

```text
Fee Definition
        ↓
Applicable Student / Context
        ↓
Tuition Calculation
```

Attendance may contribute adjustments when explicitly supported by the relevant fee rule.

## Reasoning Boundary

The agent should investigate:

- applicability;
- period;
- recurrence;
- absence behavior;
- reduction eligibility;
- effective dates.

Do not invent these properties merely because they are common in tuition systems.

---

# 14. Tuition

## Confirmed Truths

- Tuition is calculated from real school/student fee information.
- Student tuition reductions may affect tuition.
- Historical tuition results must remain historically stable after later configuration changes.

## Domain Implication

Tuition should be understood as a result with business context, not merely a live arithmetic expression over today's settings.

Conceptually:

```text
Relevant Fee Rules
        +
Student Context
        +
Applicable Adjustments
        +
Student Reduction
        ↓
Tuition Result
```

The actual calculation order is still an open business rule.

## Historical Integrity

Once tuition for a historical period has been calculated/recorded according to the product's completion semantics, later changes to:

- student reduction;
- fee configuration;
- class;
- school year;
- other current settings

must not silently rewrite the meaning of that historical result.

The exact correction/recalculation workflow remains to be defined.

---

# 15. Attendance

## Confirmed Truths

- Attendance is student-related.
- QR functionality exists.
- Matrix-related attendance functionality exists.

## Likely Domain Relationships to Investigate

```text
Attendance
├── Student
├── Class
├── School Year
├── Date
└── Attendance Context
```

Possible cross-domain relationships:

```text
Absence
→ eligible fee adjustment
→ tuition
```

and:

```text
Check-out
→ possible overtime childcare
→ possible additional fee
```

These relationships are not confirmed business rules until explicitly defined.

## Open Decisions

- Attendance statuses.
- QR semantics.
- Matrix semantics.
- Check-in/check-out semantics.
- Overtime childcare.
- Absence-to-fee rules.
- Attendance correction/audit behavior.

---

# 16. Health Measurement

## Confirmed Truths

Student health information includes:

- height;
- weight;
- BMI-related monitoring;
- health condition/status.

## Domain Implication

Height and weight are measurements that change over time.

The domain should preserve measurement history rather than assume only one permanent height and weight value exists.

Conceptually:

```text
Student
└── Health Measurement History
    ├── Measurement Date
    ├── Height
    ├── Weight
    └── BMI-related result
```

This is a domain model, not a prescribed table schema.

## Reasoning Boundary

Do not invent:

- WHO thresholds;
- z-score classifications;
- percentile rules;
- diagnosis;
- medical categories.

Use only explicitly selected standards and verified formulas.

---

# 17. Nutrition

## Confirmed Truths

The nutrition domain includes concepts such as:

- menus;
- meal planning;
- grocery/market purchasing sheets.

## Domain Implication

Potential relationships include:

```text
Menu
→ Meal
→ Ingredients
→ Quantities
→ Purchasing Requirements
```

Student counts, attendance, portions, inventory, nutrition values, or cost may become relevant depending on confirmed product rules.

Do not assume these relationships are implemented until verified.

---

# 18. Settings

## Confirmed Truths

- Schools have school-specific settings.
- School settings belong to the relevant school context.

## Invariant

A school setting must not silently affect another school.

Settings must have a real persistence source and authorization boundary.

---

# 19. Logs

## Confirmed Truths

- Schools have a Log area.

## Domain Boundary

School-facing operational/audit history is conceptually different from internal application/debug logs.

Do not expose engineering logs to school users merely because both are called "logs."

Exact log categories remain open.

---

# 20. Historical Data Principle

Historical business records must preserve the meaning they had when they were created or finalized.

Examples include:

- historical class membership;
- historical attendance;
- historical tuition;
- historical health measurements.

Current configuration must not silently rewrite historical truth.

When mutable configuration affects historical calculations, preserve enough historical context to explain the result.

---

# 21. Context Selection vs Authorization

This rule applies throughout the product.

```text
School switcher
Class switcher
Child switcher
```

are convenience mechanisms for selecting the current UI context.

They are NOT authorization mechanisms.

Every protected operation must verify the underlying authorized relationship.

Example:

```text
User selects School B
        ↓
UI requests School B data
        ↓
Server verifies user ↔ School B relationship
        ↓
Allowed or denied
```

Never trust only:

- selected dropdown values;
- route parameters;
- local storage;
- client state;
- hidden form fields.

---

# 22. Domain Simplicity Principle

Support real many-to-many relationships without making the product unnecessarily complicated.

Examples:

- one teacher may work at multiple schools;
- one teacher may access multiple classes;
- one parent may have multiple children;
- those children may attend multiple schools.

Prefer one identity plus authorized relationships and simple context switching over duplicate accounts or artificial product hierarchies.

Do not introduce additional layers, entities, workflows, or UI steps unless they solve a real domain requirement.

---

# 23. Domain Reasoning Policy

The coding agent may infer questions and workflow obligations from the domain.

For example:

```text
Parent sends medication instruction
→ recipient visibility must be considered
```

```text
Student changes class
→ historical class membership must be considered
```

```text
Student reduction changes
→ historical tuition stability must be considered
```

```text
Height/weight change
→ measurement history must be considered
```

The coding agent must NOT convert these implications into undocumented implementation facts.

Before creating a new:

- entity;
- table;
- field;
- status;
- enum;
- formula;
- permission;
- notification channel;
- lifecycle;
- pricing rule;

verify the relevant project evidence.

If a material domain decision is uncertain, ask rather than silently inventing it.

---

# 24. Confirmed Core Relationships

At the current level of product definition:

```text
Platform
└── School

User Identity
├── may access multiple Schools
├── Teacher/Employee relationships
└── Parent Portal relationships

School
├── School Years
├── Classes
├── Students
├── Teachers / Employees
├── Fee Definitions
├── Tuition
├── Attendance
├── Health
├── Nutrition
├── Settings
└── Logs

Student
├── School
├── historical School Year / Class context
├── Father information
├── Mother information
├── Guardian information
├── Tuition Reduction
├── Tuition History
├── Attendance
├── Health Measurement History
└── authorized Parent Portal relationships

Parent Account
└── may access multiple authorized children
    └── children may belong to multiple Schools

Teacher / Employee Account
└── may belong to multiple Schools
    └── teacher may access multiple Classes
```

This map describes business relationships only.

It must not be copied mechanically into a database schema.

---

# 25. Current Open Domain Decisions

The following remain intentionally unresolved:

- Exact authentication identity model.
- Exact school membership persistence model.
- Exact teacher/staff role model.
- Exact permissions.
- Exact Parent Portal account-linking workflow.
- Minimum fields required for one Father/Mother/Guardian section to count as valid contact information.
- Exact attendance statuses.
- Exact QR attendance semantics.
- Exact Matrix attendance semantics.
- Check-in/check-out rules.
- Overtime childcare rules.
- Attendance-related fee deductions.
- Exact tuition calculation order.
- Reduction stacking/applicability.
- Mid-period reduction changes.
- Tuition correction/recalculation workflow.
- Exact WHO reference and classification rules.
- Nutrition calculation rules.
- School-year rollover workflow.
- Log categories and retention.

These open decisions must remain open until project evidence or an explicit product decision resolves them.
