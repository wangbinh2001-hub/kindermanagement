import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma } from '@km/db';
import {
  createFeeItemSchema,
  createStudentReductionSchema,
  generateInvoiceSchema,
  issueInvoiceSchema,
  cancelInvoiceSchema,
} from '@km/validators';
import { TRPCError } from '@trpc/server';

export const tuitionRouter = router({
  listFeeItems: schoolProcedure.query(async ({ ctx }) => {
    return prisma.feeItem.findMany({
      where: { schoolId: ctx.user.activeSchoolId!, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }),

  createFeeItem: schoolProcedure.input(createFeeItemSchema).mutation(async ({ ctx, input }) => {
    return prisma.feeItem.create({
      data: {
        schoolId: ctx.user.activeSchoolId!,
        ...input,
      },
    });
  }),

  createReduction: schoolProcedure.input(createStudentReductionSchema).mutation(async ({ input }) => {
    return prisma.studentReduction.create({
      data: input,
    });
  }),

  generateInvoice: schoolProcedure.input(generateInvoiceSchema).mutation(async ({ ctx, input }) => {
    const schoolId = ctx.user.activeSchoolId!;

    const feeItems = await prisma.feeItem.findMany({
      where: { schoolId, isMandatory: true, deletedAt: null },
    });

    const grossAmount = feeItems.reduce((sum, item) => sum + Number(item.amount), 0);

    const reductions = await prisma.studentReduction.findMany({
      where: { studentSchoolRelationshipId: input.studentSchoolRelationshipId, deletedAt: null },
    });

    let discountAmount = 0;
    for (const red of reductions) {
      if (red.reductionType === 'FIXED_AMOUNT') {
        discountAmount += Number(red.value);
      } else if (red.reductionType === 'PERCENTAGE') {
        discountAmount += (grossAmount * Number(red.value)) / 100;
      }
    }

    const totalAmount = Math.max(0, grossAmount - discountAmount);

    const invoice = await prisma.invoice.create({
      data: {
        schoolId,
        studentSchoolRelationshipId: input.studentSchoolRelationshipId,
        schoolYearId: input.schoolYearId,
        periodMonth: input.periodMonth,
        periodYear: input.periodYear,
        status: 'DRAFT',
        grossAmount,
        discountAmount,
        totalAmount,
        dueAmount: totalAmount,
        items: {
          create: feeItems.map((f) => ({
            feeItemId: f.id,
            name: f.name,
            amount: f.amount,
          })),
        },
      },
      include: { items: true },
    });

    return invoice;
  }),

  issueInvoice: schoolProcedure.input(issueInvoiceSchema).mutation(async ({ ctx, input }) => {
    const inv = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, schoolId: ctx.user.activeSchoolId! },
    });
    if (!inv) throw new TRPCError({ code: 'NOT_FOUND' });
    if (inv.status !== 'DRAFT') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Hóa đơn đã được phát hành' });

    return prisma.invoice.update({
      where: { id: input.invoiceId },
      data: { status: 'ISSUED', issuedAt: new Date() },
    });
  }),

  cancelInvoice: schoolProcedure.input(cancelInvoiceSchema).mutation(async ({ ctx, input }) => {
    const inv = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, schoolId: ctx.user.activeSchoolId! },
    });
    if (!inv) throw new TRPCError({ code: 'NOT_FOUND' });

    return prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: input.cancelReason,
      },
    });
  }),
});
