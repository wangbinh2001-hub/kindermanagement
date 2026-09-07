import { z } from 'zod';

export const billingCycleEnum = z.enum(['MONTHLY', 'TERMLY', 'YEARLY', 'ONE_TIME']);
export const reductionTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);
export const invoiceStatusEnum = z.enum(['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED']);

export const paymentMethodEnum = z.enum(['CASH', 'BANK_TRANSFER', 'OTHER']);

export const createFeeItemSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().int().min(0),
  billingCycle: billingCycleEnum.default('MONTHLY'),
  isMandatory: z.boolean().default(true),
});

export const updateFeeItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  amount: z.number().int().min(0).optional(),
  billingCycle: billingCycleEnum.optional(),
  isMandatory: z.boolean().optional(),
});

export const createStudentReductionSchema = z.object({
  studentSchoolRelationshipId: z.string().min(1),
  reductionType: reductionTypeEnum,
  value: z.number().min(0),
  appliedToFeeItemId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const generateInvoiceSchema = z.object({
  studentSchoolRelationshipId: z.string().min(1),
  schoolYearId: z.string().min(1),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
});

export const bulkGenerateInvoicesSchema = z.object({
  schoolId: z.string().min(1),
  schoolYearId: z.string().min(1),
  classId: z.string().optional(),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
});

export const issueInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
});

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  cancelReason: z.string().min(1).max(500),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().int().min(1),
  paymentMethod: paymentMethodEnum.default('BANK_TRANSFER'),
  notes: z.string().max(500).optional().nullable(),
});

