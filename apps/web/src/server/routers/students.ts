import { Prisma, prisma } from '@km/db';
import {
  createStudentSchema,
  enrollmentByIdSchema,
  studentByIdSchema,
  studentListFilterSchema,
  transferStudentClassSchema,
  updateEnrollmentSchema,
  updateResponsiblePersonsSchema,
  updateStudentGlobalSchema,
  withdrawStudentSchema,
} from '@km/validators/schemas/students';
import { TRPCError } from '@trpc/server';
import type { UserContext } from '../context';
import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import {
  canManageClassMembership,
  canManageStudents,
  canReadStudentPii,
  canReadStudents,
  maskCitizenId,
  maskPhone,
} from './student-access';

type StudentAccess = {
  role: UserContext['role'];
  roles: string[];
  permissions: string[];
  staffId: string | null;
  assignedClassIds: string[];
  classScoped: boolean;
};

async function getStudentAccess(
  user: NonNullable<UserContext>,
): Promise<StudentAccess> {
  if (user.role === 'SCHOOL_ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return {
      role: user.role,
      roles: [],
      permissions: [],
      staffId: null,
      assignedClassIds: [],
      classScoped: false,
    };
  }

  const staff = await prisma.staffMember.findFirst({
    where: {
      userId: user.id,
      schoolId: user.activeSchoolId ?? undefined,
      employmentStatus: 'ACTIVE',
      deletedAt: null,
    },
    select: { id: true, roles: true, permissions: true },
  });

  if (!staff) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Không có quyền truy cập hồ sơ học sinh' });
  }

  const classScoped =
    user.role === 'TEACHER' ||
    staff.roles.some((role) => role === 'TEACHER' || role === 'ASSISTANT_TEACHER');
  const assignedClasses = classScoped
    ? await prisma.class.findMany({
        where: {
          schoolId: user.activeSchoolId ?? undefined,
          deletedAt: null,
          OR: [
            { homeroomTeacherId: staff.id },
            { assistantTeacherIds: { has: staff.id } },
          ],
        },
        select: { id: true },
      })
    : [];

  return {
    role: user.role,
    roles: staff.roles,
    permissions: staff.permissions,
    staffId: staff.id,
    assignedClassIds: assignedClasses.map((item) => item.id),
    classScoped,
  };
}

function requireStudentRead(access: StudentAccess): void {
  if (!canReadStudents(access)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Không có quyền xem học sinh' });
  }
}

function requireStudentManage(access: StudentAccess): void {
  if (!canManageStudents(access)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Không có quyền quản lý học sinh' });
  }
}

function assertClassScope(access: StudentAccess, classId: string | null): void {
  if (access.classScoped && (!classId || !access.assignedClassIds.includes(classId))) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Học sinh không thuộc lớp được phân công' });
  }
}

function normalizeIdentityText(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('vi-VN');
}

function isSameStudentIdentity(
  existing: { firstName: string; middleName: string | null; lastName: string; dateOfBirth: Date },
  incoming: { firstName: string; middleName?: string; lastName: string; dateOfBirth: Date },
): boolean {
  const existingName = [existing.lastName, existing.middleName, existing.firstName]
    .filter(Boolean)
    .join(' ');
  const incomingName = [incoming.lastName, incoming.middleName, incoming.firstName]
    .filter(Boolean)
    .join(' ');

  return (
    normalizeIdentityText(existingName) === normalizeIdentityText(incomingName) &&
    existing.dateOfBirth.toISOString().slice(0, 10) === incoming.dateOfBirth.toISOString().slice(0, 10)
  );
}

function maskStudent<T extends {
  cccd: string | null;
  personalIdNumber: string | null;
  passportNumber: string | null;
  phoneContact: string | null;
}>(student: T, revealPii: boolean): T {
  if (revealPii) return student;
  return {
    ...student,
    cccd: maskCitizenId(student.cccd),
    personalIdNumber: maskCitizenId(student.personalIdNumber),
    passportNumber: maskCitizenId(student.passportNumber),
    phoneContact: maskPhone(student.phoneContact),
  };
}

function maskResponsiblePerson<T extends { cccd: string | null; phone: string | null }>(
  person: T,
  revealPii: boolean,
): T {
  if (revealPii) return person;
  return {
    ...person,
    cccd: maskCitizenId(person.cccd),
    phone: maskPhone(person.phone),
  };
}

function auditLogData(input: {
    schoolId: string;
    userId: string;
    userRole: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
}): Prisma.AuditLogCreateInput {
  return {
    school: { connect: { id: input.schoolId } },
    userId: input.userId,
    userRole: input.userRole,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    ...(input.beforeJson === undefined ? {} : { beforeJson: input.beforeJson }),
    ...(input.afterJson === undefined ? {} : { afterJson: input.afterJson }),
  };
}

async function assertEnrollmentContext(
  schoolId: string,
  schoolYearId: string,
  classId?: string,
): Promise<void> {
  const schoolYear = await prisma.schoolYear.findFirst({
    where: { id: schoolYearId, schoolId, deletedAt: null },
    select: { id: true },
  });
  if (!schoolYear) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Năm học không thuộc trường hiện tại' });
  }

  if (classId) {
    const classroom = await prisma.class.findFirst({
      where: { id: classId, schoolId, schoolYearId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!classroom) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lớp học không thuộc năm học đã chọn' });
    }
  }
}

async function findMatchingStudent(
  identifiers: { cccd?: string; personalIdNumber?: string; passportNumber?: string },
) {
  const conditions: Prisma.StudentWhereInput[] = [];
  if (identifiers.cccd) conditions.push({ cccd: identifiers.cccd });
  if (identifiers.personalIdNumber) conditions.push({ personalIdNumber: identifiers.personalIdNumber });
  if (identifiers.passportNumber) conditions.push({ passportNumber: identifiers.passportNumber });
  if (conditions.length === 0) return null;

  const matches = await prisma.student.findMany({
    where: { deletedAt: null, OR: conditions },
    take: 2,
  });
  if (matches.length > 1) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Các giấy tờ định danh đang thuộc nhiều hồ sơ khác nhau',
    });
  }
  return matches[0] ?? null;
}

export const studentRouter = router({
  create: schoolProcedure.input(createStudentSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentManage(access);

    const existingRetry = await ctx.prisma.studentSchoolRelationship.findFirst({
      where: { schoolId, idempotencyKey: input.idempotencyKey },
      select: { id: true, studentId: true },
    });
    if (existingRetry) {
      return {
        studentId: existingRetry.studentId,
        enrollmentId: existingRetry.id,
        reusedIdentity: true,
      };
    }

    await assertEnrollmentContext(schoolId, input.schoolYearId, input.initialClassId);

    const {
      schoolYearId,
      initialClassId,
      enrolledAt,
      responsiblePersons,
      idempotencyKey,
      ...globalData
    } = input;
    const existingStudent = await findMatchingStudent({
      cccd: globalData.cccd,
      personalIdNumber: globalData.personalIdNumber,
      passportNumber: globalData.passportNumber,
    });

    if (existingStudent && !isSameStudentIdentity(existingStudent, globalData)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Thông tin định danh đã tồn tại nhưng không khớp họ tên hoặc ngày sinh',
      });
    }

    if (existingStudent) {
      const activeEnrollment = await ctx.prisma.studentSchoolRelationship.findFirst({
        where: {
          studentId: existingStudent.id,
          schoolId,
          enrollmentStatus: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
      });
      if (activeEnrollment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Học sinh đã có hồ sơ đang hoạt động tại trường',
        });
      }
    }

    return ctx.prisma.$transaction(async (tx) => {
      const student = existingStudent ?? (await tx.student.create({ data: globalData }));
      const enrollment = await tx.studentSchoolRelationship.create({
        data: {
          studentId: student.id,
          schoolId,
          schoolYearId,
          idempotencyKey,
          initialClassId,
          currentClassId: initialClassId,
          enrolledAt: enrolledAt ?? new Date(),
          enrollmentStatus: 'ACTIVE',
        },
      });

      let legacyParentIdentityId: string | undefined;
      for (const person of responsiblePersons) {
        let parentIdentityId: string | undefined;
        if (!person.noInfo && person.phone) {
          const existingParent = await tx.parentIdentity.findUnique({ where: { phone: person.phone } });
          const parent = existingParent
            ? existingParent.deletedAt
              ? await tx.parentIdentity.update({
                  where: { id: existingParent.id },
                  data: { deletedAt: null },
                })
              : existingParent
            : await tx.parentIdentity.create({ data: { phone: person.phone } });
          parentIdentityId = parent.id;
          legacyParentIdentityId ??= parent.id;
        }

        await tx.responsiblePerson.create({
          data: {
            studentSchoolRelationshipId: enrollment.id,
            type: person.type,
            fullName: person.fullName,
            yearOfBirth: person.yearOfBirth,
            occupation: person.occupation,
            phone: person.phone,
            cccd: person.cccd,
            noInfo: person.noInfo,
            parentIdentityId,
          },
        });
      }

      if (legacyParentIdentityId) {
        await tx.studentSchoolRelationship.update({
          where: { id: enrollment.id },
          data: { parentIdentityId: legacyParentIdentityId },
        });
      }

      if (initialClassId) {
        await tx.classMembership.create({
          data: {
            studentSchoolRelationshipId: enrollment.id,
            classId: initialClassId,
            schoolYearId,
            startedAt: enrolledAt ?? new Date(),
          },
        });
      }

      await tx.auditLog.create({ data: auditLogData({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'StudentSchoolRelationship',
        entityId: enrollment.id,
        action: 'CREATE',
        afterJson: {
          studentId: student.id,
          schoolYearId,
          classId: initialClassId ?? null,
          identityReused: Boolean(existingStudent),
          responsiblePersonTypes: responsiblePersons.map((person) => person.type),
        },
      }) });

      return {
        studentId: student.id,
        enrollmentId: enrollment.id,
        reusedIdentity: Boolean(existingStudent),
      };
    });
  }),

  list: schoolProcedure.input(studentListFilterSchema).query(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentRead(access);
    if (input.classId) assertClassScope(access, input.classId);

    const where: Prisma.StudentSchoolRelationshipWhereInput = {
      schoolId,
      deletedAt: null,
      ...(input.schoolYearId ? { schoolYearId: input.schoolYearId } : {}),
      ...(input.classId ? { currentClassId: input.classId } : {}),
      ...(input.enrollmentStatus ? { enrollmentStatus: input.enrollmentStatus } : {}),
      ...(access.classScoped ? { currentClassId: { in: access.assignedClassIds } } : {}),
      ...(input.search
        ? {
            student: {
              deletedAt: null,
              OR: [
                { firstName: { contains: input.search, mode: 'insensitive' } },
                { middleName: { contains: input.search, mode: 'insensitive' } },
                { lastName: { contains: input.search, mode: 'insensitive' } },
                ...(canReadStudentPii(access) ? [{ cccd: { contains: input.search } }] : []),
              ],
            },
          }
        : { student: { deletedAt: null } }),
    };

    const [items, total] = await Promise.all([
      ctx.prisma.studentSchoolRelationship.findMany({
        where,
        select: {
          id: true,
          enrollmentStatus: true,
          enrolledAt: true,
          withdrawnAt: true,
          schoolYear: { select: { id: true, name: true } },
          student: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              gender: true,
              dateOfBirth: true,
            },
          },
          classMemberships: {
            where: { endedAt: null },
            select: { class: { select: { id: true, name: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      ctx.prisma.studentSchoolRelationship.count({ where }),
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
  }),

  getById: schoolProcedure.input(studentByIdSchema).query(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentRead(access);

    const student = await ctx.prisma.student.findFirst({
      where: {
        id: input.studentId,
        deletedAt: null,
        enrollments: {
          some: {
            schoolId,
            deletedAt: null,
            ...(access.classScoped ? { currentClassId: { in: access.assignedClassIds } } : {}),
          },
        },
      },
      include: {
        enrollments: {
          where: { schoolId, deletedAt: null },
          include: {
            schoolYear: { select: { id: true, name: true } },
            responsiblePersons: {
              where: { deletedAt: null },
              orderBy: { type: 'asc' },
            },
            classMemberships: {
              include: { class: { select: { id: true, name: true } } },
              orderBy: { startedAt: 'desc' },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    });
    if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy học sinh' });

    const currentClassId = student.enrollments[0]?.currentClassId ?? null;
    assertClassScope(access, currentClassId);
    const revealPii = canReadStudentPii(access);

    return {
      ...maskStudent(student, revealPii),
      enrollments: student.enrollments.map((enrollment) => ({
        ...enrollment,
        responsiblePersons: enrollment.responsiblePersons.map((person) =>
          maskResponsiblePerson(person, revealPii),
        ),
      })),
    };
  }),

  updateGlobal: schoolProcedure.input(updateStudentGlobalSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentManage(access);

    const existing = await ctx.prisma.student.findFirst({
      where: {
        id: input.studentId,
        deletedAt: null,
        enrollments: { some: { schoolId, deletedAt: null } },
      },
    });
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy học sinh' });

    const { studentId, ...data } = input;
    const identityMatch = await findMatchingStudent({
      cccd: data.cccd,
      personalIdNumber: data.personalIdNumber,
      passportNumber: data.passportNumber,
    });
    if (identityMatch && identityMatch.id !== studentId) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Giấy tờ định danh đã thuộc hồ sơ khác' });
    }

    return ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({ where: { id: studentId }, data });
      await tx.auditLog.create({ data: auditLogData({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'Student',
        entityId: studentId,
        action: 'UPDATE',
        beforeJson: { changedFields: Object.keys(data) },
        afterJson: { changedFields: Object.keys(data) },
      }) });
      return updated;
    });
  }),

  updateRelationship: schoolProcedure.input(updateEnrollmentSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentManage(access);

    const before = await ctx.prisma.studentSchoolRelationship.findFirst({
      where: { id: input.enrollmentId, schoolId, deletedAt: null },
    });
    if (!before) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ nhập học' });

    return ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.studentSchoolRelationship.update({
        where: { id: input.enrollmentId },
        data: { enrollmentStatus: input.enrollmentStatus },
      });
      await tx.auditLog.create({ data: auditLogData({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'StudentSchoolRelationship',
        entityId: updated.id,
        action: 'UPDATE',
        beforeJson: { enrollmentStatus: before.enrollmentStatus },
        afterJson: { enrollmentStatus: updated.enrollmentStatus },
      }) });
      return updated;
    });
  }),

  updateResponsiblePersons: schoolProcedure
    .input(updateResponsiblePersonsSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId;
      const access = await getStudentAccess(ctx.user);
      requireStudentManage(access);

      const enrollment = await ctx.prisma.studentSchoolRelationship.findFirst({
        where: { id: input.enrollmentId, schoolId, deletedAt: null },
        select: { id: true },
      });
      if (!enrollment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ nhập học' });
      }

      return ctx.prisma.$transaction(async (tx) => {
        const current = await tx.responsiblePerson.findMany({
          where: { studentSchoolRelationshipId: input.enrollmentId, deletedAt: null },
        });
        const incomingTypes = input.responsiblePersons.map((person) => person.type);

        await tx.responsiblePerson.updateMany({
          where: {
            studentSchoolRelationshipId: input.enrollmentId,
            deletedAt: null,
            type: { notIn: incomingTypes },
          },
          data: { deletedAt: new Date() },
        });

        let legacyParentIdentityId: string | null = null;
        for (const person of input.responsiblePersons) {
          let parentIdentityId: string | null = null;
          if (!person.noInfo && person.phone) {
            const existingParent = await tx.parentIdentity.findUnique({ where: { phone: person.phone } });
            const parent = existingParent
              ? existingParent.deletedAt
                ? await tx.parentIdentity.update({
                    where: { id: existingParent.id },
                    data: { deletedAt: null },
                  })
                : existingParent
              : await tx.parentIdentity.create({ data: { phone: person.phone } });
            parentIdentityId = parent.id;
            legacyParentIdentityId ??= parent.id;
          }

          const data = {
            fullName: person.fullName,
            yearOfBirth: person.yearOfBirth,
            occupation: person.occupation,
            phone: person.phone,
            cccd: person.cccd,
            noInfo: person.noInfo,
            parentIdentityId,
            deletedAt: null,
          };
          const existingPerson = current.find((item) => item.type === person.type);
          if (existingPerson) {
            await tx.responsiblePerson.update({ where: { id: existingPerson.id }, data });
          } else {
            await tx.responsiblePerson.create({
              data: {
                studentSchoolRelationshipId: input.enrollmentId,
                type: person.type,
                ...data,
              },
            });
          }
        }

        await tx.studentSchoolRelationship.update({
          where: { id: input.enrollmentId },
          data: { parentIdentityId: legacyParentIdentityId },
        });
        await tx.auditLog.create({ data: auditLogData({
          schoolId,
          userId: ctx.user.id,
          userRole: ctx.user.role,
          entityType: 'ResponsiblePerson',
          entityId: input.enrollmentId,
          action: 'UPDATE',
          beforeJson: { types: current.map((person) => person.type) },
          afterJson: { types: incomingTypes },
        }) });

        return tx.responsiblePerson.findMany({
          where: { studentSchoolRelationshipId: input.enrollmentId, deletedAt: null },
          orderBy: { type: 'asc' },
        });
      });
    }),

  transferClass: schoolProcedure.input(transferStudentClassSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    if (!canManageClassMembership(access)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Không có quyền chuyển lớp học sinh' });
    }

    const enrollment = await ctx.prisma.studentSchoolRelationship.findFirst({
      where: { id: input.enrollmentId, schoolId, deletedAt: null, enrollmentStatus: 'ACTIVE' },
      select: { id: true, schoolYearId: true, currentClassId: true },
    });
    if (!enrollment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ đang theo học' });
    }

    const targetClass = await ctx.prisma.class.findFirst({
      where: {
        id: input.targetClassId,
        schoolId,
        schoolYearId: enrollment.schoolYearId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!targetClass) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lớp đích không thuộc năm học của hồ sơ' });
    }

    if (access.classScoped) {
      assertClassScope(access, enrollment.currentClassId);
      assertClassScope(access, targetClass.id);
    }
    if (enrollment.currentClassId === targetClass.id) {
      return { enrollmentId: enrollment.id, currentClassId: targetClass.id };
    }

    const activeMembership = await ctx.prisma.classMembership.findFirst({
      where: { studentSchoolRelationshipId: enrollment.id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (activeMembership && input.effectiveAt < activeMembership.startedAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Ngày chuyển lớp không thể trước ngày bắt đầu lớp hiện tại',
      });
    }

    return ctx.prisma.$transaction(async (tx) => {
      await tx.classMembership.updateMany({
        where: { studentSchoolRelationshipId: enrollment.id, endedAt: null },
        data: { endedAt: input.effectiveAt },
      });
      await tx.classMembership.create({
        data: {
          studentSchoolRelationshipId: enrollment.id,
          classId: targetClass.id,
          schoolYearId: enrollment.schoolYearId,
          startedAt: input.effectiveAt,
        },
      });
      await tx.studentSchoolRelationship.update({
        where: { id: enrollment.id },
        data: { currentClassId: targetClass.id },
      });
      await tx.auditLog.create({ data: auditLogData({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'ClassMembership',
        entityId: enrollment.id,
        action: 'CREATE',
        beforeJson: { classId: enrollment.currentClassId },
        afterJson: { classId: targetClass.id, effectiveAt: input.effectiveAt.toISOString() },
      }) });
      return { enrollmentId: enrollment.id, currentClassId: targetClass.id };
    });
  }),

  classHistory: schoolProcedure.input(enrollmentByIdSchema).query(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentRead(access);

    const enrollment = await ctx.prisma.studentSchoolRelationship.findFirst({
      where: { id: input.enrollmentId, schoolId, deletedAt: null },
      select: { id: true, currentClassId: true },
    });
    if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ nhập học' });
    assertClassScope(access, enrollment.currentClassId);

    return ctx.prisma.classMembership.findMany({
      where: {
        studentSchoolRelationshipId: enrollment.id,
        class: { schoolId, deletedAt: null },
      },
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        schoolYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }),

  withdraw: schoolProcedure.input(withdrawStudentSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentManage(access);

    const enrollment = await ctx.prisma.studentSchoolRelationship.findFirst({
      where: { id: input.enrollmentId, schoolId, deletedAt: null },
    });
    if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ nhập học' });
    if (enrollment.enrollmentStatus === 'WITHDRAWN') return enrollment;

    return ctx.prisma.$transaction(async (tx) => {
      await tx.classMembership.updateMany({
        where: { studentSchoolRelationshipId: enrollment.id, endedAt: null },
        data: { endedAt: input.withdrawnAt },
      });
      const updated = await tx.studentSchoolRelationship.update({
        where: { id: enrollment.id },
        data: {
          enrollmentStatus: 'WITHDRAWN',
          withdrawnAt: input.withdrawnAt,
          withdrawalReason: input.withdrawalReason,
          currentClassId: null,
        },
      });
      await tx.auditLog.create({ data: auditLogData({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'StudentSchoolRelationship',
        entityId: updated.id,
        action: 'UPDATE',
        beforeJson: { enrollmentStatus: enrollment.enrollmentStatus },
        afterJson: { enrollmentStatus: 'WITHDRAWN', withdrawnAt: input.withdrawnAt.toISOString() },
      }) });
      return updated;
    });
  }),

  archive: schoolProcedure.input(enrollmentByIdSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId;
    const access = await getStudentAccess(ctx.user);
    requireStudentManage(access);

    const enrollment = await ctx.prisma.studentSchoolRelationship.findFirst({
      where: { id: input.enrollmentId, schoolId, deletedAt: null },
      select: { id: true, studentId: true, enrollmentStatus: true },
    });
    if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ nhập học' });
    if (enrollment.enrollmentStatus === 'ACTIVE') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Phải kết thúc quan hệ nhập học trước khi lưu trữ hồ sơ',
      });
    }

    return ctx.prisma.$transaction(async (tx) => {
      const deletedAt = new Date();
      await tx.responsiblePerson.updateMany({
        where: { studentSchoolRelationshipId: enrollment.id, deletedAt: null },
        data: { deletedAt },
      });
      const archived = await tx.studentSchoolRelationship.update({
        where: { id: enrollment.id },
        data: { deletedAt },
      });
      const remainingEnrollments = await tx.studentSchoolRelationship.count({
        where: { studentId: enrollment.studentId, deletedAt: null },
      });
      if (remainingEnrollments === 0) {
        await tx.student.update({ where: { id: enrollment.studentId }, data: { deletedAt } });
      }
      await tx.auditLog.create({ data: auditLogData({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'StudentSchoolRelationship',
        entityId: enrollment.id,
        action: 'DELETE',
        afterJson: { studentIdentityArchived: remainingEnrollments === 0 },
      }) });
      return archived;
    });
  }),
});
