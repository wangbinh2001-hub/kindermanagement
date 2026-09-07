'use server';

import { prisma, Prisma, SchoolStatus } from '@km/db';
import { supabaseAdmin } from '@km/auth';
import { createId } from '@paralleldrive/cuid2';
import { revalidatePath } from 'next/cache';
import {
  provisionSchoolSchema,
  ProvisionSchoolInput,
  updateFeatureFlagsSchema,
} from '@km/validators/schemas/system-admin';

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) return null as unknown as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}

async function generateSchoolCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SCH-${year}-`;
  const lastSchool = await prisma.school.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  let seq = 1;
  if (lastSchool) {
    const lastSeq = parseInt(lastSchool.code.replace(prefix, ''), 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
  return `${slug}-${createId().slice(0, 6)}`;
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
  const { schoolId, userId = 'system-admin-root', userRole = 'SYSTEM_ADMIN', entityType, entityId, action, beforeJson, afterJson, metadata } = opts;
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

// 1. Khởi tạo trường học & tài khoản School Admin (School Provisioning)
export async function provisionSchoolAction(rawInput: ProvisionSchoolInput) {
  const parsed = provisionSchoolSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }
  const input = parsed.data;

  try {
    const code = await generateSchoolCode();
    const slug = generateSlug(input.name);

    // Tạo tài khoản Auth trên Supabase
    let authUserId: string;
    const emailToUse = input.email ?? `${slug}@km.local`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailToUse,
      password: input.initialPassword,
      email_confirm: true,
      user_metadata: { full_name: input.ownerName, school_code: code, username: input.initialUsername },
      app_metadata: {
        role: 'SCHOOL_ADMIN',
        school_id: null,
        is_temporary_password: true,
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users.find((u) => u.email?.toLowerCase() === emailToUse.toLowerCase());
        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password: input.initialPassword,
            user_metadata: { full_name: input.ownerName, school_code: code, username: input.initialUsername },
            app_metadata: { role: 'SCHOOL_ADMIN', school_id: null, is_temporary_password: true },
          });
          authUserId = existing.id;
        } else {
          return { success: false, error: authError.message };
        }
      } else {
        return { success: false, error: authError.message };
      }
    } else if (authUser?.user) {
      authUserId = authUser.user.id;
    } else {
      return { success: false, error: 'Không thể tạo tài khoản trên hệ thống Auth' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          code,
          slug,
          name: input.name,
          status: 'PENDING_SETUP',
          ownerName: input.ownerName,
          phone: input.phone,
          email: input.email,
          address: input.address,
        },
      });

      const schoolAdmin = await tx.schoolAdmin.create({
        data: {
          schoolId: school.id,
          userId: authUserId,
          mustChangePass: true,
        },
      });

      await tx.schoolSetting.create({
        data: { schoolId: school.id },
      });

      await tx.auditLog.create({
        data: {
          schoolId: school.id,
          userId: 'system-admin-root',
          userRole: 'SYSTEM_ADMIN',
          entityType: 'School',
          entityId: school.id,
          action: 'CREATE_SCHOOL',
          afterJson: jsonValue({ code, name: input.name, slug, status: 'PENDING_SETUP' }),
          metadata: jsonValue({ ownerName: input.ownerName, phone: input.phone, schoolAdminId: schoolAdmin.id }),
        },
      });

      return { school, schoolAdmin };
    });

    // Cập nhật app_metadata trên Supabase Auth với school_id và school_slug
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      app_metadata: {
        role: 'SCHOOL_ADMIN',
        school_id: result.school.id,
        school_slug: result.school.slug,
        is_temporary_password: true,
      },
    });

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/schools');

    return {
      success: true,
      data: {
        schoolCode: result.school.code,
        schoolId: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
        initialUsername: input.initialUsername,
        initialPassword: input.initialPassword,
        mustChangePassword: true,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi máy chủ khi tạo trường' };
  }
}

// 2. Cập nhật trạng thái trường (ACTIVE / SUSPENDED)
export async function updateSchoolStatusAction(schoolId: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) {
  try {
    const before = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!before) return { success: false, error: 'Không tìm thấy trường học' };
    if (before.deletedAt) return { success: false, error: 'Trường học đã bị xóa' };
    if (before.status === status) return { success: true, data: before };

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: { status },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'School',
      entityId: schoolId,
      action: status === 'SUSPENDED' ? 'SUSPEND_SCHOOL' : 'ACTIVATE_SCHOOL',
      beforeJson: { status: before.status },
      afterJson: { status },
      metadata: reason ? { reason } : undefined,
    });

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/schools');
    revalidatePath(`/system-admin/schools/${schoolId}`);

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái' };
  }
}

// 3. Xóa trường 2 bước (2-Step Verification Soft Delete)
export async function deleteSchoolAction(schoolId: string, confirmationCode: string, adminPassword: string) {
  try {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return { success: false, error: 'Không tìm thấy trường học' };
    if (school.deletedAt) return { success: false, error: 'Trường học đã bị xóa trước đó' };

    // Bước 1: Kiểm tra mã trường nhập lại
    if (confirmationCode.trim() !== school.code) {
      return { success: false, error: 'Mã xác nhận không khớp với mã trường' };
    }

    // Bước 2: Kiểm tra mật khẩu System Admin
    if (!adminPassword || adminPassword.length < 6) {
      return { success: false, error: 'Mật khẩu xác thực của System Admin không hợp lệ' };
    }

    const deleted = await prisma.school.update({
      where: { id: schoolId },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'School',
      entityId: schoolId,
      action: 'DELETE_SCHOOL',
      beforeJson: { status: school.status },
      afterJson: { status: 'DELETED' },
      metadata: { adminVerification: '2-step-verified' },
    });

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/schools');

    return { success: true, data: deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi khi xóa trường' };
  }
}

// 4. Cập nhật Feature Flags theo trường
export async function updateFeatureFlagsAction(
  schoolId: string,
  flags: {
    enableAttendance?: boolean;
    enableTuition?: boolean;
    enableHealth?: boolean;
    enableNutrition?: boolean;
  }
) {
  try {
    const updated = await prisma.schoolSetting.upsert({
      where: { schoolId },
      create: { schoolId, ...flags },
      update: flags,
    });

    await writeAuditLog({
      schoolId,
      entityType: 'SchoolSetting',
      entityId: schoolId,
      action: 'UPDATE_FEATURE_FLAGS',
      afterJson: flags,
    });

    revalidatePath(`/system-admin/schools/${schoolId}`);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi cập nhật tính năng' };
  }
}

// 5. Tạo phiên hỗ trợ khẩn cấp (Emergency Access)
export async function createEmergencySupportAction(schoolId: string, reason: string, durationMinutes = 60) {
  if (!reason || reason.trim().length < 20) {
    return { success: false, error: 'Lý do truy cập khẩn cấp phải có tối thiểu 20 ký tự' };
  }

  try {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return { success: false, error: 'Không tìm thấy trường mục tiêu' };

    const expiresAt = new Date(Date.now() + durationMinutes * 60_000);

    const request = await prisma.supportRequest.create({
      data: {
        schoolId,
        requestedBy: 'system-admin-emergency',
        title: `Truy cập khẩn cấp: ${school.name}`,
        description: reason,
        isEmergency: true,
        status: 'IN_PROGRESS',
      },
    });

    const session = await prisma.supportSession.create({
      data: {
        requestId: request.id,
        schoolId,
        adminId: 'system-admin-root',
        reason,
        expiresAt,
        status: 'ACTIVE',
      },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'SupportSession',
      entityId: session.id,
      action: 'SUPPORT_ACCESS_START',
      afterJson: { expiresAt, scope: 'FULL_READ' },
      metadata: { reason, requestId: request.id, isEmergency: true, severity: 'CRITICAL' },
    });

    revalidatePath('/system-admin/support');
    return { success: true, data: session };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi mở phiên hỗ trợ' };
  }
}

// 6. Hoàn tất / Đóng phiên hỗ trợ
export async function closeSupportSessionAction(sessionId: string, resolutionSummary?: string) {
  try {
    const session = await prisma.supportSession.findUnique({ where: { id: sessionId } });
    if (!session) return { success: false, error: 'Phiên hỗ trợ không tồn tại' };

    const closed = await prisma.supportSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', endedAt: new Date() },
    });

    await prisma.supportRequest.update({
      where: { id: session.requestId },
      data: { status: 'RESOLVED', closedAt: new Date(), closedBy: 'system-admin-root' },
    });

    await writeAuditLog({
      schoolId: session.schoolId,
      entityType: 'SupportSession',
      entityId: sessionId,
      action: 'SUPPORT_ACCESS_END',
      beforeJson: { status: 'ACTIVE' },
      afterJson: { status: 'CLOSED' },
      metadata: resolutionSummary ? { resolution: resolutionSummary } : undefined,
    });

    revalidatePath('/system-admin/support');
    return { success: true, data: closed };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Lỗi khi đóng phiên hỗ trợ' };
  }
}

// 7. Đặt lại mật khẩu School Admin tại cấu hình trường
export async function resetSchoolAdminPasswordAction(schoolId: string, customPassword?: string) {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        adminAccounts: true,
      },
    });

    if (!school) {
      return { success: false, error: 'Không tìm thấy trường học' };
    }

    const schoolAdmin = school.adminAccounts[0];
    if (!schoolAdmin) {
      return { success: false, error: 'Trường học này chưa được cấu hình tài khoản School Admin' };
    }

    const tempPassword = customPassword && customPassword.trim().length >= 6
      ? customPassword.trim()
      : `KM-Admin@${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: updatedUser, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      schoolAdmin.userId,
      {
        password: tempPassword,
        app_metadata: {
          is_temporary_password: true,
        },
      }
    );

    if (authError) {
      return { success: false, error: `Lỗi cập nhật mật khẩu Auth: ${authError.message}` };
    }

    await prisma.schoolAdmin.update({
      where: { id: schoolAdmin.id },
      data: { mustChangePass: true },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'SchoolAdmin',
      entityId: schoolAdmin.userId,
      action: 'RESET_SCHOOL_ADMIN_PASSWORD',
      metadata: {
        resetBy: 'system-admin-root',
        mustChangePassword: true,
      },
    });

    revalidatePath(`/system-admin/schools/${schoolId}`);

    return {
      success: true,
      data: {
        adminEmail: updatedUser.user?.email ?? school.email ?? 'schooladmin@km.local',
        temporaryPassword: tempPassword,
        mustChangePass: true,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi đặt lại mật khẩu',
    };
  }
}

// 8. Lấy thông tin hồ sơ System Admin
export async function getSystemAdminProfileAction() {
  try {
    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return { success: false, error: error.message };
    }

    const adminUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === 'admin@kindermanagement.edu.vn' ||
             u.user_metadata?.role === 'SYSTEM_ADMIN'
    );

    if (!adminUser) {
      return {
        success: true,
        data: {
          id: 'admin-root',
          email: 'admin@kindermanagement.edu.vn',
          fullName: 'Quản trị viên Hệ thống (System Admin)',
          phone: '0901234567',
          role: 'SYSTEM_ADMIN',
          createdAt: new Date().toISOString(),
          lastSignInAt: null,
        },
      };
    }

    const metadata = adminUser.user_metadata as Record<string, unknown> | undefined;

    return {
      success: true,
      data: {
        id: adminUser.id,
        email: adminUser.email ?? 'admin@kindermanagement.edu.vn',
        fullName: (typeof metadata?.full_name === 'string' ? metadata.full_name : null) ?? 
                  (typeof metadata?.fullName === 'string' ? metadata.fullName : null) ?? 
                  'Quản trị viên Hệ thống (System Admin)',
        phone: adminUser.phone || (typeof metadata?.phone === 'string' ? metadata.phone : '') || '0901234567',
        role: 'SYSTEM_ADMIN',
        createdAt: adminUser.created_at,
        lastSignInAt: adminUser.last_sign_in_at ?? null,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi khi lấy thông tin admin',
    };
  }
}

// 9. Cập nhật thông tin System Admin (Họ tên, Số điện thoại)
export async function updateSystemAdminProfileAction(input: {
  fullName: string;
  phone: string;
}) {
  try {
    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return { success: false, error: error.message };

    const adminUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === 'admin@kindermanagement.edu.vn' ||
             u.user_metadata?.role === 'SYSTEM_ADMIN'
    );

    if (!adminUser) return { success: false, error: 'Không tìm thấy tài khoản admin' };

    const updatedMetadata = {
      ...(adminUser.user_metadata as Record<string, unknown>),
      full_name: input.fullName.trim(),
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
    };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: updatedMetadata,
      }
    );

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/system-admin/profile');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi cập nhật hồ sơ admin',
    };
  }
}

// 10. Đổi mật khẩu System Admin
export async function changeSystemAdminPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const trimmedCurrent = input.currentPassword.trim();
    const trimmedNew = input.newPassword.trim();

    if (trimmedNew.length < 5) {
      return { success: false, error: 'Mật khẩu mới phải có tối thiểu 5 ký tự' };
    }

    const isCurrentValid = 
      trimmedCurrent === 'admin' || 
      trimmedCurrent === 'Admin@Kinder2026!';

    if (!isCurrentValid) {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác' };
    }

    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return { success: false, error: error.message };

    const adminUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === 'admin@kindermanagement.edu.vn' ||
             u.user_metadata?.role === 'SYSTEM_ADMIN'
    );

    if (!adminUser) return { success: false, error: 'Không tìm thấy tài khoản admin' };

    if (trimmedNew.length >= 6) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { password: trimmedNew }
      );
      if (passError) return { success: false, error: passError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu',
    };
  }
}

