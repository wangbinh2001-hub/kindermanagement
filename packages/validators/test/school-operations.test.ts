import { describe, it, expect } from 'vitest';
import {
  createSchoolYearSchema,
  createClassSchema,
  AgeGroupEnum,
  updateSchoolProfileSchema,
  updateSchoolSettingsSchema,
} from '../src/index.js';

describe('Phase 3 schemas', () => {
  it('validates school year creation', () => {
    const valid = createSchoolYearSchema.safeParse({
      name: '2026-2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-05-31'),
    });
    expect(valid.success).toBe(true);
  });

  it('validates class creation with enum', () => {
    const valid = createClassSchema.safeParse({
      schoolYearId: '11111111-1111-4111-8111-111111111111',
      name: 'Lớp Chồi 1',
      ageGroup: AgeGroupEnum.enum.PRESCHOOL_4_5Y,
      capacity: 35,
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid capacity', () => {
    const invalid = createClassSchema.safeParse({
      schoolYearId: '11111111-1111-4111-8111-111111111111',
      name: 'Lớp Chồi 1',
      ageGroup: AgeGroupEnum.enum.PRESCHOOL_4_5Y,
      capacity: 200,
    });
    expect(invalid.success).toBe(false);
  });

  it('validates school profile update', () => {
    const valid = updateSchoolProfileSchema.safeParse({
      name: 'Trường Mầm Non Hoa Mai',
      phone: '024 3823 4567',
      email: 'contact@hoamai.edu.vn',
      taxCode: '0101234567',
    });
    expect(valid.success).toBe(true);
  });

  it('validates school settings update', () => {
    const valid = updateSchoolSettingsSchema.safeParse({
      enableAttendance: true,
      enableNutrition: false,
    });
    expect(valid.success).toBe(true);
  });
});
