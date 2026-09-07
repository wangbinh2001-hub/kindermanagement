'use server';

import { prisma } from '@km/db';
import type { EmploymentStatus } from '@km/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  ALL_PERMISSIONS,
  ROLE_DEFINITIONS,
  type PermissionKey,
  type RoleDefinition,
} from './constants';

// ============================================================
// Action Result Type
// ============================================================

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================
// 1. Create Staff Member Action
// ============================================================

const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên nhân sự tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').max(15),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  employeeCode: z.string().optional().or(z.literal('')),
  roles: z.array(z.string()).min(1, 'Phải chọn ít nhất 1 vai trò công việc'),
  permissions: z.array(z.string()).optional(),
  hiredAt: z.coerce.date().default(() => new Date()),
  notes: z.string().optional().or(z.literal('')),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export async function createStaffAction(
  schoolId: string,
  input: CreateStaffInput
): Promise<ActionResponse<{ staffId: string }>> {
  try {
    const validated = createStaffSchema.parse(input);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, slug: true },
    });
    if (!school) {
      return { success: false, error: 'Không tìm thấy thông tin cơ sở trường học.' };
    }

    // Tự sinh mã nhân sự nếu chưa nhập
    let finalEmployeeCode = validated.employeeCode?.trim();
    if (!finalEmployeeCode) {
      const staffCount = await prisma.staffMember.count({ where: { schoolId } });
      finalEmployeeCode = `NV-${String(staffCount + 1).padStart(4, '0')}`;
    }

    // Tự sinh userId hoặc chuẩn hóa theo SĐT để hỗ trợ nhân sự làm việc đa trường
    const normalizedPhone = validated.phone.trim();
    const syntheticUserId = `usr-staff-${normalizedPhone.replace(/\D/g, '')}`;

    // Kiểm tra trùng lặp userId trong cùng 1 trường
    const existingInSchool = await prisma.staffMember.findUnique({
      where: {
        userId_schoolId: {
          userId: syntheticUserId,
          schoolId,
        },
      },
    });

    if (existingInSchool && !existingInSchool.deletedAt) {
      return {
        success: false,
        error: `Nhân sự với số điện thoại ${normalizedPhone} đã tồn tại trong trường này (Mã NV: ${existingInSchool.employeeCode}).`,
      };
    }

    // Tính toán quyền mặc định từ các roles được chọn
    const defaultPermsSet = new Set<string>();
    for (const r of validated.roles) {
      const def = ROLE_DEFINITIONS[r];
      if (def) {
        def.defaultPermissions.forEach((p) => defaultPermsSet.add(p));
      }
    }
    // Nếu có permissions override thì thêm vào
    if (validated.permissions && validated.permissions.length > 0) {
      validated.permissions.forEach((p) => defaultPermsSet.add(p));
    }

    const createdStaff = await prisma.$transaction(async (tx) => {
      let staff;
      if (existingInSchool && existingInSchool.deletedAt) {
        // Khôi phục nhân sự đã xóa mềm
        staff = await tx.staffMember.update({
          where: { id: existingInSchool.id },
          data: {
            fullName: validated.fullName.trim(),
            phone: normalizedPhone,
            email: validated.email?.trim() || null,
            employeeCode: finalEmployeeCode,
            roles: validated.roles,
            permissions: Array.from(defaultPermsSet),
            employmentStatus: 'ACTIVE',
            hiredAt: validated.hiredAt,
            resignedAt: null,
            notes: validated.notes?.trim() || null,
            deletedAt: null,
          },
        });
      } else {
        staff = await tx.staffMember.create({
          data: {
            userId: syntheticUserId,
            schoolId,
            fullName: validated.fullName.trim(),
            phone: normalizedPhone,
            email: validated.email?.trim() || null,
            employeeCode: finalEmployeeCode,
            roles: validated.roles,
            permissions: Array.from(defaultPermsSet),
            employmentStatus: 'ACTIVE',
            hiredAt: validated.hiredAt,
            notes: validated.notes?.trim() || null,
          },
        });
      }

      // Ghi vết AuditLog
      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'system-actor',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'StaffMember',
          entityId: staff.id,
          action: 'CREATE_STAFF',
          afterJson: {
            id: staff.id,
            fullName: staff.fullName,
            phone: staff.phone,
            employeeCode: staff.employeeCode,
            roles: staff.roles,
          },
        },
      });

      return staff;
    });

    revalidatePath(`/${school.slug}/staff`);
    return { success: true, data: { staffId: createdStaff.id } };
  } catch (err) {
    console.error('Lỗi khi tạo nhân sự:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi tạo nhân sự.',
    };
  }
}

// ============================================================
// 2. Update Staff Member Profile Action
// ============================================================

const updateStaffSchema = z.object({
  staffId: z.string().min(1, 'Thiếu ID nhân sự'),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').max(15),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  employeeCode: z.string().optional().or(z.literal('')),
  roles: z.array(z.string()).min(1, 'Phải chọn ít nhất 1 vai trò'),
  notes: z.string().optional().or(z.literal('')),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export async function updateStaffProfileAction(
  schoolId: string,
  input: UpdateStaffInput
): Promise<ActionResponse> {
  try {
    const validated = updateStaffSchema.parse(input);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, slug: true },
    });
    if (!school) {
      return { success: false, error: 'Không tìm thấy cơ sở trường học.' };
    }

    const before = await prisma.staffMember.findFirst({
      where: { id: validated.staffId, schoolId, deletedAt: null },
    });
    if (!before) {
      return { success: false, error: 'Nhân sự không tồn tại hoặc đã bị xóa.' };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const staff = await tx.staffMember.update({
        where: { id: validated.staffId },
        data: {
          fullName: validated.fullName.trim(),
          phone: validated.phone.trim(),
          email: validated.email?.trim() || null,
          employeeCode: validated.employeeCode?.trim() || before.employeeCode,
          roles: validated.roles,
          notes: validated.notes?.trim() || null,
        },
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'system-actor',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'StaffMember',
          entityId: staff.id,
          action: 'UPDATE_STAFF',
          beforeJson: {
            fullName: before.fullName,
            roles: before.roles,
            employeeCode: before.employeeCode,
          },
          afterJson: {
            fullName: staff.fullName,
            roles: staff.roles,
            employeeCode: staff.employeeCode,
          },
        },
      });

      return staff;
    });

    revalidatePath(`/${school.slug}/staff`);
    revalidatePath(`/${school.slug}/staff/${updated.id}`);
    return { success: true, data: { staffId: updated.id } };
  } catch (err) {
    console.error('Lỗi khi cập nhật nhân sự:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật hồ sơ.',
    };
  }
}

// ============================================================
// 3. Update Staff Granular Permissions Action
// ============================================================

export async function updateStaffPermissionsAction(
  schoolId: string,
  staffId: string,
  permissions: string[]
): Promise<ActionResponse> {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, slug: true },
    });
    if (!school) {
      return { success: false, error: 'Không tìm thấy cơ sở trường học.' };
    }

    const before = await prisma.staffMember.findFirst({
      where: { id: staffId, schoolId, deletedAt: null },
    });
    if (!before) {
      return { success: false, error: 'Nhân sự không tồn tại.' };
    }

    await prisma.$transaction(async (tx) => {
      const staff = await tx.staffMember.update({
        where: { id: staffId },
        data: { permissions },
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'system-actor',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'StaffMember',
          entityId: staff.id,
          action: 'UPDATE_STAFF_PERMISSIONS',
          beforeJson: { permissions: before.permissions },
          afterJson: { permissions: staff.permissions },
        },
      });
    });

    revalidatePath(`/${school.slug}/staff/${staffId}`);
    return { success: true };
  } catch (err) {
    console.error('Lỗi khi cập nhật quyền:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi cập nhật ma trận phân quyền.',
    };
  }
}

// ============================================================
// 4. Change Staff Employment Status Action
// ============================================================

const changeStaffStatusSchema = z.object({
  staffId: z.string().min(1, 'Thiếu ID nhân sự'),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']),
  note: z.string().optional().or(z.literal('')),
});

export type ChangeStaffStatusInput = z.infer<typeof changeStaffStatusSchema>;

export async function changeStaffStatusAction(
  schoolId: string,
  input: ChangeStaffStatusInput
): Promise<ActionResponse> {
  try {
    const validated = changeStaffStatusSchema.parse(input);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, slug: true },
    });
    if (!school) {
      return { success: false, error: 'Không tìm thấy cơ sở trường học.' };
    }

    const staff = await prisma.staffMember.findFirst({
      where: { id: validated.staffId, schoolId, deletedAt: null },
    });
    if (!staff) {
      return { success: false, error: 'Nhân sự không tồn tại.' };
    }

    const isResigning = validated.status === 'RESIGNED' || validated.status === 'TERMINATED';

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái
      await tx.staffMember.update({
        where: { id: validated.staffId },
        data: {
          employmentStatus: validated.status as EmploymentStatus,
          resignedAt: isResigning ? new Date() : null,
          notes: validated.note?.trim()
            ? `${staff.notes ? staff.notes + '\n' : ''}[${new Date().toLocaleDateString('vi-VN')} - Trạng thái: ${validated.status}]: ${validated.note.trim()}`
            : staff.notes,
        },
      });

      // 2. Nếu nghỉ việc hoặc sa thải: Tự động gỡ phân công chủ nhiệm và phụ trách các lớp học
      if (isResigning) {
        // Gỡ chủ nhiệm
        await tx.class.updateMany({
          where: {
            schoolId,
            homeroomTeacherId: validated.staffId,
            deletedAt: null,
          },
          data: {
            homeroomTeacherId: null,
          },
        });

        // Gỡ phụ trách (Lấy các lớp có staffId trong assistantTeacherIds)
        const classesWithAssistant = await tx.class.findMany({
          where: {
            schoolId,
            assistantTeacherIds: { has: validated.staffId },
            deletedAt: null,
          },
        });

        for (const cls of classesWithAssistant) {
          await tx.class.update({
            where: { id: cls.id },
            data: {
              assistantTeacherIds: cls.assistantTeacherIds.filter((id) => id !== validated.staffId),
            },
          });
        }
      }

      // 3. Ghi vết AuditLog
      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'system-actor',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'StaffMember',
          entityId: validated.staffId,
          action: 'CHANGE_STAFF_STATUS',
          beforeJson: { status: staff.employmentStatus },
          afterJson: {
            status: validated.status,
            isResigning,
            unassignedClasses: isResigning,
          },
        },
      });
    });

    revalidatePath(`/${school.slug}/staff`);
    revalidatePath(`/${school.slug}/staff/${validated.staffId}`);
    revalidatePath(`/${school.slug}/school-years`);
    return { success: true };
  } catch (err) {
    console.error('Lỗi khi đổi trạng thái làm việc:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật trạng thái.',
    };
  }
}

// ============================================================
// 5. Assign Class Staff Action (Homeroom & Assistant Teachers)
// ============================================================

const assignClassStaffSchema = z.object({
  classId: z.string().min(1, 'Thiếu ID lớp học'),
  homeroomTeacherId: z.string().nullable().optional(),
  assistantTeacherIds: z.array(z.string()).default([]),
});

export type AssignClassStaffInput = z.infer<typeof assignClassStaffSchema>;

export async function assignClassStaffAction(
  schoolId: string,
  input: AssignClassStaffInput
): Promise<ActionResponse> {
  try {
    const validated = assignClassStaffSchema.parse(input);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, slug: true },
    });
    if (!school) {
      return { success: false, error: 'Không tìm thấy cơ sở trường học.' };
    }

    const targetClass = await prisma.class.findFirst({
      where: { id: validated.classId, schoolId, deletedAt: null },
      include: { schoolYear: true },
    });
    if (!targetClass) {
      return { success: false, error: 'Lớp học không tồn tại.' };
    }

    // RÀNG BUỘC NGHIỆP VỤ:
    // Một giáo viên chỉ được làm chủ nhiệm TỐI ĐA 1 LỚP trong cùng một năm học (schoolYearId)
    if (validated.homeroomTeacherId) {
      const staff = await prisma.staffMember.findFirst({
        where: { id: validated.homeroomTeacherId, schoolId, deletedAt: null },
      });

      if (!staff) {
        return { success: false, error: 'Giáo viên chủ nhiệm được chọn không tồn tại.' };
      }

      if (staff.employmentStatus !== 'ACTIVE') {
        return {
          success: false,
          error: `Giáo viên ${staff.fullName || staff.employeeCode} đang ở trạng thái ${staff.employmentStatus}, không thể phân công chủ nhiệm.`,
        };
      }

      // Kiểm tra xem giáo viên này đã chủ nhiệm lớp nào khác trong cùng năm học chưa
      const existingHomeroom = await prisma.class.findFirst({
        where: {
          schoolId,
          schoolYearId: targetClass.schoolYearId,
          homeroomTeacherId: validated.homeroomTeacherId,
          id: { not: targetClass.id },
          deletedAt: null,
        },
      });

      if (existingHomeroom) {
        return {
          success: false,
          error: `Giáo viên ${staff.fullName || staff.employeeCode} đã là chủ nhiệm của lớp "${existingHomeroom.name}" trong năm học này. Mỗi giáo viên chỉ được chủ nhiệm 1 lớp/năm học.`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      const before = {
        homeroomTeacherId: targetClass.homeroomTeacherId,
        assistantTeacherIds: targetClass.assistantTeacherIds,
      };

      const updated = await tx.class.update({
        where: { id: validated.classId },
        data: {
          homeroomTeacherId: validated.homeroomTeacherId || null,
          assistantTeacherIds: validated.assistantTeacherIds,
        },
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: 'system-actor',
          userRole: 'SCHOOL_ADMIN',
          entityType: 'Class',
          entityId: targetClass.id,
          action: 'ASSIGN_CLASS_STAFF',
          beforeJson: before,
          afterJson: {
            homeroomTeacherId: updated.homeroomTeacherId,
            assistantTeacherIds: updated.assistantTeacherIds,
          },
        },
      });
    });

    revalidatePath(`/${school.slug}/school-years`);
    revalidatePath(`/${school.slug}/staff`);
    return { success: true };
  } catch (err) {
    console.error('Lỗi khi phân công giáo viên lớp:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi phân công giáo viên.',
    };
  }
}
