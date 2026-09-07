import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma } from '@km/db';
import { recordAttendanceSchema, updateAttendanceSchema, attendanceMatrixFilterSchema } from '@km/validators';
import { TRPCError } from '@trpc/server';

const calcOvertime = (checkOutTime?: Date | null) => {
  if (!checkOutTime) return 0;
  const h = checkOutTime.getHours();
  const m = checkOutTime.getMinutes();
  if (h < 18) return 0;
  if (h === 18 && m < 30) return 0.5;
  if (h === 18) return 1;
  if (h === 19 && m < 30) return 1.5;
  return 2;
};

export const attendanceRouter = router({
  recordDaily: schoolProcedure.input(recordAttendanceSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId!;
    const created: Awaited<ReturnType<typeof prisma.attendanceRecord.upsert>>[] = [];
    for (const r of input.records) {
      const attendance = await prisma.attendanceRecord.upsert({
        where: { unique_student_date: { studentSchoolRelationshipId: r.studentSchoolRelationshipId, date: input.date } },
        update: { status: r.status, method: r.method, notes: r.notes },
        create: {
          schoolId,
          schoolYearId: input.schoolYearId,
          classId: input.classId,
          studentSchoolRelationshipId: r.studentSchoolRelationshipId,
          date: input.date,
          status: r.status,
          method: r.method,
          notes: r.notes,
          recordedById: ctx.user.id,
        },
      });
      created.push(attendance);
    }
    return created;
  }),
  updateRecord: schoolProcedure.input(updateAttendanceSchema).mutation(async ({ ctx, input }) => {
    const before = await prisma.attendanceRecord.findFirst({ where: { id: input.attendanceId, schoolId: ctx.user.activeSchoolId! } });
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' });
    return prisma.attendanceRecord.update({ where: { id: input.attendanceId }, data: { ...input, overtimeHours: input.checkOutTime ? calcOvertime(input.checkOutTime) : input.overtimeHours } });
  }),
  getMatrix: schoolProcedure.input(attendanceMatrixFilterSchema).query(async ({ ctx, input }) => {
    const start = new Date(input.year, input.month - 1, 1);
    const end = new Date(input.year, input.month, 0);
    const records = await prisma.attendanceRecord.findMany({
      where: { schoolId: ctx.user.activeSchoolId!, classId: input.classId, schoolYearId: input.schoolYearId, date: { gte: start, lte: end }, deletedAt: null },
      orderBy: { date: 'asc' },
    });
    return records;
  }),
});
