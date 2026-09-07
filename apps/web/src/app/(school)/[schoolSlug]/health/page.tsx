import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { getSchoolOrNull } from '../layout';
import {
  HealthClient,
  SerializedHealthRecord,
  StudentOption,
} from './health-client';

export const dynamic = 'force-dynamic';

export default async function HealthPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolOrNull(schoolSlug);

  if (!school) {
    notFound();
  }

  // 1. Tìm năm học hiện tại
  const schoolYears = await prisma.schoolYear.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { startDate: 'desc' },
  });

  const activeSchoolYear =
    schoolYears.find((sy) => sy.isCurrent) || schoolYears[0] || null;
  const schoolYearId = activeSchoolYear?.id || '';

  // 2. Danh sách lớp học
  const classes = schoolYearId
    ? await prisma.class.findMany({
        where: { schoolId: school.id, schoolYearId, deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      })
    : [];

  const classMap = new Map<string, string>();
  classes.forEach((c) => classMap.set(c.id, c.name));

  // 3. Danh sách học sinh đang học
  const enrollments = schoolYearId
    ? await prisma.studentSchoolRelationship.findMany({
        where: {
          schoolId: school.id,
          schoolYearId,
          enrollmentStatus: 'ACTIVE',
          deletedAt: null,
        },
        include: {
          student: true,
          classMemberships: {
            where: { endedAt: null },
            include: { class: true },
          },
        },
        orderBy: { student: { lastName: 'asc' } },
      })
    : [];

  const studentOptions: StudentOption[] = enrollments.map((enr) => {
    const activeClass = enr.classMemberships[0]?.class;
    const className =
      activeClass?.name ||
      (enr.currentClassId ? classMap.get(enr.currentClassId) : '') ||
      'Chưa phân lớp';

    const fullName = `${enr.student.lastName} ${enr.student.middleName ? enr.student.middleName + ' ' : ''}${enr.student.firstName}`.trim();
    const studentCode = enr.student.personalIdNumber || enr.student.id.slice(-6).toUpperCase();

    return {
      relationshipId: enr.id,
      studentName: fullName,
      studentCode,
      gender: enr.student.gender as 'MALE' | 'FEMALE' | 'OTHER',
      dateOfBirth: enr.student.dateOfBirth.toISOString(),
      className,
      classId: activeClass?.id || enr.currentClassId || '',
    };
  });

  // 4. Danh sách bản ghi sức khỏe gần đây
  const rawRecords = await prisma.healthRecord.findMany({
    where: {
      schoolId: school.id,
      deletedAt: null,
    },
    include: {
      studentSchoolRelationship: {
        include: {
          student: true,
        },
      },
      class: true,
    },
    orderBy: { measuredAt: 'desc' },
    take: 100,
  });

  const serializedRecords: SerializedHealthRecord[] = rawRecords.map((r) => {
    const student = r.studentSchoolRelationship.student;
    const fullName = `${student.lastName} ${student.middleName ? student.middleName + ' ' : ''}${student.firstName}`.trim();
    const studentCode = student.personalIdNumber || student.id.slice(-6).toUpperCase();

    return {
      id: r.id,
      studentSchoolRelationshipId: r.studentSchoolRelationshipId,
      studentName: fullName,
      studentCode,
      gender: student.gender as 'MALE' | 'FEMALE' | 'OTHER',
      dateOfBirth: student.dateOfBirth.toISOString(),
      className: r.class?.name || 'Chưa phân lớp',
      classId: r.classId,
      heightCm: Number(r.heightCm),
      weightKg: Number(r.weightKg),
      bmi: Number(r.bmi),
      bmiCategory: (r.bmiCategory as 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE') || 'NORMAL',
      whoReference: r.whoReference,
      measuredAt: r.measuredAt.toISOString(),
      notes: r.notes,
      recordedBy: r.recordedBy,
    };
  });

  return (
    <HealthClient
      schoolSlug={schoolSlug}
      schoolId={school.id}
      schoolName={school.name}
      classes={classes}
      students={studentOptions}
      initialRecords={serializedRecords}
    />
  );
}