import { z } from 'zod';

export const bmiCategoryEnum = z.enum(['UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE']);

export const createHealthRecordSchema = z.object({
  studentSchoolRelationshipId: z.string().min(1),
  classId: z.string().optional(),
  heightCm: z.number().positive().max(300),
  weightKg: z.number().positive().max(500),
  measuredAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export const healthRecordFilterSchema = z
  .object({
    studentSchoolRelationshipId: z.string().min(1),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  })
  .refine(
    ({ fromDate, toDate }) => !fromDate || !toDate || fromDate <= toDate,
    { message: 'fromDate must be on or before toDate', path: ['toDate'] },
  );