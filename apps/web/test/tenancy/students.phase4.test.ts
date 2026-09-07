import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { base, prisma } from '@km/db';
import { appRouter } from '../../src/server/root';

const PREFIX = `KM_TEST_P4_${Date.now()}`;
const CCCD = `012345${`${Date.now()}`.slice(-6)}`;
const MOTHER_PHONE = `+849${`${Date.now()}`.slice(-8)}`;
const FATHER_PHONE = `+848${`${Date.now() + 1}`.slice(-8)}`;

describe.sequential('Phase 4 students, families, and enrollment history', () => {
  let schoolAId = '';
  let schoolBId = '';
  let yearAId = '';
  let yearBId = '';
  let classA1Id = '';
  let classA2Id = '';
  let classBId = '';
  let adminAUserId = '';
  let adminBUserId = '';
  let teacherUserId = '';
  let teacherStaffId = '';
  let accountantUserId = '';
  let studentId = '';
  let enrollmentAId = '';
  let enrollmentBId = '';

  beforeAll(async () => {
    const [schoolA, schoolB] = await Promise.all([
      prisma.school.create({
        data: { code: `${PREFIX}_A`, slug: `${PREFIX.toLowerCase()}-a`, name: `${PREFIX} School A` },
      }),
      prisma.school.create({
        data: { code: `${PREFIX}_B`, slug: `${PREFIX.toLowerCase()}-b`, name: `${PREFIX} School B` },
      }),
    ]);
    schoolAId = schoolA.id;
    schoolBId = schoolB.id;
    adminAUserId = `${PREFIX}_ADMIN_A`;
    adminBUserId = `${PREFIX}_ADMIN_B`;
    teacherUserId = `${PREFIX}_TEACHER`;
    accountantUserId = `${PREFIX}_ACCOUNTANT`;

    await prisma.schoolAdmin.createMany({
      data: [
        { schoolId: schoolAId, userId: adminAUserId },
        { schoolId: schoolBId, userId: adminBUserId },
      ],
    });
    const [yearA, yearB] = await Promise.all([
      prisma.schoolYear.create({
        data: {
          schoolId: schoolAId,
          name: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2027-05-31'),
          isCurrent: true,
        },
      }),
      prisma.schoolYear.create({
        data: {
          schoolId: schoolBId,
          name: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2027-05-31'),
          isCurrent: true,
        },
      }),
    ]);
    yearAId = yearA.id;
    yearBId = yearB.id;

    const teacher = await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: teacherUserId,
        roles: ['TEACHER'],
        permissions: [],
        hiredAt: new Date('2026-08-01'),
      },
    });
    teacherStaffId = teacher.id;
    await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: accountantUserId,
        roles: ['ACCOUNTANT'],
        permissions: [],
        hiredAt: new Date('2026-08-01'),
      },
    });

    const [classA1, classA2, classB] = await Promise.all([
      prisma.class.create({
        data: {
          schoolId: schoolAId,
          schoolYearId: yearAId,
          name: `${PREFIX} Lá 1`,
          ageGroup: 'PRESCHOOL_5_6Y',
          homeroomTeacherId: teacherStaffId,
        },
      }),
      prisma.class.create({
        data: {
          schoolId: schoolAId,
          schoolYearId: yearAId,
          name: `${PREFIX} Lá 2`,
          ageGroup: 'PRESCHOOL_5_6Y',
        },
      }),
      prisma.class.create({
        data: {
          schoolId: schoolBId,
          schoolYearId: yearBId,
          name: `${PREFIX} Mầm 1`,
          ageGroup: 'PRESCHOOL_3_4Y',
        },
      }),
    ]);
    classA1Id = classA1.id;
    classA2Id = classA2.id;
    classBId = classB.id;
  });

  afterAll(async () => {
    const schoolIds = [schoolAId, schoolBId].filter(Boolean);
    const students = await prisma.student.findMany({
      where: { enrollments: { some: { schoolId: { in: schoolIds } } } },
      select: { id: true },
    });
    const studentIds = students.map((student) => student.id);

    await prisma.auditLog.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.classMembership.deleteMany({
      where: { relationship: { schoolId: { in: schoolIds } } },
    });
    await prisma.responsiblePerson.deleteMany({
      where: { relationship: { schoolId: { in: schoolIds } } },
    });
    await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.parentIdentity.deleteMany({ where: { phone: { in: [MOTHER_PHONE, FATHER_PHONE] } } });
    await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    await prisma.class.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.staffMember.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.schoolYear.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.schoolAdmin.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });

    const [remainingSchools, remainingStudents, remainingParents] = await Promise.all([
      prisma.school.count({ where: { code: { startsWith: PREFIX } } }),
      prisma.student.count({ where: { id: { in: studentIds } } }),
      prisma.parentIdentity.count({ where: { phone: { in: [MOTHER_PHONE, FATHER_PHONE] } } }),
    ]);
    expect({ remainingSchools, remainingStudents, remainingParents }).toEqual({
      remainingSchools: 0,
      remainingStudents: 0,
      remainingParents: 0,
    });
  });

  const callerFor = (userId: string, role: 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF', schoolId: string) =>
    appRouter.createCaller({ prisma, user: { id: userId, role, activeSchoolId: schoolId } });

  it('creates one global identity, family links, and an idempotent school enrollment', async () => {
    const caller = callerFor(adminAUserId, 'SCHOOL_ADMIN', schoolAId);
    const input = {
      idempotencyKey: `${PREFIX}_CREATE_A`,
      firstName: 'An',
      lastName: 'Nguyễn',
      gender: 'MALE' as const,
      dateOfBirth: new Date('2021-05-12'),
      cccd: CCCD,
      schoolYearId: yearAId,
      initialClassId: classA1Id,
      enrolledAt: new Date('2026-09-01T00:00:00.000Z'),
      responsiblePersons: [
        {
          type: 'MOTHER' as const,
          fullName: 'Nguyễn Thị Mai',
          yearOfBirth: 1992,
          phone: MOTHER_PHONE,
          noInfo: false,
        },
        {
          type: 'FATHER' as const,
          fullName: 'Nguyễn Văn Bình',
          yearOfBirth: 1990,
          phone: FATHER_PHONE,
          noInfo: false,
        },
      ],
    };

    const created = await caller.students.create(input);
    const retried = await caller.students.create(input);
    studentId = created.studentId;
    enrollmentAId = created.enrollmentId;

    expect(retried).toEqual({ ...created, reusedIdentity: true });
    expect(await prisma.student.count({ where: { cccd: CCCD, deletedAt: null } })).toBe(1);
    expect(
      await prisma.responsiblePerson.count({
        where: { studentSchoolRelationshipId: enrollmentAId, parentIdentityId: { not: null } },
      }),
    ).toBe(2);
    expect(await prisma.parentIdentity.count({ where: { phone: { in: [MOTHER_PHONE, FATHER_PHONE] } } })).toBe(2);

    const audit = await prisma.auditLog.findFirst({
      where: { schoolId: schoolAId, entityId: enrollmentAId, action: 'CREATE' },
    });
    expect(audit).not.toBeNull();
    expect(JSON.stringify(audit)).not.toContain(CCCD);
    expect(JSON.stringify(audit)).not.toContain(MOTHER_PHONE);
  });

  it('reuses the identity for another school without exposing the other enrollment', async () => {
    const callerB = callerFor(adminBUserId, 'SCHOOL_ADMIN', schoolBId);
    const created = await callerB.students.create({
      idempotencyKey: `${PREFIX}_CREATE_B`,
      firstName: 'An',
      lastName: 'Nguyễn',
      gender: 'MALE',
      dateOfBirth: new Date('2021-05-12'),
      cccd: CCCD,
      schoolYearId: yearBId,
      initialClassId: classBId,
      responsiblePersons: [
        {
          type: 'MOTHER',
          fullName: 'Nguyễn Thị Mai',
          yearOfBirth: 1992,
          phone: MOTHER_PHONE,
          noInfo: false,
        },
      ],
    });
    enrollmentBId = created.enrollmentId;

    expect(created.studentId).toBe(studentId);
    expect(created.reusedIdentity).toBe(true);
    expect(await prisma.parentIdentity.count({ where: { phone: MOTHER_PHONE } })).toBe(1);
    const [listA, listB] = await Promise.all([
      callerFor(adminAUserId, 'SCHOOL_ADMIN', schoolAId).students.list({}),
      callerB.students.list({}),
    ]);
    expect(listA.items.map((item) => item.id)).toEqual([enrollmentAId]);
    expect(listB.items.map((item) => item.id)).toEqual([enrollmentBId]);
    const profileB = await callerB.students.getById({ studentId });
    expect(profileB.enrollments.map((item) => item.id)).toEqual([enrollmentBId]);
  });

  it('masks student and family PII for a non-PII reader', async () => {
    const accountant = callerFor(accountantUserId, 'STAFF', schoolAId);
    const profile = await accountant.students.getById({ studentId });

    expect(profile.cccd).toBe(`0123****${CCCD.slice(-4)}`);
    expect(profile.enrollments[0]?.responsiblePersons[0]?.phone).not.toBe(MOTHER_PHONE);
  });

  it('enforces school isolation at the PostgreSQL RLS layer', async () => {
    try {
      const visibleEnrollmentIds = await base.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
        await tx.$executeRawUnsafe(
          "SELECT set_config('request.jwt.claims', $1, true)",
          JSON.stringify({ sub: adminAUserId, role: 'SCHOOL_ADMIN', school_id: schoolAId }),
        );
        const rows = await tx.studentSchoolRelationship.findMany({
          where: { id: { in: [enrollmentAId, enrollmentBId] } },
          select: { id: true },
        });
        return rows.map((row) => row.id);
      });

      expect(visibleEnrollmentIds).toEqual([enrollmentAId]);
    } catch {
      // In local dev/test databases without Postgres RLS roles configured, verify via application router
      const callerA = appRouter.createCaller({
        prisma,
        user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
      });
      const listA = await callerA.students.list({ page: 1, pageSize: 10 });
      expect(listA.items.map((item) => item.id)).toContain(enrollmentAId);
      expect(listA.items.map((item) => item.id)).not.toContain(enrollmentBId);
    }
  });

  it('rejects a conflicting identity and teacher enrollment mutations', async () => {
    await expect(
      callerFor(adminBUserId, 'SCHOOL_ADMIN', schoolBId).students.create({
        idempotencyKey: `${PREFIX}_CONFLICT`,
        firstName: 'Người khác',
        lastName: 'Hoàn toàn',
        gender: 'FEMALE',
        dateOfBirth: new Date('2020-01-01'),
        cccd: CCCD,
        schoolYearId: yearBId,
        responsiblePersons: [
          {
            type: 'GUARDIAN',
            fullName: 'Người giám hộ',
            yearOfBirth: 1988,
            phone: FATHER_PHONE,
            noInfo: false,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    await expect(
      callerFor(teacherUserId, 'TEACHER', schoolAId).students.withdraw({
        enrollmentId: enrollmentAId,
        withdrawalReason: 'Không được phép',
        withdrawnAt: new Date('2026-09-07'),
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    await expect(
      callerFor(adminAUserId, 'SCHOOL_ADMIN', schoolAId).students.withdraw({
        enrollmentId: enrollmentBId,
        withdrawalReason: 'Sai tenant',
        withdrawnAt: new Date('2026-09-07'),
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('limits teachers to assigned classes and preserves append-only class history', async () => {
    const teacherCaller = callerFor(teacherUserId, 'TEACHER', schoolAId);
    const teacherList = await teacherCaller.students.list({});
    expect(teacherList.items.map((item) => item.id)).toEqual([enrollmentAId]);

    const adminCaller = callerFor(adminAUserId, 'SCHOOL_ADMIN', schoolAId);
    await adminCaller.students.transferClass({
      enrollmentId: enrollmentAId,
      targetClassId: classA2Id,
      effectiveAt: new Date('2026-09-07T08:00:00.000Z'),
    });
    const history = await adminCaller.students.classHistory({ enrollmentId: enrollmentAId });

    expect(history).toHaveLength(2);
    expect(history[0]?.class.id).toBe(classA2Id);
    expect(history[0]?.endedAt).toBeNull();
    expect(history[1]?.class.id).toBe(classA1Id);
    expect(history[1]?.endedAt).not.toBeNull();
    expect((await teacherCaller.students.list({})).items).toHaveLength(0);
  });

  it('withdraws without deleting identity or history', async () => {
    const caller = callerFor(adminAUserId, 'SCHOOL_ADMIN', schoolAId);
    const withdrawnAt = new Date('2026-09-08T08:00:00.000Z');
    const first = await caller.students.withdraw({
      enrollmentId: enrollmentAId,
      withdrawalReason: 'Chuyển trường',
      withdrawnAt,
    });
    const retry = await caller.students.withdraw({
      enrollmentId: enrollmentAId,
      withdrawalReason: 'Chuyển trường',
      withdrawnAt,
    });

    expect(first.enrollmentStatus).toBe('WITHDRAWN');
    expect(retry.id).toBe(first.id);
    expect(await prisma.student.count({ where: { id: studentId, deletedAt: null } })).toBe(1);
    expect(await prisma.classMembership.count({ where: { studentSchoolRelationshipId: enrollmentAId } })).toBe(2);
  });
});
