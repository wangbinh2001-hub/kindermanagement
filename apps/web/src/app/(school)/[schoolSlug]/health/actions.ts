'use server';

import { prisma, Prisma } from '@km/db';
import { revalidatePath } from 'next/cache';
import {
  createHealthRecordSchema,
  calculateBmi,
  getWhoBmiCategory,
} from '@km/validators';

export interface RecordHealthMeasurementInput {
  schoolSlug: string;
  schoolId: string;
  studentSchoolRelationshipId: string;
  classId?: string;
  heightCm: number;
  weightKg: number;
  measuredAt: string | Date;
  notes?: string;
  recordedBy?: string;
  userRole?: string;
}

export async function recordHealthMeasurementAction(input: RecordHealthMeasurementInput) {
  const validated = createHealthRecordSchema.parse({
    studentSchoolRelationshipId: input.studentSchoolRelationshipId,
    classId: input.classId,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    measuredAt: input.measuredAt,
    notes: input.notes,
  });

  const schoolId = input.schoolId;
  const recordedBy = input.recordedBy || 'school-admin';
  const userRole = input.userRole || 'SCHOOL_ADMIN';

  // 1. Verify student relationship belongs to this school
  const relationship = await prisma.studentSchoolRelationship.findFirst({
    where: {
      id: validated.studentSchoolRelationshipId,
      schoolId,
      deletedAt: null,
    },
    include: {
      student: true,
      classMemberships: {
        where: { endedAt: null },
        include: { class: true },
      },
    },
  });

  if (!relationship) {
    throw new Error('Học sinh không tồn tại trong trường hoặc đã thôi học.');
  }

  // 2. Authorization check: School Admin or assigned Teacher
  if (userRole === 'TEACHER') {
    const activeClass = relationship.classMemberships[0]?.class;
    const targetClassId = validated.classId || activeClass?.id;

    if (!targetClassId) {
      throw new Error('Giáo viên chỉ có thể nhập cho học sinh thuộc lớp phụ trách.');
    }

    const cls = await prisma.class.findFirst({
      where: { id: targetClassId, schoolId, deletedAt: null },
    });

    const isHomeroom = cls?.homeroomTeacherId === recordedBy;
    const isAssistant = cls?.assistantTeacherIds?.includes(recordedBy);

    if (!isHomeroom && !isAssistant) {
      throw new Error('Bạn không được phân công phụ trách lớp của học sinh này.');
    }
  } else if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
    throw new Error('Chỉ Giáo viên phụ trách hoặc Quản trị viên mới có quyền ghi nhận sức khỏe.');
  }

  // 3. Compute BMI & WHO classification based on age & gender
  const bmiValue = calculateBmi(validated.heightCm, validated.weightKg);
  const measuredDate = new Date(validated.measuredAt);
  const birthDate = new Date(relationship.student.dateOfBirth);

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

  const targetClassId =
    validated.classId ||
    relationship.currentClassId ||
    relationship.classMemberships[0]?.classId;

  // 4. Append-only health record creation
  const record = await prisma.healthRecord.create({
    data: {
      schoolId,
      studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
      classId: targetClassId,
      heightCm: new Prisma.Decimal(validated.heightCm),
      weightKg: new Prisma.Decimal(validated.weightKg),
      bmi: new Prisma.Decimal(bmiValue),
      bmiCategory: whoResult.category,
      whoReference: whoResult.reference,
      measuredAt: validated.measuredAt,
      recordedBy,
      notes: validated.notes,
    },
  });

  // 5. Audit Log
  await prisma.auditLog.create({
    data: {
      schoolId,
      userId: recordedBy,
      userRole,
      entityType: 'HealthRecord',
      entityId: record.id,
      action: 'CREATE_HEALTH_RECORD',
      afterJson: {
        id: record.id,
        studentSchoolRelationshipId: record.studentSchoolRelationshipId,
        heightCm: validated.heightCm,
        weightKg: validated.weightKg,
        bmi: bmiValue,
        bmiCategory: whoResult.category,
        whoReference: whoResult.reference,
        measuredAt: record.measuredAt.toISOString(),
      } as never,
    },
  });

  revalidatePath(`/${input.schoolSlug}/health`);

  return {
    success: true,
    record: {
      id: record.id,
      studentSchoolRelationshipId: record.studentSchoolRelationshipId,
      classId: record.classId,
      heightCm: Number(record.heightCm),
      weightKg: Number(record.weightKg),
      bmi: Number(record.bmi),
      bmiCategory: record.bmiCategory,
      whoReference: record.whoReference,
      measuredAt: record.measuredAt.toISOString(),
      notes: record.notes,
    },
  };
}

export async function getStudentHealthHistoryAction(params: {
  schoolId: string;
  studentSchoolRelationshipId: string;
}) {
  const records = await prisma.healthRecord.findMany({
    where: {
      schoolId: params.schoolId,
      studentSchoolRelationshipId: params.studentSchoolRelationshipId,
      deletedAt: null,
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { measuredAt: 'asc' },
  });

  return {
    success: true,
    history: records.map((r) => ({
      id: r.id,
      studentSchoolRelationshipId: r.studentSchoolRelationshipId,
      className: r.class?.name ?? 'Chưa phân lớp',
      heightCm: Number(r.heightCm),
      weightKg: Number(r.weightKg),
      bmi: Number(r.bmi),
      bmiCategory: (r.bmiCategory as 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE') || 'NORMAL',
      whoReference: r.whoReference,
      measuredAt: r.measuredAt.toISOString(),
      notes: r.notes,
    })),
  };
}
