import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma } from '@km/db';
import { TRPCError } from '@trpc/server';
import {
  listAuditLogsSchema,
  getAuditLogByIdSchema,
  maskAuditLogEntry,
} from '@km/validators';

export const auditLogRouter = router({
  /**
   * List audit logs — School Admin sees own school, System Admin sees all.
   * PII is masked before sending to client (senior-backend: security practices).
   */
  list: schoolProcedure
    .input(listAuditLogsSchema)
    .query(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const userRole = ctx.user.role;

      // Only SCHOOL_ADMIN and SYSTEM_ADMIN can view audit logs
      if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view audit logs',
        });
      }

      const where: Record<string, unknown> = { deletedAt: null };

      // Tenant isolation: School Admin can only see their school
      if (userRole === 'SYSTEM_ADMIN' && input.schoolId) {
        where.schoolId = input.schoolId;
      } else {
        where.schoolId = schoolId;
      }

      // Filters
      if (input.entityType) where.entityType = input.entityType;
      if (input.action) where.action = input.action;
      if (input.userId) where.userId = input.userId;
      if (input.fromDate || input.toDate) {
        const createdAtFilter: { gte?: Date; lte?: Date } = {};
        if (input.fromDate) createdAtFilter.gte = input.fromDate;
        if (input.toDate) createdAtFilter.lte = input.toDate;
        where.createdAt = createdAtFilter;
      }

      const logs = await prisma.auditLog.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (logs.length > input.limit) {
        const next = logs.pop();
        nextCursor = next!.id;
      }

      // PII masking before sending to client
      const maskedLogs = logs.map((log) => maskAuditLogEntry(log));

      return {
        items: maskedLogs,
        nextCursor,
      };
    }),

  /**
   * Get single audit log entry by ID (PII masked).
   */
  getById: schoolProcedure
    .input(getAuditLogByIdSchema)
    .query(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const userRole = ctx.user.role;

      if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view audit logs',
        });
      }

      const where: Record<string, unknown> = { id: input.id };
      if (userRole !== 'SYSTEM_ADMIN') {
        where.schoolId = schoolId;
      }

      const log = await prisma.auditLog.findFirst({
        where: where as Record<string, unknown>,
      });

      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audit log not found' });
      }

      return maskAuditLogEntry(log);
    }),
});
