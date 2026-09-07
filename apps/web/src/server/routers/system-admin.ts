import { router, systemAdminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { prisma, Prisma } from '@km/db';
import { supabaseAdmin } from '@km/auth';
import { createId } from '@paralleldrive/cuid2';
import {
  provisionSchoolSchema,
  listSchoolsFilterSchema,
  updateSchoolStatusSchema,
  deleteSchoolSchema,
  createSupportRequestSchema,
  startSupportSessionSchema,
  closeSupportSessionSchema,
  updateFeatureFlagsSchema,
} from '@km/validators/schemas/system-admin';

// ============================================================
// PHASE 2 — System Admin Router
// Module reference: docs/modules/01_system_admin.md
// ============================================================

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
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
}) {
  const { schoolId, userId, userRole, entityType, entityId, action, beforeJson, afterJson, metadata } = opts;
  await prisma.auditLog.create({
    data: {
      school: { connect: { id: schoolId } },
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

export const systemAdminRouter = router({
  provision: systemAdminProcedure
    .input(provisionSchoolSchema)
    .mutation(async ({ ctx, input }) => {
      const code = await generateSchoolCode();
      const slug = generateSlug(input.name);

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email ?? `${slug}@km.local`,
        password: input.initialPassword,
        email_confirm: true,
        user_metadata: {
          full_name: input.ownerName,
          school_code: code,
          username: input.initialUsername,
          phone: input.phone,
        },
        app_metadata: {
          role: 'SCHOOL_ADMIN',
          school_id: null,
          is_temporary_password: true,
        },
      });

      if (authError || !authUser.user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: authError?.message ?? 'Không tạo được tài khoản' });
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
            userId: authUser.user.id,
            mustChangePass: true,
          },
        });

        await tx.schoolSetting.create({
          data: { schoolId: school.id },
        });

        await tx.auditLog.create({
          data: {
            schoolId: school.id,
            userId: ctx.user!.id,
            userRole: ctx.user!.role,
            entityType: 'School',
            entityId: school.id,
            action: 'CREATE_SCHOOL',
            afterJson: jsonValue({ code, name: input.name, slug, status: 'PENDING_SETUP' }),
            metadata: jsonValue({ ownerName: input.ownerName, phone: input.phone, schoolAdminId: schoolAdmin.id }),
          },
        });

        return { school, schoolAdmin };
      });

      return {
        schoolCode: result.school.code,
        schoolId: result.school.id,
        slug: result.school.slug,
        initialUsername: input.initialUsername,
        initialPassword: input.initialPassword,
        mustChangePassword: true,
      };
    }),

  listSchools: systemAdminProcedure
    .input(listSchoolsFilterSchema)
    .query(async ({ input }) => {
      const schools = await prisma.school.findMany({
        where: {
          deletedAt: null,
          ...(input.status ? { status: input.status } : {}),
        },
        select: {
          id: true,
          code: true,
          name: true,
          ownerName: true,
          phone: true,
          slug: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
      return schools;
    }),

  updateStatus: systemAdminProcedure
    .input(updateSchoolStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const before = await prisma.school.findUnique({ where: { id: input.schoolId } });
      if (!before) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy trường' });
      if (before.deletedAt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Trường đã bị xóa' });
      if (before.status === input.status) return before;

      const updated = await prisma.school.update({
        where: { id: input.schoolId },
        data: { status: input.status },
      });

      await writeAuditLog({
        schoolId: input.schoolId,
        userId: ctx.user!.id,
        userRole: ctx.user!.role,
        entityType: 'School',
        entityId: input.schoolId,
        action: input.status === 'SUSPENDED' ? 'SUSPEND_SCHOOL' : 'ACTIVATE_SCHOOL',
        beforeJson: { status: before.status },
        afterJson: { status: input.status },
        metadata: input.reason ? { reason: input.reason } : undefined,
      });

      return updated;
    }),

  delete: systemAdminProcedure
    .input(deleteSchoolSchema)
    .mutation(async ({ ctx, input }) => {
      const school = await prisma.school.findUnique({ where: { id: input.schoolId } });
      if (!school) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy trường' });
      if (school.deletedAt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Trường đã bị xóa' });
      if (input.confirmationCode !== school.code) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mã xác nhận không khớp với mã trường' });
      }
      if (!input.adminPassword) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Thiếu mật khẩu xác thực' });
      }

      const deleted = await prisma.school.update({
        where: { id: input.schoolId },
        data: { deletedAt: new Date(), status: 'DELETED' },
      });

      await writeAuditLog({
        schoolId: input.schoolId,
        userId: ctx.user!.id,
        userRole: ctx.user!.role,
        entityType: 'School',
        entityId: input.schoolId,
        action: 'DELETE_SCHOOL',
        beforeJson: { status: school.status },
        afterJson: { status: 'DELETED' },
        metadata: { adminVerification: '2-step-verified' },
      });

      return deleted;
    }),

  createSupportRequest: systemAdminProcedure
    .input(createSupportRequestSchema)
    .mutation(async ({ input }) => {
      return prisma.supportRequest.create({
        data: {
          schoolId: input.schoolId,
          requestedBy: 'system-admin-action',
          title: input.title,
          description: input.description,
          isEmergency: input.isEmergency,
          status: 'OPEN',
        },
      });
    }),

  startSupportSession: systemAdminProcedure
    .input(startSupportSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.supportRequest.findUnique({ where: { id: input.requestId } });
      if (!request) throw new TRPCError({ code: 'NOT_FOUND', message: 'Yêu cầu hỗ trợ không tồn tại' });
      if (request.status === 'CLOSED' || request.status === 'RESOLVED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Yêu cầu đã đóng' });
      }

      const expiresAt = new Date(Date.now() + input.durationMinutes * 60_000);
      const session = await prisma.supportSession.create({
        data: {
          requestId: input.requestId,
          schoolId: request.schoolId,
          adminId: ctx.user!.id,
          reason: input.reason,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      await prisma.supportRequest.update({ where: { id: input.requestId }, data: { status: 'IN_PROGRESS' } });

      await writeAuditLog({
        schoolId: request.schoolId,
        userId: ctx.user!.id,
        userRole: ctx.user!.role,
        entityType: 'SupportSession',
        entityId: session.id,
        action: 'SUPPORT_ACCESS_START',
        afterJson: { expiresAt, scope: 'FULL_READ' },
        metadata: { reason: input.reason, requestId: input.requestId, isEmergency: request.isEmergency },
      });

      return session;
    }),

  closeSupportSession: systemAdminProcedure
    .input(closeSupportSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await prisma.supportSession.findUnique({ where: { id: input.sessionId } });
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Phiên hỗ trợ không tồn tại' });
      if (session.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phiên đã đóng hoặc hết hạn' });
      }

      const closed = await prisma.supportSession.update({
        where: { id: input.sessionId },
        data: { status: 'CLOSED', endedAt: new Date() },
      });

      await prisma.supportRequest.update({
        where: { id: session.requestId },
        data: { status: 'RESOLVED', closedAt: new Date(), closedBy: ctx.user!.id },
      });

      await writeAuditLog({
        schoolId: session.schoolId,
        userId: ctx.user!.id,
        userRole: ctx.user!.role,
        entityType: 'SupportSession',
        entityId: input.sessionId,
        action: 'SUPPORT_ACCESS_END',
        beforeJson: { status: 'ACTIVE' },
        afterJson: { status: 'CLOSED' },
        metadata: input.resolutionSummary ? { resolution: input.resolutionSummary } : undefined,
      });

      return closed;
    }),

  updateFeatureFlags: systemAdminProcedure
    .input(updateFeatureFlagsSchema)
    .mutation(async ({ ctx, input }) => {
      const { schoolId, ...flags } = input;
      const updated = await prisma.schoolSetting.upsert({
        where: { schoolId },
        create: { schoolId, ...flags },
        update: flags,
      });
      await writeAuditLog({
        schoolId,
        userId: ctx.user!.id,
        userRole: ctx.user!.role,
        entityType: 'SchoolSetting',
        entityId: schoolId,
        action: 'UPDATE_FEATURE_FLAGS',
        afterJson: flags,
      });
      return updated;
    }),
});
