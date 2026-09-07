# RULES_CODING.md

## Purpose
Rules for when Zcode is actively coding inside KinderManagement.

## Stack
- Next.js 16, App Router.
- tRPC v11 for queries and mutations.
- Prisma ORM.
- Supabase PostgreSQL with RLS.
- shadcn/ui, Radix UI, Tailwind CSS.
- React Hook Form, Zod.
- TypeScript strict.

## Code Scope
- Implement only the requested task.
- Do not add unrelated features, files, abstractions, or dependencies.
- If work outside scope is needed, stop and report the issue.

## Structure
- Use domain-oriented folders.
- Keep components small and focused.
- Prefer shared utilities only when used by at least two real call sites.
- Avoid one-off factories, wrappers, or interfaces.

## API and Validation
- Validate every boundary with Zod.
- Keep schema definitions close to the feature or in a shared validation package when reused.
- Use tRPC procedures for data access.
- Server Actions may be used for form submission, not as a second copy of the same mutation logic.

## Data Rules
- All operational records must be tenant-aware.
- Use `school_id` in all school-scoped data.
- Use soft delete with `deleted_at`.
- Every mutation must write audit data.

## Writing Style
- Prefer explicit names over clever names.
- Keep functions short.
- Avoid nested logic when early return is clearer.
- Use one source of truth for business rules.

## Output Behavior
- No long explanations while coding.
- Deliver code, test command, and test result.
- If a test fails, fix it before reporting completion.

## Forbidden
- No mock business logic.
- No fake production shortcuts.
- No hardcoded data that should come from the database.
- No bypassing tenancy.
- No hidden feature creep.
- No `any`, no `@ts-ignore`, no silent type loosening.
