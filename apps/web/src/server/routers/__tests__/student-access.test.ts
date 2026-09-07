import { describe, expect, it } from 'vitest';
import {
  canManageStudents,
  canReadStudentPii,
  maskCitizenId,
  maskPhone,
} from '../student-access.js';

describe('student permissions', () => {
  it('allows School Admin to manage students', () => {
    expect(canManageStudents({ role: 'SCHOOL_ADMIN', roles: [], permissions: [] })).toBe(true);
  });

  it('does not allow a teacher to manage student enrollment by default', () => {
    expect(canManageStudents({ role: 'TEACHER', roles: ['TEACHER'], permissions: [] })).toBe(false);
  });

  it('honors an explicit students:manage grant', () => {
    expect(
      canManageStudents({ role: 'STAFF', roles: ['OTHER'], permissions: ['students:manage'] }),
    ).toBe(true);
  });

  it('limits full PII to School Admin, assigned teachers, or an explicit grant', () => {
    expect(canReadStudentPii({ role: 'STAFF', roles: ['ACCOUNTANT'], permissions: [] })).toBe(false);
    expect(canReadStudentPii({ role: 'TEACHER', roles: ['TEACHER'], permissions: [] })).toBe(true);
    expect(
      canReadStudentPii({ role: 'STAFF', roles: ['NURSE'], permissions: ['students:pii_read'] }),
    ).toBe(true);
  });
});

describe('student PII masking', () => {
  it('masks citizen IDs and phone numbers without changing empty values', () => {
    expect(maskCitizenId('012345678901')).toBe('0123****8901');
    expect(maskPhone('+84901234567')).toBe('+849****4567');
    expect(maskCitizenId(null)).toBeNull();
  });
});
