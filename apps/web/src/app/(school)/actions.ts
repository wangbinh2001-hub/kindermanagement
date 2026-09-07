'use server';

import { prisma, Prisma, AgeGroup } from '@km/db';
import { revalidatePath } from 'next/cache';
import {
  createSchoolYearSchema,
  updateSchoolYearSchema,
  createClassSchema,
  updateClassSchema,
  updateSchoolProfileSchema,
  updateSchoolSettingsSchema,
} from '@km/validators/schemas/school-operations';

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) return null as unknown as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}

async function writeAuditLog(opts: {
  schoolId: string;
  userId?: string;
  userRole?: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
}) {
  const {
    schoolId,
    userId = 'school-admin-current',
    userRole = 'SCHOOL_ADMIN',
    entityType,
    entityId,
    action,
    beforeJson,
    afterJson,
    metadata,
  } = opts;

  await prisma.auditLog.create({
    data: {
      schoolId,
      userId,
      userRole,
      entityType,
      entityId,
      action,
      beforeJson: jsonValue(beforeJson),
      afterJson: jsonValue(afterJson),
      metadata: jsonValue(metadata),
    },
  });
}

// ============================================================
// 1. School Profile & Settings (Module 12)
// ============================================================

export async function updateSchoolProfileAction(schoolId: string, rawInput: unknown) {
  const parsed = updateSchoolProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }
  const input = parsed.data;

  try {
    const before = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!before || before.deletedAt) return { success: false, error: 'Không tìm thấy trường học' };

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: input.name ?? before.name,
        phone: input.phone ?? before.phone,
        email: input.email ?? before.email,
        address: input.address ?? before.address,
        taxCode: input.taxCode ?? before.taxCode,
        legalRepresentative: input.legalRepresentative ?? before.legalRepresentative,
        description: input.description ?? before.description,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : before.logoUrl,
      },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'School',
      entityId: schoolId,
      action: 'UPDATE_SCHOOL_PROFILE',
      beforeJson: {
        name: before.name,
        phone: before.phone,
        email: before.email,
        address: before.address,
      },
      afterJson: {
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
      },
    });

    revalidatePath(`/school/${updated.slug}`);
    revalidatePath(`/${updated.slug}`);
    revalidatePath('/system-admin/schools');

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi cập nhật thông tin trường' };
  }
}

export async function updateSchoolSettingsAction(schoolId: string, rawInput: unknown) {
  const parsed = updateSchoolSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }
  const input = parsed.data;

  try {
    const before = await prisma.schoolSetting.findUnique({ where: { schoolId } });

    const updated = await prisma.schoolSetting.upsert({
      where: { schoolId },
      create: {
        schoolId,
        currentSchoolYearId: input.currentSchoolYearId,
        enableAttendance: input.enableAttendance ?? true,
        enableTuition: input.enableTuition ?? true,
        enableHealth: input.enableHealth ?? true,
        enableNutrition: input.enableNutrition ?? false,
        notificationConfig: jsonValue(input.notificationConfig),
      },
      update: {
        currentSchoolYearId: input.currentSchoolYearId !== undefined ? input.currentSchoolYearId : before?.currentSchoolYearId,
        enableAttendance: input.enableAttendance !== undefined ? input.enableAttendance : before?.enableAttendance,
        enableTuition: input.enableTuition !== undefined ? input.enableTuition : before?.enableTuition,
        enableHealth: input.enableHealth !== undefined ? input.enableHealth : before?.enableHealth,
        enableNutrition: input.enableNutrition !== undefined ? input.enableNutrition : before?.enableNutrition,
        notificationConfig: input.notificationConfig !== undefined ? jsonValue(input.notificationConfig) : (before?.notificationConfig ?? undefined),
      },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'SchoolSetting',
      entityId: updated.id,
      action: 'UPDATE_SCHOOL_SETTINGS',
      beforeJson: before,
      afterJson: updated,
    });

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi cập nhật cấu hình nâng cao' };
  }
}

// ============================================================
// 2. School Years (Module 03 - Phần A)
// ============================================================

export async function createSchoolYearAction(schoolId: string, rawInput: unknown) {
  const parsed = createSchoolYearSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu năm học không hợp lệ' };
  }
  const input = parsed.data;

  try {
    const existingCount = await prisma.schoolYear.count({ where: { schoolId, deletedAt: null } });
    const isFirstYear = existingCount === 0;

    const schoolYear = await prisma.$transaction(async (tx) => {
      const year = await tx.schoolYear.create({
        data: {
          schoolId,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          isCurrent: isFirstYear,
          isArchived: false,
        },
      });

      if (isFirstYear) {
        await tx.schoolSetting.upsert({
          where: { schoolId },
          create: { schoolId, currentSchoolYearId: year.id },
          update: { currentSchoolYearId: year.id },
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'school-admin-current',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'SchoolYear',
          entityId: year.id,
          action: 'CREATE_SCHOOL_YEAR',
          afterJson: jsonValue({ name: year.name, isCurrent: year.isCurrent }),
        },
      });

      return year;
    });

    return { success: true, data: schoolYear };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi tạo năm học' };
  }
}

export async function setCurrentSchoolYearAction(schoolId: string, schoolYearId: string) {
  try {
    const targetYear = await prisma.schoolYear.findFirst({
      where: { id: schoolYearId, schoolId, deletedAt: null },
    });
    if (!targetYear) return { success: false, error: 'Không tìm thấy năm học mục tiêu' };

    await prisma.$transaction(async (tx) => {
      // 1. Bỏ chọn tất cả các năm học hiện tại của trường
      await tx.schoolYear.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });

      // 2. Gắn năm học mục tiêu là isCurrent
      await tx.schoolYear.update({
        where: { id: schoolYearId },
        data: { isCurrent: true },
      });

      // 3. Đồng bộ với SchoolSetting
      await tx.schoolSetting.upsert({
        where: { schoolId },
        create: { schoolId, currentSchoolYearId: schoolYearId },
        update: { currentSchoolYearId: schoolYearId },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'school-admin-current',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'SchoolYear',
          entityId: schoolYearId,
          action: 'SET_CURRENT_SCHOOL_YEAR',
          afterJson: jsonValue({ schoolYearId, name: targetYear.name }),
        },
      });
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi khi đổi năm học hiện tại' };
  }
}

// ============================================================
// 3. Classes (Module 03 - Phần B)
// ============================================================

export async function createClassAction(schoolId: string, rawInput: unknown) {
  const parsed = createClassSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu lớp học không hợp lệ' };
  }
  const input = parsed.data;

  try {
    const year = await prisma.schoolYear.findFirst({
      where: { id: input.schoolYearId, schoolId, deletedAt: null },
    });
    if (!year) return { success: false, error: 'Năm học không tồn tại trong cơ sở trường này' };

    const newClass = await prisma.class.create({
      data: {
        schoolId,
        schoolYearId: input.schoolYearId,
        name: input.name,
        ageGroup: input.ageGroup as AgeGroup,
        capacity: input.capacity,
        isActive: input.isActive ?? true,
      },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'Class',
      entityId: newClass.id,
      action: 'CREATE_CLASS',
      afterJson: {
        name: newClass.name,
        ageGroup: newClass.ageGroup,
        capacity: newClass.capacity,
        schoolYearId: newClass.schoolYearId,
      },
    });

    return { success: true, data: newClass };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi tạo lớp học' };
  }
}

export async function updateClassAction(schoolId: string, classId: string, rawInput: unknown) {
  const parsed = updateClassSchema.safeParse({ classId, ...(rawInput as object) });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu lớp học không hợp lệ' };
  }
  const input = parsed.data;

  try {
    const before = await prisma.class.findFirst({
      where: { id: classId, schoolId, deletedAt: null },
    });
    if (!before) return { success: false, error: 'Không tìm thấy lớp học' };

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        name: input.name ?? before.name,
        ageGroup: input.ageGroup ? (input.ageGroup as AgeGroup) : before.ageGroup,
        capacity: input.capacity ?? before.capacity,
        isActive: input.isActive !== undefined ? input.isActive : before.isActive,
      },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'Class',
      entityId: classId,
      action: 'UPDATE_CLASS',
      beforeJson: before,
      afterJson: updated,
    });

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi cập nhật lớp học' };
  }
}

export async function deleteClassAction(schoolId: string, classId: string) {
  try {
    const existing = await prisma.class.findFirst({
      where: { id: classId, schoolId, deletedAt: null },
    });
    if (!existing) return { success: false, error: 'Không tìm thấy lớp học hoặc lớp đã bị xóa' };

    const deleted = await prisma.class.update({
      where: { id: classId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'Class',
      entityId: classId,
      action: 'DELETE_CLASS',
      beforeJson: { name: existing.name, isActive: existing.isActive },
      afterJson: { deletedAt: deleted.deletedAt, isActive: false },
    });

    return { success: true, data: deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi khi xóa lớp học' };
  }
}
