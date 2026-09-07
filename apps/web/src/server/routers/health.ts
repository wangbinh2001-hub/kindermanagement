import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma } from '@km/db';
import { createHealthRecordSchema, healthRecordFilterSchema, calculateBmi, getWhoBmiCategory } from '@km/validators';
import { Prisma } from '@km/db';
import { TRPCError } from '@trpc/server';

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

export const healthRouter = router({
  createRecord: schoolProcedure.input(createHealthRecordSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId!;
    const userRole = ctx.user.role;
    const userId = ctx.user.id;

    // 1. Verify student relationship belongs to this school
    const relationship = await prisma.studentSchoolRelationship.findFirst({
      where: { id: input.studentSchoolRelationshipId, schoolId, deletedAt: null },
      include: {
        student: true,
        classMemberships: {
          where: { endedAt: null },
          include: { class: true },
        },
      },
    });

    if (!relationship) throw new TRPCError({ code: 'NOT_FOUND', message: 'Học sinh không tồn tại trong trường' });

    // 2. Permission Check: School Admin has access; Teacher must be assigned to student's class
    if (userRole === 'TEACHER') {
      const activeClass = relationship.classMemberships[0]?.class;
      const targetClassId = input.classId || activeClass?.id;

      if (!targetClassId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Giáo viên chỉ có thể nhập cho học sinh thuộc lớp phụ trách' });
      }

      const cls = await prisma.class.findFirst({
        where: { id: targetClassId, schoolId, deletedAt: null },
      });

      const isHomeroom = cls?.homeroomTeacherId === userId;
      const isAssistant = cls?.assistantTeacherIds?.includes(userId);

      if (!isHomeroom && !isAssistant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Bạn không được phân công phụ trách lớp của học sinh này' });
      }
    } else if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Chỉ Giáo viên phụ trách hoặc School Admin mới có quyền ghi nhận sức khỏe' });
    }

    // 3. Calculate BMI & WHO category
    const bmiValue = calculateBmi(input.heightCm, input.weightKg);
    const measuredDate = new Date(input.measuredAt);
    const birthDate = new Date(relationship.student.dateOfBirth);
    
    // Calculate age in months
    const ageMonths = Math.max(
      0,
      (measuredDate.getFullYear() - birthDate.getFullYear()) * 12 +
        (measuredDate.getMonth() - birthDate.getMonth())
    );

    const whoResult = getWhoBmiCategory(
      bmiValue,
      ageMonths,
      relationship.student.gender as 'MALE' | 'FEMALE' | 'OTHER'
    );

    const targetClassId = input.classId || relationship.currentClassId || relationship.classMemberships[0]?.classId;

    // 4. Create record (append-only)
    const record = await prisma.healthRecord.create({
      data: {
        schoolId,
        studentSchoolRelationshipId: input.studentSchoolRelationshipId,
        classId: targetClassId,
        heightCm: new Prisma.Decimal(input.heightCm),
        weightKg: new Prisma.Decimal(input.weightKg),
        bmi: new Prisma.Decimal(bmiValue),
        bmiCategory: whoResult.category,
        whoReference: whoResult.reference,
        measuredAt: input.measuredAt,
        recordedBy: userId,
        notes: input.notes,
      },
    });

    // 5. Audit Log
    await writeAuditLog({
      schoolId,
      userId,
      userRole,
      entityType: 'HealthRecord',
      entityId: record.id,
      action: 'CREATE_HEALTH_RECORD',
      afterJson: record,
    });

    return record;
  }),

  getHistory: schoolProcedure.input(healthRecordFilterSchema).query(async ({ ctx, input }) => {
    return prisma.healthRecord.findMany({
      where: {
        schoolId: ctx.user.activeSchoolId!,
        studentSchoolRelationshipId: input.studentSchoolRelationshipId,
        deletedAt: null,
        measuredAt: {
          gte: input.fromDate,
          lte: input.toDate,
        },
      },
      include: {
        class: true,
      },
      orderBy: { measuredAt: 'asc' },
    });
  }),
});
