import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/index.js';

const PREFIX = `KM_TEST_P8_${Date.now()}`;
const money = (value: string): Prisma.Decimal => new Prisma.Decimal(value);

describe('Phase 8: Health', () => {
  let schoolId: string;
  let yearId: string;
  let relationshipId: string;
  let healthId: string;

  beforeAll(async () => {
    const school = await prisma.school.create({ data: { code: `${PREFIX}_CODE`, slug: `${PREFIX.toLowerCase()}-slug`, name: PREFIX } });
    schoolId = school.id;
    const year = await prisma.schoolYear.create({ data: { schoolId, name: PREFIX, startDate: new Date('2026-09-01'), endDate: new Date('2027-05-31') } });
    yearId = year.id;
    const student = await prisma.student.create({ data: { firstName: 'KM_TEST', lastName: PREFIX, gender: 'MALE', dateOfBirth: new Date('2021-01-01') } });
    const relationship = await prisma.studentSchoolRelationship.create({ data: { studentId: student.id, schoolId, schoolYearId: yearId } });
    relationshipId = relationship.id;
  });

  afterAll(async () => {
    await prisma.healthRecord.deleteMany({ where: { schoolId } });
    await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId } });
    await prisma.schoolYear.deleteMany({ where: { schoolId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
  });

  it('inserts health record and calculates bmi', async () => {
    const created = await prisma.healthRecord.create({
      data: {
        schoolId,
        studentSchoolRelationshipId: relationshipId,
        heightCm: money('110.0'),
        weightKg: money('20.0'),
        bmi: money('16.5'),
        measuredAt: new Date('2026-09-06T00:00:00Z'),
        recordedBy: 'KM_TEST_USER',
        whoReference: 'WHO 2006',
      },
    });
    healthId = created.id;
    expect(created.whoReference).toBe('WHO 2006');
    expect(created.bmi.toString()).toBe('16.5');
  });

  it('validates bmi math', async () => {
    const record = await prisma.healthRecord.findUnique({ where: { id: healthId } });
    expect(record).not.toBeNull();
    expect(record?.heightCm.toString()).toBe('110');
    expect(record?.weightKg.toString()).toBe('20');
    expect(Number(record?.bmi)).toBeCloseTo(16.5, 1);
  });
});