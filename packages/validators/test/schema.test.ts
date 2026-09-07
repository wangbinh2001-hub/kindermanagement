import { describe, it, expect } from 'vitest';
import { activeSchoolContextSchema } from '../src/index.js';

describe('activeSchoolContextSchema', () => {
  it('accepts a valid context with active school', () => {
    const result = activeSchoolContextSchema.safeParse({
      activeSchoolId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      actorRole: 'SCHOOL_ADMIN',
    });
    expect(result.success).toBe(true);
  });

  it('accepts SYSTEM_ADMIN with null activeSchoolId', () => {
    const result = activeSchoolContextSchema.safeParse({
      activeSchoolId: null,
      userId: '22222222-2222-4222-8222-222222222222',
      actorRole: 'SYSTEM_ADMIN',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid activeSchoolId', () => {
    const result = activeSchoolContextSchema.safeParse({
      activeSchoolId: 'not-uuid',
      userId: '22222222-2222-4222-8222-222222222222',
      actorRole: 'SCHOOL_ADMIN',
    });
    expect(result.success).toBe(false);
  });
});
