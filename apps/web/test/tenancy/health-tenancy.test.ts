import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@km/db';
import { appRouter } from '../../src/server/root';
import { TRPCError } from '@trpc/server';

const PREFIX = `KM_TEST_HEALTH_${Date.now()}`;

describe('Phase 8: Health Module — Tenancy Isolation & Teacher Authorization', () => {
  let schoolAId: string;
  let schoolBId: string;
  let schoolYearAId: string;
  let classAId: string;
  let classBId: string;

  let adminAUserId: string;
  let adminBUserId: string;
  let teacherAssignedId: string;
  let teacherUnassignedId: string;
  let staffUserId: string;

  let studentAId: string;
  let relationshipAId: string;

  beforeAll(async () => {
    // 1. Create School A & B
    const schoolA = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH_A`,
        slug: `${PREFIX.toLowerCase()}-sch-a`,
        name: `${PREFIX} School A`,
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH_B`,
        slug: `${PREFIX.toLowerCase()}-sch-b`,
        name: `${PREFIX} School B`,
      },
    });
    schoolBId = schoolB.id;

    // 2. Create School Year in School A
    const syA = await prisma.schoolYear.create({
      data: {
        schoolId: schoolAId,
        name: `${PREFIX} 2025-2026`,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-05-31'),
        isCurrent: true,
      },
    });
    schoolYearAId = syA.id;

    // 3. Create Users & Staff/Admin records
    adminAUserId = `admin_a_${Date.now()}`;
    adminBUserId = `admin_b_${Date.now()}`;
    teacherAssignedId = `teacher_assigned_${Date.now()}`;
    teacherUnassignedId = `teacher_unassigned_${Date.now()}`;
    staffUserId = `staff_${Date.now()}`;

    await prisma.schoolAdmin.create({
      data: { schoolId: schoolAId, userId: adminAUserId },
    });
    await prisma.schoolAdmin.create({
      data: { schoolId: schoolBId, userId: adminBUserId },
    });
    await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: teacherAssignedId,
        hiredAt: new Date(),
        roles: ['TEACHER'],
      },
    });
    await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: teacherUnassignedId,
        hiredAt: new Date(),
        roles: ['TEACHER'],
      },
    });
    await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: staffUserId,
        hiredAt: new Date(),
        roles: ['STAFF'],
      },
    });

    // 4. Create Class 1 (Assigned to teacherAssignedId) & Class 2 in School A
    const clsA = await prisma.class.create({
      data: {
        schoolId: schoolAId,
        schoolYearId: schoolYearAId,
        name: `${PREFIX} Mầm 1`,
        ageGroup: 'PRESCHOOL_3_4Y',
        homeroomTeacherId: teacherAssignedId,
      },
    });
    classAId = clsA.id;

    const clsB = await prisma.class.create({
      data: {
        schoolId: schoolAId,
        schoolYearId: schoolYearAId,
        name: `${PREFIX} Chồi 1`,
        ageGroup: 'PRESCHOOL_4_5Y',
        homeroomTeacherId: 'other_teacher',
      },
    });
    classBId = clsB.id;

    // 5. Create Student in School A (Age 4 years = 48 months, Male)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 4);

    const student = await prisma.student.create({
      data: {
        firstName: 'An',
        lastName: 'Nguyễn Văn',
        gender: 'MALE',
        dateOfBirth: birthDate,
      },
    });
    studentAId = student.id;

    const relationship = await prisma.studentSchoolRelationship.create({
      data: {
        studentId: studentAId,
        schoolId: schoolAId,
        schoolYearId: schoolYearAId,
        enrollmentStatus: 'ACTIVE',
        currentClassId: classAId,
      },
    });
    relationshipAId = relationship.id;

    await prisma.classMembership.create({
      data: {
        studentSchoolRelationshipId: relationshipAId,
        classId: classAId,
        schoolYearId: schoolYearAId,
        startedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    await prisma.auditLog.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.healthRecord.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.classMembership.deleteMany({
      where: { classId: { in: [classAId, classBId] } },
    });
    await prisma.studentSchoolRelationship.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    if (studentAId) {
      await prisma.student.deleteMany({
        where: { id: studentAId },
      });
    }
    await prisma.class.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.schoolYear.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.staffMember.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.schoolAdmin.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [schoolAId, schoolBId] } },
    });
  });

  it('School Admin A can record health measurement for student in School A', async () => {
    const caller = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    const record = await caller.health.createRecord({
      studentSchoolRelationshipId: relationshipAId,
      classId: classAId,
      heightCm: 102.5,
      weightKg: 16.0,
      measuredAt: new Date(),
      notes: 'Khám định kỳ đầu năm',
    });

    expect(record).toBeDefined();
    expect(record.schoolId).toBe(schoolAId);
    expect(Number(record.heightCm)).toBe(102.5);
    expect(Number(record.weightKg)).toBe(16.0);
    expect(record.bmiCategory).toBe('NORMAL');
    expect(record.whoReference).toContain('WHO 2006');

    // Verify Audit Log
    const audit = await prisma.auditLog.findFirst({
      where: {
        schoolId: schoolAId,
        action: 'CREATE_HEALTH_RECORD',
        entityId: record.id,
      },
    });
    expect(audit).not.toBeNull();
    expect(audit?.userId).toBe(adminAUserId);
  });

  it('School Admin B cannot access or record health measurement for School A student (Tenancy Boundary)', async () => {
    const callerB = appRouter.createCaller({
      prisma,
      user: { id: adminBUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolBId },
    });

    await expect(
      callerB.health.createRecord({
        studentSchoolRelationshipId: relationshipAId,
        heightCm: 105.0,
        weightKg: 17.0,
        measuredAt: new Date(),
      })
    ).rejects.toThrow(TRPCError);

    // Caller B querying history of student in School A gets empty
    const historyB = await callerB.health.getHistory({
      studentSchoolRelationshipId: relationshipAId,
    });
    expect(historyB).toHaveLength(0);
  });

  it('Assigned Teacher can record health measurement for student in their class', async () => {
    const callerTeacher = appRouter.createCaller({
      prisma,
      user: { id: teacherAssignedId, role: 'TEACHER', activeSchoolId: schoolAId },
    });

    const record = await callerTeacher.health.createRecord({
      studentSchoolRelationshipId: relationshipAId,
      classId: classAId,
      heightCm: 103.0,
      weightKg: 16.3,
      measuredAt: new Date(),
      notes: 'Đo lần 2 giữa kỳ',
    });

    expect(record).toBeDefined();
    expect(record.recordedBy).toBe(teacherAssignedId);
  });

  it('Unassigned Teacher is denied permission (FORBIDDEN) when recording for student outside assigned class', async () => {
    const callerUnassigned = appRouter.createCaller({
      prisma,
      user: { id: teacherUnassignedId, role: 'TEACHER', activeSchoolId: schoolAId },
    });

    try {
      await callerUnassigned.health.createRecord({
        studentSchoolRelationshipId: relationshipAId,
        classId: classAId,
        heightCm: 104.0,
        weightKg: 16.5,
        measuredAt: new Date(),
      });
      expect.unreachable('Should have thrown FORBIDDEN');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe('FORBIDDEN');
    }
  });

  it('Non-teacher/admin staff is denied permission (FORBIDDEN)', async () => {
    const callerStaff = appRouter.createCaller({
      prisma,
      user: { id: staffUserId, role: 'STAFF', activeSchoolId: schoolAId },
    });

    try {
      await callerStaff.health.createRecord({
        studentSchoolRelationshipId: relationshipAId,
        heightCm: 104.0,
        weightKg: 16.5,
        measuredAt: new Date(),
      });
      expect.unreachable('Should have thrown FORBIDDEN');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe('FORBIDDEN');
    }
  });

  it('Health records are strictly append-only (chronological progression)', async () => {
    const caller = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    const history = await caller.health.getHistory({
      studentSchoolRelationshipId: relationshipAId,
    });

    // We recorded 2 measurements earlier; both must exist
    expect(history.length).toBeGreaterThanOrEqual(2);
    // Chronologically sorted asc
    for (let i = 1; i < history.length; i++) {
      expect(new Date(history[i]!.measuredAt).getTime()).toBeGreaterThanOrEqual(
        new Date(history[i - 1]!.measuredAt).getTime()
      );
    }
  });
});
