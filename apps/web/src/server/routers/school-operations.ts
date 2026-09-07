import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { TRPCError } from '@trpc/server';
import { prisma, AgeGroup } from '@km/db';
import {
  createSchoolYearSchema,
  updateSchoolYearSchema,
  setCurrentSchoolYearSchema,
  archiveSchoolYearSchema,
  classFilterSchema,
  createClassSchema,
  updateClassSchema,
  deleteClassSchema,
  updateSchoolProfileSchema,
  updateSchoolSettingsSchema,
} from '@km/validators/schemas/school-operations';

async function writeAuditLog(opts: {
  schoolId: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      schoolId: opts.schoolId,
      userId: opts.userId,
      userRole: opts.userRole,
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      beforeJson: (opts.beforeJson ?? null) as never,
      afterJson: (opts.afterJson ?? null) as never,
    },
  });
}

export const schoolOperationsRouter = router({
  // ============================================================
  // School Years
  // ============================================================

  listSchoolYears: schoolProcedure.query(async ({ ctx }) => {
    return prisma.schoolYear.findMany({
      where: {
        schoolId: ctx.user.activeSchoolId,
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
    });
  }),

  createSchoolYear: schoolProcedure
    .input(createSchoolYearSchema)
    .mutation(async ({ ctx, input }) => {
      const year = await prisma.schoolYear.create({
        data: {
          schoolId: ctx.user.activeSchoolId,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
      await writeAuditLog({
        schoolId: ctx.user.activeSchoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'SchoolYear',
        entityId: year.id,
        action: 'CREATE_SCHOOL_YEAR',
        afterJson: year,
      });
      return year;
    }),

  updateSchoolYear: schoolProcedure
    .input(updateSchoolYearSchema)
    .mutation(async ({ ctx, input }) => {
      const { schoolYearId, ...data } = input;
      const before = await prisma.schoolYear.findFirst({
        where: { id: schoolYearId, schoolId: ctx.user.activeSchoolId },
      });
      if (!before) throw new TRPCError({ code: 'NOT_FOUND' });

      const year = await prisma.schoolYear.update({
        where: { id: schoolYearId },
        data,
      });
      await writeAuditLog({
        schoolId: ctx.user.activeSchoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'SchoolYear',
        entityId: year.id,
        action: 'UPDATE_SCHOOL_YEAR',
        beforeJson: before,
        afterJson: year,
      });
      return year;
    }),

  setCurrentSchoolYear: schoolProcedure
    .input(setCurrentSchoolYearSchema)
    .mutation(async ({ ctx, input }) => {
      // Must be atomic transaction
      const { schoolYearId } = input;
      const schoolId = ctx.user.activeSchoolId;

      await prisma.$transaction([
        prisma.schoolYear.updateMany({
          where: { schoolId, isCurrent: true },
          data: { isCurrent: false },
        }),
        prisma.schoolYear.update({
          where: { id: schoolYearId },
          data: { isCurrent: true },
        }),
        prisma.schoolSetting.update({
          where: { schoolId },
          data: { currentSchoolYearId: schoolYearId },
        }),
      ]);

      await writeAuditLog({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'SchoolYear',
        entityId: schoolYearId,
        action: 'SET_CURRENT_SCHOOL_YEAR',
      });
      return { success: true };
    }),

  archiveSchoolYear: schoolProcedure
    .input(archiveSchoolYearSchema)
    .mutation(async ({ ctx, input }) => {
      const year = await prisma.schoolYear.update({
        where: { id: input.schoolYearId, schoolId: ctx.user.activeSchoolId },
        data: { isArchived: true },
      });
      await writeAuditLog({
        schoolId: ctx.user.activeSchoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'SchoolYear',
        entityId: year.id,
        action: 'ARCHIVE_SCHOOL_YEAR',
        afterJson: { isArchived: true },
      });
      return year;
    }),

  // ============================================================
  // Classes
  // ============================================================

  listClasses: schoolProcedure
    .input(classFilterSchema)
    .query(async ({ ctx, input }) => {
      return prisma.class.findMany({
        where: {
          schoolId: ctx.user.activeSchoolId,
          schoolYearId: input.schoolYearId,
          deletedAt: null,
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        orderBy: { name: 'asc' },
      });
    }),

  createClass: schoolProcedure
    .input(createClassSchema)
    .mutation(async ({ ctx, input }) => {
      const cls = await prisma.class.create({
        data: {
          schoolId: ctx.user.activeSchoolId,
          ...input,
          ageGroup: input.ageGroup as AgeGroup,
        },
      });
      await writeAuditLog({
        schoolId: ctx.user.activeSchoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'Class',
        entityId: cls.id,
        action: 'CREATE_CLASS',
        afterJson: cls,
      });
      return cls;
    }),

  updateClass: schoolProcedure
    .input(updateClassSchema)
    .mutation(async ({ ctx, input }) => {
      const { classId, ...data } = input;
      const before = await prisma.class.findFirst({
        where: { id: classId, schoolId: ctx.user.activeSchoolId },
      });
      if (!before) throw new TRPCError({ code: 'NOT_FOUND' });

      const updateData = { ...data };
      if (data.ageGroup !== undefined) {
        updateData.ageGroup = data.ageGroup as AgeGroup;
      }

      const cls = await prisma.class.update({
        where: { id: classId },
        data: updateData,
      });
      await writeAuditLog({
        schoolId: ctx.user.activeSchoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'Class',
        entityId: cls.id,
        action: 'UPDATE_CLASS',
        beforeJson: before,
        afterJson: cls,
      });
      return cls;
    }),

  deleteClass: schoolProcedure
    .input(deleteClassSchema)
    .mutation(async ({ ctx, input }) => {
      // Soft delete class if it has no active students (placeholder logic)
      const count = await prisma.classMembership.count({
        where: { classId: input.classId, endedAt: null },
      });
      if (count > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Không thể xóa lớp đang có học sinh theo học',
        });
      }

      const cls = await prisma.class.update({
        where: { id: input.classId, schoolId: ctx.user.activeSchoolId },
        data: { deletedAt: new Date(), isActive: false },
      });
      await writeAuditLog({
        schoolId: ctx.user.activeSchoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'Class',
        entityId: cls.id,
        action: 'DELETE_CLASS',
      });
      return cls;
    }),

  updateSchoolProfile: schoolProcedure
    .input(updateSchoolProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const before = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!before) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy trường' });

      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl || null;
      if (input.phone !== undefined) data.phone = input.phone;
      if (input.email !== undefined) data.email = input.email;
      if (input.address !== undefined) data.address = input.address;
      if (input.taxCode !== undefined) data.taxCode = input.taxCode;
      if (input.legalRepresentative !== undefined) data.legalRepresentative = input.legalRepresentative;
      if (input.description !== undefined) data.description = input.description;

      const updated = await prisma.school.update({
        where: { id: schoolId },
        data,
      });

      await writeAuditLog({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'School',
        entityId: schoolId,
        action: 'UPDATE_PROFILE',
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    }),

  updateSchoolSettings: schoolProcedure
    .input(updateSchoolSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const before = await prisma.schoolSetting.findUnique({ where: { schoolId } });
      if (!before) {
        // create if missing
        const created = await prisma.schoolSetting.create({
          data: { schoolId, ...input },
        });
        await writeAuditLog({
          schoolId,
          userId: ctx.user.id,
          userRole: ctx.user.role,
          entityType: 'SchoolSetting',
          entityId: created.id,
          action: 'CREATE_SETTINGS',
          beforeJson: null,
          afterJson: created,
        });
        return created;
      }

      const data: Record<string, unknown> = {};
      if (input.currentSchoolYearId !== undefined) data.currentSchoolYearId = input.currentSchoolYearId;
      if (input.enableAttendance !== undefined) data.enableAttendance = input.enableAttendance;
      if (input.enableTuition !== undefined) data.enableTuition = input.enableTuition;
      if (input.enableHealth !== undefined) data.enableHealth = input.enableHealth;
      if (input.enableNutrition !== undefined) data.enableNutrition = input.enableNutrition;
      if (input.notificationConfig !== undefined) data.notificationConfig = input.notificationConfig;

      const updated = await prisma.schoolSetting.update({
        where: { schoolId },
        data,
      });

      await writeAuditLog({
        schoolId,
        userId: ctx.user.id,
        userRole: ctx.user.role,
        entityType: 'SchoolSetting',
        entityId: updated.id,
        action: 'UPDATE_SETTINGS',
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    }),
});
