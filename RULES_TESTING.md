# RULES_TESTING.md

## Purpose
Rules for testing, verification, and clean data handling.

## Test Principle
- Test on real test infrastructure.
- Do not fake business outcomes.
- Do not claim success without running verification.

## Data Rules
- Use actual database test records.
- Create real test users, schools, and entities as needed.
- Clean up everything after the test.
- Leave the test database clean after completion.
- Use rollback, teardown, or explicit cleanup, but never leave residue.

## What Must Be Tested
- Core business logic.
- Tenant isolation.
- Soft delete behavior.
- Audit logging.
- Validation errors.
- Critical user flows.

## Verification Gate
Before reporting done, run the relevant checks:
- TypeScript compile.
- Lint.
- Unit tests for the touched domain.
- Integration test for API or tenancy.
- Cleanup verification.

## Test Quality
- Test behavior, not implementation detail.
- Use deterministic fixtures only when they reflect real data shape.
- Prefer failure cases as well as happy path.
- Do not rely on mock business logic for core flows.

## Forbidden
- No fake pass conditions.
- No disabled tests as a shortcut.
- No leaving behind seed noise.
- No skipping cleanup after creating test data.

## Done Criteria
A task is only done when:
- tests pass,
- cleanup is complete,
- and the affected area remains consistent with project rules.
