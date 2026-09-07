import { z } from 'zod';

export const parentRequestTypeEnum = z.enum([
  'MEDICATION_INSTRUCTION',
  'LATE_PICKUP',
  'PICKUP_AUTHORIZATION',
  'ABSENCE_LEAVE',
  'CHILD_CONDITION_NOTE',
  'OTHER_REQUEST',
]);

export const parentRequestStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
]);

export const createParentRequestSchema = z.object({
  type: parentRequestTypeEnum,
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  // Type-specific fields
  // MEDICATION_INSTRUCTION
  medicationName: z.string().max(200).optional(),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  // LATE_PICKUP
  expectedPickupTime: z.coerce.date().optional(),
  reason: z.string().max(500).optional(),
  // PICKUP_AUTHORIZATION
  authorizedPersonName: z.string().max(200).optional(),
  authorizedPersonPhone: z.string().max(20).optional(),
  authorizedPersonId: z.string().max(50).optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  // ABSENCE_LEAVE
  absenceStartDate: z.coerce.date().optional(),
  absenceEndDate: z.coerce.date().optional(),
  // CHILD_CONDITION_NOTE
  condition: z.string().max(500).optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
  // OTHER_REQUEST (free-text only, no extra fields)
});

export const listParentRequestsSchema = z.object({
  status: parentRequestStatusEnum.optional(),
  type: parentRequestTypeEnum.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const cancelParentRequestSchema = z.object({
  requestId: z.string().min(1),
});

/** School-side review (approve/reject) schema */
export const reviewParentRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNotes: z.string().max(1000).optional(),
});

/** School-side list filter for parent requests */
export const listSchoolParentRequestsSchema = z.object({
  status: parentRequestStatusEnum.optional(),
  type: parentRequestTypeEnum.optional(),
  studentSchoolRelationshipId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});