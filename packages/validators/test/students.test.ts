import { describe, expect, it } from 'vitest';
import {
  createStudentSchema,
  transferStudentClassSchema,
} from '../src/schemas/students.js';

const validStudent = {
  firstName: 'An',
  lastName: 'Nguyễn',
  gender: 'MALE' as const,
  dateOfBirth: '2021-05-12',
  idempotencyKey: 'student-create-001',
  schoolYearId: 'school-year-1',
  responsiblePersons: [
    {
      type: 'MOTHER' as const,
      fullName: 'Nguyễn Thị Mai',
      yearOfBirth: 1992,
      phone: '090 123 4567',
    },
  ],
};

describe('createStudentSchema', () => {
  it('normalizes authoritative identifiers and Vietnamese phone numbers', () => {
    const result = createStudentSchema.parse({
      ...validStudent,
      cccd: ' 0123 4567 8901 ',
    });

    expect(result.cccd).toBe('012345678901');
    expect(result.responsiblePersons[0]?.phone).toBe('+84901234567');
  });

  it('rejects an invalid CCCD', () => {
    const result = createStudentSchema.safeParse({
      ...validStudent,
      cccd: '12345',
    });

    expect(result.success).toBe(false);
  });

  it('requires at least one complete responsible person', () => {
    const result = createStudentSchema.safeParse({
      ...validStudent,
      responsiblePersons: [
        { type: 'FATHER', fullName: 'Nguyễn Văn Bình', noInfo: false },
        { type: 'MOTHER', noInfo: true },
        { type: 'GUARDIAN', noInfo: true },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects duplicate responsible-person sections', () => {
    const result = createStudentSchema.safeParse({
      ...validStudent,
      responsiblePersons: [
        ...validStudent.responsiblePersons,
        { ...validStudent.responsiblePersons[0] },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe('transferStudentClassSchema', () => {
  it('requires an effective date and target class', () => {
    const result = transferStudentClassSchema.parse({
      enrollmentId: 'enrollment-1',
      targetClassId: 'class-2',
      effectiveAt: '2026-09-07T08:00:00.000Z',
    });

    expect(result.effectiveAt).toBeInstanceOf(Date);
  });
});
