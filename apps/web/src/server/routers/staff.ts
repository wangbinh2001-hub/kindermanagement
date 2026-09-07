import { TRPCError } from '@trpc/server';
import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma } from '@km/db';
import {
  createStaffSchema,
  updateStaffSchema,
  changeStaffStatusSchema,
  assignHomeroomTeacherSchema,
  assignAssistantTeachersSchema,
} from '@km/validators';

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
  await prisma.auditLog.create({ data: { ...opts, beforeJson: (opts.beforeJson ?? null) as never, afterJson: (opts.afterJson ?? null) as never } });
}

export const staffRouter = router({
  list: schoolProcedure.query(({ ctx }) => prisma.staffMember.findMany({ where: { schoolId: ctx.user.activeSchoolId!, deletedAt: null }, orderBy: { createdAt: 'desc' } })),
  create: schoolProcedure.input(createStaffSchema).mutation(async ({ ctx, input }) => {
    const staff = await prisma.staffMember.create({ data: { ...input, schoolId: ctx.user.activeSchoolId! } });
    await writeAuditLog({ schoolId: ctx.user.activeSchoolId!, userId: ctx.user.id, userRole: ctx.user.role, entityType: 'StaffMember', entityId: staff.id, action: 'CREATE_STAFF', afterJson: staff });
    return staff;
  }),
  update: schoolProcedure.input(updateStaffSchema).mutation(async ({ ctx, input }) => {
    const { staffId, ...data } = input;
    const before = await prisma.staffMember.findFirst({ where: { id: staffId, schoolId: ctx.user.activeSchoolId! } });
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' });
    const staff = await prisma.staffMember.update({ where: { id: staffId }, data });
    await writeAuditLog({ schoolId: ctx.user.activeSchoolId!, userId: ctx.user.id, userRole: ctx.user.role, entityType: 'StaffMember', entityId: staff.id, action: 'UPDATE_STAFF', beforeJson: before, afterJson: staff });
    return staff;
  }),
  changeStatus: schoolProcedure.input(changeStaffStatusSchema).mutation(async ({ ctx, input }) => {
    const staff = await prisma.staffMember.update({ where: { id: input.staffId }, data: { employmentStatus: input.status, resignedAt: input.status === 'ACTIVE' ? null : new Date(), notes: input.note } });
    await writeAuditLog({ schoolId: ctx.user.activeSchoolId!, userId: ctx.user.id, userRole: ctx.user.role, entityType: 'StaffMember', entityId: staff.id, action: 'CHANGE_STAFF_STATUS', afterJson: staff });
    return staff;
  }),
  assignHomeroomTeacher: schoolProcedure.input(assignHomeroomTeacherSchema).mutation(async ({ ctx, input }) => {
    const staff = await prisma.staffMember.findFirst({ where: { id: input.staffId, schoolId: ctx.user.activeSchoolId!, deletedAt: null } });
    if (!staff) throw new TRPCError({ code: 'NOT_FOUND' });
    const cls = await prisma.class.update({ where: { id: input.classId }, data: { homeroomTeacherId: input.staffId } });
    await writeAuditLog({ schoolId: ctx.user.activeSchoolId!, userId: ctx.user.id, userRole: ctx.user.role, entityType: 'Class', entityId: cls.id, action: 'ASSIGN_HOMEROOM_TEACHER', afterJson: cls });
    return cls;
  }),
  assignAssistantTeachers: schoolProcedure.input(assignAssistantTeachersSchema).mutation(async ({ ctx, input }) => {
    const cls = await prisma.class.update({ where: { id: input.classId }, data: { assistantTeacherIds: input.staffIds } });
    await writeAuditLog({ schoolId: ctx.user.activeSchoolId!, userId: ctx.user.id, userRole: ctx.user.role, entityType: 'Class', entityId: cls.id, action: 'ASSIGN_ASSISTANT_TEACHERS', afterJson: cls });
    return cls;
  }),
});