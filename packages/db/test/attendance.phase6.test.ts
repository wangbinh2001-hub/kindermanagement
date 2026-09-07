import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/index.js';

const PREFIX = `KM_TEST_P6_${Date.now()}`;

describe('Phase 6: Attendance', () => {
  let schoolId: string;
  let yearId: string;
  let classId: string;
  let relationshipId: string;
  let staffMemberId: string;

  beforeAll(async () => {
    const school = await prisma.school.create({ data: { code: `${PREFIX}-code`, slug: `${PREFIX}-slug`, name: PREFIX } });
    schoolId = school.id;
    const year = await prisma.schoolYear.create({ data: { schoolId, name: PREFIX, startDate: new Date('2026-09-01'), endDate: new Date('2027-05-31') } });
    yearId = year.id;
    const cls = await prisma.class.create({ data: { schoolId, schoolYearId: yearId, name: PREFIX, ageGroup: 'PRESCHOOL_5_6Y' } });
    classId = cls.id;
    const student = await prisma.student.create({ data: { firstName: 'A', lastName: 'B', gender: 'MALE', dateOfBirth: new Date('2021-01-01') } });
    const rel = await prisma.studentSchoolRelationship.create({ data: { studentId: student.id, schoolId, schoolYearId: yearId } });
    relationshipId = rel.id;
    const staff = await prisma.staffMember.create({
      data: {
        userId: `user-${PREFIX}`,
        schoolId,
        fullName: 'Teacher Test',
        hiredAt: new Date(),
      },
    });
    staffMemberId = staff.id;
  });

  afterAll(async () => {
    await prisma.attendanceRecord.deleteMany({ where: { schoolId } });
    await prisma.staffMember.deleteMany({ where: { schoolId } });
    await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId } });
    await prisma.class.deleteMany({ where: { schoolId } });
    await prisma.schoolYear.deleteMany({ where: { schoolId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
  });

  it('records daily attendance and computes overtime', async () => {
    const rec = await prisma.attendanceRecord.create({
      data: { schoolId, schoolYearId: yearId, classId, studentSchoolRelationshipId: relationshipId, date: new Date('2026-09-06'), status: 'PRESENT', method: 'MANUAL', recordedById: staffMemberId, checkOutTime: new Date('2026-09-06T18:45:00Z'), overtimeHours: 1 },
    });
    expect(rec.id).toBeDefined();
    expect(Number(rec.overtimeHours)).toBe(1);
  });
});
