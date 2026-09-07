import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { getSchoolOrNull } from '../layout';
import {
  TuitionClient,
  SerializedFeeItem,
  SerializedInvoice,
  SerializedReduction,
  SerializedStudentEnrollment,
} from './tuition-client';

export const dynamic = 'force-dynamic';

export default async function TuitionPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolOrNull(schoolSlug);

  if (!school) {
    notFound();
  }

  // Tìm năm học hiện tại
  const schoolYears = await prisma.schoolYear.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { startDate: 'desc' },
  });

  const activeSchoolYear =
    schoolYears.find((sy) => sy.isCurrent) || schoolYears[0] || null;

  const schoolYearId = activeSchoolYear?.id || '';

  // Lớp học trong năm học hiện tại
  const classes = schoolYearId
    ? await prisma.class.findMany({
        where: { schoolId: school.id, schoolYearId, deletedAt: null },
        orderBy: { name: 'asc' },
      })
    : [];

  // Danh sách học sinh đang theo học
  const rawEnrollments = schoolYearId
    ? await prisma.studentSchoolRelationship.findMany({
        where: {
          schoolId: school.id,
          schoolYearId,
          enrollmentStatus: 'ACTIVE',
          deletedAt: null,
        },
        include: {
          student: true,
        },
        orderBy: { student: { lastName: 'asc' } },
      })
    : [];

  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const students: SerializedStudentEnrollment[] = rawEnrollments.map((enr) => {
    const className = enr.currentClassId
      ? classMap.get(enr.currentClassId) || 'Chưa xếp lớp'
      : 'Chưa xếp lớp';
    return {
      id: enr.id,
      studentName: `${enr.student.lastName} ${enr.student.middleName ? enr.student.middleName + ' ' : ''}${enr.student.firstName}`,
      studentCode: enr.student.personalIdNumber || enr.student.id.slice(-6).toUpperCase(),
      className,
      classId: enr.currentClassId || '',
    };
  });

  // Hạng mục biểu phí
  const rawFeeItems = await prisma.feeItem.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const initialFeeItems: SerializedFeeItem[] = rawFeeItems.map((f) => ({
    id: f.id,
    name: f.name,
    amount: Number(f.amount),
    billingCycle: f.billingCycle,
    isMandatory: f.isMandatory,
    createdAt: f.createdAt.toISOString(),
  }));

  // Hóa đơn học phí
  const rawInvoices = await prisma.invoice.findMany({
    where: { schoolId: school.id, deletedAt: null },
    include: {
      studentSchoolRelationship: {
        include: {
          student: true,
        },
      },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const initialInvoices: SerializedInvoice[] = rawInvoices.map((inv) => {
    const st = inv.studentSchoolRelationship.student;
    const studentName = `${st.lastName} ${st.middleName ? st.middleName + ' ' : ''}${st.firstName}`;
    const studentCode = st.personalIdNumber || st.id.slice(-6).toUpperCase();
    const className = inv.studentSchoolRelationship.currentClassId
      ? classMap.get(inv.studentSchoolRelationship.currentClassId) || 'Lớp học'
      : 'Lớp học';

    return {
      id: inv.id,
      schoolId: inv.schoolId,
      studentSchoolRelationshipId: inv.studentSchoolRelationshipId,
      schoolYearId: inv.schoolYearId,
      periodMonth: inv.periodMonth,
      periodYear: inv.periodYear,
      status: inv.status,
      grossAmount: Number(inv.grossAmount),
      discountAmount: Number(inv.discountAmount),
      overtimeAmount: Number(inv.overtimeAmount),
      refundAmount: Number(inv.refundAmount),
      carriedFromPrevious: Number(inv.carriedFromPrevious),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      dueAmount: Number(inv.dueAmount),
      invoiceNumber: inv.invoiceNumber,
      issuedAt: inv.issuedAt ? inv.issuedAt.toISOString() : null,
      cancelledAt: inv.cancelledAt ? inv.cancelledAt.toISOString() : null,
      cancelReason: inv.cancelReason,
      createdAt: inv.createdAt.toISOString(),
      studentName,
      studentCode,
      className,
      items: inv.items.map((it) => ({
        id: it.id,
        name: it.name,
        amount: Number(it.amount),
      })),
    };
  });

  // Danh sách chính sách giảm trừ
  const rawReductions = await prisma.studentReduction.findMany({
    where: {
      studentSchoolRelationship: {
        schoolId: school.id,
      },
      deletedAt: null,
    },
    include: {
      studentSchoolRelationship: {
        include: {
          student: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const initialReductions: SerializedReduction[] = rawReductions.map((red) => {
    const st = red.studentSchoolRelationship.student;
    const studentName = `${st.lastName} ${st.middleName ? st.middleName + ' ' : ''}${st.firstName}`;
    const studentCode = st.personalIdNumber || st.id.slice(-6).toUpperCase();
    const className = red.studentSchoolRelationship.currentClassId
      ? classMap.get(red.studentSchoolRelationship.currentClassId) || 'Lớp học'
      : 'Lớp học';

    return {
      id: red.id,
      studentSchoolRelationshipId: red.studentSchoolRelationshipId,
      studentName,
      studentCode,
      className,
      reductionType: red.reductionType,
      value: Number(red.value),
      appliedToFeeItemId: red.appliedToFeeItemId,
      note: red.note,
      createdAt: red.createdAt.toISOString(),
    };
  });

  return (
    <TuitionClient
      schoolSlug={schoolSlug}
      schoolId={school.id}
      schoolName={school.name}
      schoolYearId={schoolYearId}
      schoolYears={schoolYears.map((sy) => ({ id: sy.id, name: sy.name }))}
      classes={classes.map((c) => ({ id: c.id, name: c.name }))}
      initialFeeItems={initialFeeItems}
      initialInvoices={initialInvoices}
      initialReductions={initialReductions}
      students={students}
    />
  );
}