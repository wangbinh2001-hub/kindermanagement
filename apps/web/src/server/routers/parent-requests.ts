import { router } from '../trpc';
import { parentProcedure, schoolProcedure } from './school-procedure';
import { prisma, Prisma } from '@km/db';
import { TRPCError } from '@trpc/server';
import {
  createParentRequestSchema,
  listParentRequestsSchema,
  cancelParentRequestSchema,
  reviewParentRequestSchema,
  listSchoolParentRequestsSchema,
} from '@km/validators';
import { canCancelRequest, canReviewRequest, isLeaveRequest, buildLeaveAbsenceDates } from '@km/validators';

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

export const parentRequestRouter = router({
  // ─── Parent-side procedures ───────────────────────────────────────

  // List parent requests for selected child
  list: parentProcedure
    .input(listParentRequestsSchema)
    .query(async ({ ctx, input }) => {
      const childId = ctx.user.childId!;
      const schoolId = ctx.user.activeSchoolId!;

      const where: Record<string, unknown> = {
        schoolId,
        studentSchoolRelationshipId: childId,
        deletedAt: null,
      };

      if (input.status) where.status = input.status;
      if (input.type) where.type = input.type;
      if (input.fromDate || input.toDate) {
        const createdAtFilter: { gte?: Date; lte?: Date } = {};
        if (input.fromDate) createdAtFilter.gte = input.fromDate;
        if (input.toDate) createdAtFilter.lte = input.toDate;
        where.createdAt = createdAtFilter;
      }

      const requests = await prisma.parentRequest.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (requests.length > input.limit) {
        const next = requests.pop();
        nextCursor = next!.id;
      }

      return {
        items: requests,
        nextCursor,
      };
    }),

  // Create a new parent request
  create: parentProcedure
    .input(createParentRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const childId = ctx.user.childId!;
      const schoolId = ctx.user.activeSchoolId!;
      const userId = ctx.user.id;

      // Verify enrollment exists
      const enrollment = await prisma.studentSchoolRelationship.findUnique({
        where: { id: childId, schoolId },
      });

      if (!enrollment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
      }

      // Prepare type-specific data
      const typeData: Record<string, unknown> = {};
      switch (input.type) {
        case 'MEDICATION_INSTRUCTION':
          typeData.medicationName = input.medicationName;
          typeData.dosage = input.dosage;
          typeData.frequency = input.frequency;
          typeData.startDate = input.startDate;
          typeData.endDate = input.endDate;
          break;
        case 'LATE_PICKUP':
          typeData.expectedPickupTime = input.expectedPickupTime;
          typeData.reason = input.reason;
          break;
        case 'PICKUP_AUTHORIZATION':
          typeData.authorizedPersonName = input.authorizedPersonName;
          typeData.authorizedPersonPhone = input.authorizedPersonPhone;
          typeData.authorizedPersonId = input.authorizedPersonId;
          typeData.validFrom = input.validFrom;
          typeData.validTo = input.validTo;
          break;
        case 'ABSENCE_LEAVE':
          typeData.absenceStartDate = input.absenceStartDate;
          typeData.absenceEndDate = input.absenceEndDate;
          break;
        case 'CHILD_CONDITION_NOTE':
          typeData.condition = input.condition;
          typeData.severity = input.severity;
          break;
        case 'OTHER_REQUEST':
          // Free-text only, no extra structured fields
          break;
      }

      const request = await prisma.parentRequest.create({
        data: {
          schoolId,
          studentSchoolRelationshipId: childId,
          type: input.type,
          title: input.title,
          description: input.description,
          status: 'PENDING',
          metadata: typeData as Prisma.InputJsonValue,
          submittedBy: userId,
        },
      });

      // Audit log
      await writeAuditLog({
        schoolId,
        userId,
        userRole: 'PARENT',
        entityType: 'ParentRequest',
        entityId: request.id,
        action: 'CREATE_PARENT_REQUEST',
        afterJson: { type: input.type, title: input.title, status: 'PENDING' },
      });

      return request;
    }),

  // Cancel a parent request (only if PENDING)
  cancel: parentProcedure
    .input(cancelParentRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const userId = ctx.user.id;

      const request = await prisma.parentRequest.findFirst({
        where: { id: input.requestId, schoolId, deletedAt: null },
      });

      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
      }

      if (!canCancelRequest(request.status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only pending requests can be cancelled' });
      }

      const updated = await prisma.parentRequest.update({
        where: { id: input.requestId },
        data: { status: 'CANCELLED' },
      });

      await writeAuditLog({
        schoolId,
        userId,
        userRole: 'PARENT',
        entityType: 'ParentRequest',
        entityId: request.id,
        action: 'CANCEL_PARENT_REQUEST',
        beforeJson: { status: request.status },
        afterJson: { status: 'CANCELLED' },
      });

      return updated;
    }),

  // ─── School-side procedures ───────────────────────────────────────

  // List all parent requests for this school (Teacher/Admin)
  listForSchool: schoolProcedure
    .input(listSchoolParentRequestsSchema)
    .query(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;

      const where: Record<string, unknown> = {
        schoolId,
        deletedAt: null,
      };

      if (input.status) where.status = input.status;
      if (input.type) where.type = input.type;
      if (input.studentSchoolRelationshipId) {
        where.studentSchoolRelationshipId = input.studentSchoolRelationshipId;
      }
      if (input.fromDate || input.toDate) {
        const createdAtFilter: { gte?: Date; lte?: Date } = {};
        if (input.fromDate) createdAtFilter.gte = input.fromDate;
        if (input.toDate) createdAtFilter.lte = input.toDate;
        where.createdAt = createdAtFilter;
      }

      const requests = await prisma.parentRequest.findMany({
        where: where as Record<string, unknown>,
        include: {
          studentSchoolRelationship: {
            include: {
              student: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (requests.length > input.limit) {
        const next = requests.pop();
        nextCursor = next!.id;
      }

      return {
        items: requests.map((r) => ({
          ...r,
          studentName: `${r.studentSchoolRelationship.student.lastName} ${r.studentSchoolRelationship.student.firstName}`,
        })),
        nextCursor,
      };
    }),

  // Approve or reject a parent request (Teacher/Admin)
  review: schoolProcedure
    .input(reviewParentRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const userId = ctx.user.id;
      const userRole = ctx.user.role;

      const request = await prisma.parentRequest.findFirst({
        where: { id: input.requestId, schoolId, deletedAt: null },
      });

      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
      }

      if (!canReviewRequest(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be reviewed',
        });
      }

      const newStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      const updated = await prisma.parentRequest.update({
        where: { id: input.requestId },
        data: {
          status: newStatus,
          reviewedById: userId,
          reviewedByRole: userRole,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        },
      });

      // Side-effect: ABSENCE_LEAVE approval → create AttendanceRecord(ABSENT_EXCUSED)
      if (input.action === 'APPROVE' && isLeaveRequest(request.type)) {
        const metadata = request.metadata as Record<string, unknown> | null;
        const absenceStart = metadata?.absenceStartDate
          ? new Date(metadata.absenceStartDate as string)
          : null;
        const absenceEnd = metadata?.absenceEndDate
          ? new Date(metadata.absenceEndDate as string)
          : null;

        if (absenceStart && absenceEnd) {
          const leaveDates = buildLeaveAbsenceDates(absenceStart, absenceEnd);

          // Get current class membership for the student (to get classId and schoolYearId)
          const membership = await prisma.classMembership.findFirst({
            where: {
              studentSchoolRelationshipId: request.studentSchoolRelationshipId,
              endedAt: null,
            },
            include: { class: true },
          });

          // Get the reviewer's StaffMember record (required for recordedById)
          const staffMember = await prisma.staffMember.findFirst({
            where: { userId, schoolId, deletedAt: null },
          });

          if (membership && staffMember) {
            for (const dateStr of leaveDates) {
              const recordDate = new Date(dateStr + 'T00:00:00.000Z');

              // Upsert: don't fail if record already exists for that day
              await prisma.attendanceRecord.upsert({
                where: {
                  unique_student_date: {
                    studentSchoolRelationshipId: request.studentSchoolRelationshipId,
                    date: recordDate,
                  },
                },
                update: {
                  status: 'ABSENT_EXCUSED',
                  notes: `Tự động từ yêu cầu nghỉ học #${request.id.slice(0, 8)}`,
                },
                create: {
                  schoolId,
                  schoolYearId: membership.schoolYearId,
                  classId: membership.classId,
                  studentSchoolRelationshipId: request.studentSchoolRelationshipId,
                  date: recordDate,
                  status: 'ABSENT_EXCUSED',
                  method: 'PARENT_REQUEST',
                  notes: `Tự động từ yêu cầu nghỉ học #${request.id.slice(0, 8)}`,
                  recordedById: staffMember.id,
                },
              });
            }
          }
        }
      }

      // Audit log
      await writeAuditLog({
        schoolId,
        userId,
        userRole,
        entityType: 'ParentRequest',
        entityId: request.id,
        action: input.action === 'APPROVE' ? 'APPROVE_PARENT_REQUEST' : 'REJECT_PARENT_REQUEST',
        beforeJson: { status: request.status },
        afterJson: { status: newStatus, reviewNotes: input.reviewNotes },
      });

      return updated;
    }),
});