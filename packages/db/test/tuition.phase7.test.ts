import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/index.js';

const PREFIX = `KM_TEST_P7_${Date.now()}`;
const money = (value: string): Prisma.Decimal => new Prisma.Decimal(value);

describe('Phase 7: Tuition lifecycle', () => {
  let schoolId: string;
  let yearId: string;
  let studentId: string;
  let relationshipId: string;
  let feeItemId: string;
  let reductionId: string;
  let invoiceId: string;

  beforeAll(async () => {
    const school = await prisma.school.create({ data: { code: `${PREFIX}_CODE`, slug: `${PREFIX.toLowerCase()}-slug`, name: PREFIX } });
    schoolId = school.id;
    const year = await prisma.schoolYear.create({ data: { schoolId, name: PREFIX, startDate: new Date('2026-09-01'), endDate: new Date('2027-05-31') } });
    yearId = year.id;
    const student = await prisma.student.create({ data: { firstName: 'KM_TEST', lastName: PREFIX, gender: 'MALE', dateOfBirth: new Date('2021-01-01') } });
    studentId = student.id;
    const relationship = await prisma.studentSchoolRelationship.create({ data: { studentId, schoolId, schoolYearId: yearId } });
    relationshipId = relationship.id;
    const fee = await prisma.feeItem.create({ data: { schoolId, name: `${PREFIX}_FEE`, amount: money('1500000'), billingCycle: 'MONTHLY' } });
    feeItemId = fee.id;
    const reduction = await prisma.studentReduction.create({ data: { studentSchoolRelationshipId: relationshipId, reductionType: 'FIXED_AMOUNT', value: money('250000'), appliedToFeeItemId: feeItemId, note: PREFIX } });
    reductionId = reduction.id;
    const invoice = await prisma.invoice.create({ data: { schoolId, studentSchoolRelationshipId: relationshipId, schoolYearId: yearId, periodMonth: 9, periodYear: 2026, grossAmount: money('1500000'), discountAmount: money('250000'), totalAmount: money('1250000'), dueAmount: money('1250000'), invoiceNumber: `${PREFIX}_INV`, status: 'DRAFT' } });
    invoiceId = invoice.id;
    await prisma.invoiceItem.create({ data: { invoiceId, feeItemId, name: `${PREFIX}_ITEM`, amount: money('1500000') } });
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'ISSUED', issuedAt: new Date() } });
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: PREFIX } });
  }, 60000);

  afterAll(async () => {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    await prisma.invoice.deleteMany({ where: { id: invoiceId } });
    await prisma.studentReduction.deleteMany({ where: { id: reductionId } });
    await prisma.feeItem.deleteMany({ where: { id: feeItemId } });
    await prisma.studentSchoolRelationship.deleteMany({ where: { id: relationshipId } });
    await prisma.schoolYear.deleteMany({ where: { id: yearId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.student.deleteMany({ where: { id: studentId } });
  }, 60000);

  it('creates, issues, then cancels an invoice', async () => {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true } });
    expect(invoice?.status).toBe('CANCELLED');
    expect(invoice?.items).toHaveLength(1);
    expect(invoice?.items[0]?.feeItemId).toBe(feeItemId);
    expect(invoice?.totalAmount.toString()).toBe('1250000');
    const reduction = await prisma.studentReduction.findUnique({ where: { id: reductionId } });
    expect(reduction?.value.toString()).toBe('250000');
  });
});
