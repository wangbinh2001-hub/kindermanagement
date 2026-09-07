'use server';

import { prisma } from '@km/db';
import { revalidatePath } from 'next/cache';
import {
  createFeeItemSchema,
  updateFeeItemSchema,
  createStudentReductionSchema,
  generateInvoiceSchema,
  bulkGenerateInvoicesSchema,
  issueInvoiceSchema,
  cancelInvoiceSchema,
  recordPaymentSchema,
} from '@km/validators';

// Cấu hình đơn giá mặc định
const DEFAULT_OVERTIME_RATE_PER_HOUR = 50000; // 50.000 đ/giờ
const DEFAULT_MEAL_REFUND_PER_DAY = 35000;    // 35.000 đ/ngày vắng có phép

export async function createFeeItemAction(schoolSlug: string, schoolId: string, data: unknown) {
  const validated = createFeeItemSchema.parse(data);

  const feeItem = await prisma.feeItem.create({
    data: {
      schoolId,
      name: validated.name,
      amount: validated.amount,
      billingCycle: validated.billingCycle,
      isMandatory: validated.isMandatory,
    },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, feeItem };
}

export async function updateFeeItemAction(schoolSlug: string, schoolId: string, data: unknown) {
  const validated = updateFeeItemSchema.parse(data);

  const existing = await prisma.feeItem.findFirst({
    where: { id: validated.id, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Khoản thu không tồn tại hoặc đã bị xóa.');
  }

  const feeItem = await prisma.feeItem.update({
    where: { id: validated.id },
    data: {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.amount !== undefined && { amount: validated.amount }),
      ...(validated.billingCycle !== undefined && { billingCycle: validated.billingCycle }),
      ...(validated.isMandatory !== undefined && { isMandatory: validated.isMandatory }),
    },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, feeItem };
}

export async function deleteFeeItemAction(schoolSlug: string, schoolId: string, id: string) {
  const existing = await prisma.feeItem.findFirst({
    where: { id, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Khoản thu không tồn tại.');
  }

  await prisma.feeItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true };
}

export async function createStudentReductionAction(schoolSlug: string, data: unknown) {
  const validated = createStudentReductionSchema.parse(data);

  const reduction = await prisma.studentReduction.create({
    data: {
      studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
      reductionType: validated.reductionType,
      value: validated.value,
      appliedToFeeItemId: validated.appliedToFeeItemId || null,
      note: validated.note || null,
    },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, reduction };
}

export async function deleteStudentReductionAction(schoolSlug: string, id: string) {
  await prisma.studentReduction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true };
}

// Logic tính toán học phí chi tiết theo đúng công thức Module 08
export async function calculateTuitionForStudent(params: {
  schoolId: string;
  studentSchoolRelationshipId: string;
  periodMonth: number;
  periodYear: number;
}) {
  const { schoolId, studentSchoolRelationshipId, periodMonth, periodYear } = params;

  // 1. Phí cố định tháng N
  const mandatoryFeeItems = await prisma.feeItem.findMany({
    where: { schoolId, isMandatory: true, deletedAt: null },
  });

  const grossAmount = mandatoryFeeItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // 2. Mức giảm trừ
  const activeReductions = await prisma.studentReduction.findMany({
    where: { studentSchoolRelationshipId, deletedAt: null },
  });

  let discountAmount = 0;
  for (const red of activeReductions) {
    const val = Number(red.value);
    if (red.reductionType === 'FIXED_AMOUNT') {
      discountAmount += val;
    } else if (red.reductionType === 'PERCENTAGE') {
      if (red.appliedToFeeItemId) {
        const targetFee = mandatoryFeeItems.find((f) => f.id === red.appliedToFeeItemId);
        if (targetFee) {
          discountAmount += (Number(targetFee.amount) * val) / 100;
        }
      } else {
        discountAmount += (grossAmount * val) / 100;
      }
    }
  }

  // 3. Kết chuyển tháng N-1: Xác định tháng/năm N-1
  let prevMonth = periodMonth - 1;
  let prevYear = periodYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const prevMonthStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
  const prevMonthEnd = new Date(Date.UTC(prevYear, prevMonth, 0, 23, 59, 59, 999));

  const attendanceMonthPrev = await prisma.attendanceRecord.findMany({
    where: {
      studentSchoolRelationshipId,
      date: {
        gte: prevMonthStart,
        lte: prevMonthEnd,
      },
      deletedAt: null,
    },
  });

  // Phí tăng ca tháng N-1
  let totalOvertimeHours = 0;
  for (const att of attendanceMonthPrev) {
    if (att.overtimeHours) {
      totalOvertimeHours += Number(att.overtimeHours);
    }
  }
  const overtimeAmount = Math.round(totalOvertimeHours * DEFAULT_OVERTIME_RATE_PER_HOUR);

  // Hoàn tiền vắng có phép tháng N-1
  const absentExcusedCount = attendanceMonthPrev.filter((att) => att.status === 'ABSENT_EXCUSED').length;
  const refundAmount = absentExcusedCount * DEFAULT_MEAL_REFUND_PER_DAY;

  // 4. Nợ cũ kỳ trước dồn sang
  const previousInvoice = await prisma.invoice.findFirst({
    where: {
      studentSchoolRelationshipId,
      periodMonth: prevMonth,
      periodYear: prevYear,
      deletedAt: null,
      status: { not: 'CANCELLED' },
    },
  });

  const carriedFromPrevious = previousInvoice && Number(previousInvoice.dueAmount) > 0
    ? Number(previousInvoice.dueAmount)
    : 0;

  // 5. Tổng thanh toán
  const totalAmount = Math.max(
    0,
    grossAmount - discountAmount + overtimeAmount - refundAmount + carriedFromPrevious
  );

  return {
    grossAmount,
    discountAmount,
    overtimeAmount,
    refundAmount,
    carriedFromPrevious,
    totalAmount,
    dueAmount: totalAmount,
    mandatoryFeeItems,
    details: {
      totalOvertimeHours,
      absentExcusedCount,
      prevMonth,
      prevYear,
    },
  };
}

export async function generateInvoiceAction(schoolSlug: string, schoolId: string, data: unknown) {
  const validated = generateInvoiceSchema.parse(data);

  // Kiểm tra đã có hóa đơn active chưa
  const existing = await prisma.invoice.findFirst({
    where: {
      studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
      periodMonth: validated.periodMonth,
      periodYear: validated.periodYear,
      deletedAt: null,
      status: { not: 'CANCELLED' },
    },
  });

  if (existing) {
    throw new Error(
      `Đã tồn tại hóa đơn cho học sinh này trong kỳ ${validated.periodMonth}/${validated.periodYear}.`
    );
  }

  const calc = await calculateTuitionForStudent({
    schoolId,
    studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
    periodMonth: validated.periodMonth,
    periodYear: validated.periodYear,
  });

  const invoice = await prisma.invoice.create({
    data: {
      schoolId,
      studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
      schoolYearId: validated.schoolYearId,
      periodMonth: validated.periodMonth,
      periodYear: validated.periodYear,
      status: 'DRAFT',
      grossAmount: calc.grossAmount,
      discountAmount: calc.discountAmount,
      overtimeAmount: calc.overtimeAmount,
      refundAmount: calc.refundAmount,
      carriedFromPrevious: calc.carriedFromPrevious,
      totalAmount: calc.totalAmount,
      paidAmount: 0,
      dueAmount: calc.totalAmount,
      items: {
        create: [
          ...calc.mandatoryFeeItems.map((f) => ({
            feeItemId: f.id,
            name: f.name,
            amount: f.amount,
          })),
          ...(calc.overtimeAmount > 0
            ? [
                {
                  name: `Phí giữ ngoài giờ tháng ${calc.details.prevMonth} (${calc.details.totalOvertimeHours}h)`,
                  amount: calc.overtimeAmount,
                },
              ]
            : []),
          ...(calc.refundAmount > 0
            ? [
                {
                  name: `Hoàn tiền ăn vắng có phép tháng ${calc.details.prevMonth} (${calc.details.absentExcusedCount} ngày)`,
                  amount: -calc.refundAmount,
                },
              ]
            : []),
          ...(calc.carriedFromPrevious > 0
            ? [
                {
                  name: `Nợ học phí chuyển sang từ tháng ${calc.details.prevMonth}/${calc.details.prevYear}`,
                  amount: calc.carriedFromPrevious,
                },
              ]
            : []),
        ],
      },
    },
    include: { items: true },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, invoice };
}

export async function bulkGenerateInvoicesAction(schoolSlug: string, data: unknown) {
  const validated = bulkGenerateInvoicesSchema.parse(data);

  // Lấy danh sách học sinh
  const enrollments = await prisma.studentSchoolRelationship.findMany({
    where: {
      schoolId: validated.schoolId,
      schoolYearId: validated.schoolYearId,
      ...(validated.classId ? { currentClassId: validated.classId } : {}),
      enrollmentStatus: 'ACTIVE',
      deletedAt: null,
    },
  });

  let createdCount = 0;
  let skippedCount = 0;

  for (const enr of enrollments) {
    const existing = await prisma.invoice.findFirst({
      where: {
        studentSchoolRelationshipId: enr.id,
        periodMonth: validated.periodMonth,
        periodYear: validated.periodYear,
        deletedAt: null,
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const calc = await calculateTuitionForStudent({
      schoolId: validated.schoolId,
      studentSchoolRelationshipId: enr.id,
      periodMonth: validated.periodMonth,
      periodYear: validated.periodYear,
    });

    await prisma.invoice.create({
      data: {
        schoolId: validated.schoolId,
        studentSchoolRelationshipId: enr.id,
        schoolYearId: validated.schoolYearId,
        periodMonth: validated.periodMonth,
        periodYear: validated.periodYear,
        status: 'DRAFT',
        grossAmount: calc.grossAmount,
        discountAmount: calc.discountAmount,
        overtimeAmount: calc.overtimeAmount,
        refundAmount: calc.refundAmount,
        carriedFromPrevious: calc.carriedFromPrevious,
        totalAmount: calc.totalAmount,
        paidAmount: 0,
        dueAmount: calc.totalAmount,
        items: {
          create: [
            ...calc.mandatoryFeeItems.map((f) => ({
              feeItemId: f.id,
              name: f.name,
              amount: f.amount,
            })),
            ...(calc.overtimeAmount > 0
              ? [
                  {
                    name: `Phí giữ ngoài giờ tháng ${calc.details.prevMonth} (${calc.details.totalOvertimeHours}h)`,
                    amount: calc.overtimeAmount,
                  },
                ]
              : []),
            ...(calc.refundAmount > 0
              ? [
                  {
                    name: `Hoàn tiền ăn vắng có phép tháng ${calc.details.prevMonth} (${calc.details.absentExcusedCount} ngày)`,
                    amount: -calc.refundAmount,
                  },
                ]
              : []),
            ...(calc.carriedFromPrevious > 0
              ? [
                  {
                    name: `Nợ học phí chuyển sang từ tháng ${calc.details.prevMonth}/${calc.details.prevYear}`,
                    amount: calc.carriedFromPrevious,
                  },
                ]
              : []),
          ],
        },
      },
    });
    createdCount++;
  }

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, createdCount, skippedCount };
}

// Phát hành hóa đơn: Bất biến số tiền, chuyển sang ISSUED
export async function issueInvoiceAction(schoolSlug: string, schoolId: string, data: unknown) {
  const validated = issueInvoiceSchema.parse(data);

  const invoice = await prisma.invoice.findFirst({
    where: { id: validated.invoiceId, schoolId, deletedAt: null },
  });

  if (!invoice) {
    throw new Error('Không tìm thấy hóa đơn.');
  }

  if (invoice.status !== 'DRAFT') {
    throw new Error(`Chỉ có thể phát hành hóa đơn ở trạng thái Bản nháp (DRAFT). Trạng thái hiện tại: ${invoice.status}`);
  }

  // Tạo số hóa đơn chuẩn hóa: INV-YYYY-MM-XXXX
  const shortId = invoice.id.slice(-4).toUpperCase();
  const invoiceNumber = `INV-${invoice.periodYear}-${String(invoice.periodMonth).padStart(2, '0')}-${shortId}`;

  const updated = await prisma.invoice.update({
    where: { id: validated.invoiceId },
    data: {
      status: 'ISSUED',
      invoiceNumber,
      issuedAt: new Date(),
    },
  });

  // Ghi nhận AuditLog
  await prisma.auditLog.create({
    data: {
      schoolId,
      userId: 'school-admin',
      userRole: 'SCHOOL_ADMIN',
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'ISSUE_INVOICE',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
      },
    },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, invoice: updated };
}

// Ghi nhận thanh toán cho hóa đơn
export async function recordInvoicePaymentAction(schoolSlug: string, schoolId: string, data: unknown) {
  const validated = recordPaymentSchema.parse(data);

  const invoice = await prisma.invoice.findFirst({
    where: { id: validated.invoiceId, schoolId, deletedAt: null },
  });

  if (!invoice) {
    throw new Error('Không tìm thấy hóa đơn.');
  }

  if (invoice.status === 'CANCELLED') {
    throw new Error('Không thể ghi nhận thanh toán cho hóa đơn đã bị hủy.');
  }

  if (invoice.status === 'DRAFT') {
    throw new Error('Vui lòng phát hành hóa đơn (ISSUED) trước khi ghi nhận thanh toán.');
  }

  const currentPaid = Number(invoice.paidAmount);
  const total = Number(invoice.totalAmount);
  const paymentAmount = validated.amount;

  const newPaid = currentPaid + paymentAmount;
  const newDue = Math.max(0, total - newPaid);

  const newStatus = newDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

  const updated = await prisma.invoice.update({
    where: { id: validated.invoiceId },
    data: {
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
    },
  });

  // Ghi vết kiểm toán thanh toán
  await prisma.auditLog.create({
    data: {
      schoolId,
      userId: 'school-admin',
      userRole: 'SCHOOL_ADMIN',
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'RECORD_INVOICE_PAYMENT',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amountPaid: paymentAmount,
        paymentMethod: validated.paymentMethod,
        notes: validated.notes || null,
        newStatus,
      },
    },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, invoice: updated };
}

// Hủy hóa đơn (Bắt buộc nhập lý do, lưu AuditLog)
export async function cancelInvoiceAction(schoolSlug: string, schoolId: string, data: unknown) {
  const validated = cancelInvoiceSchema.parse(data);

  const invoice = await prisma.invoice.findFirst({
    where: { id: validated.invoiceId, schoolId, deletedAt: null },
  });

  if (!invoice) {
    throw new Error('Không tìm thấy hóa đơn.');
  }

  if (invoice.status === 'CANCELLED') {
    throw new Error('Hóa đơn này đã ở trạng thái đã hủy trước đó.');
  }

  const updated = await prisma.invoice.update({
    where: { id: validated.invoiceId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: validated.cancelReason,
    },
  });

  await prisma.auditLog.create({
    data: {
      schoolId,
      userId: 'school-admin',
      userRole: 'SCHOOL_ADMIN',
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'CANCEL_INVOICE',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        cancelReason: validated.cancelReason,
      },
    },
  });

  revalidatePath(`/${schoolSlug}/tuition`);
  return { success: true, invoice: updated };
}
