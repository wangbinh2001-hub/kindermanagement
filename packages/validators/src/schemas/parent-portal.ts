import { z } from 'zod';

export const switchChildSchema = z.object({
  childId: z.string().min(1),
});

export const getTuitionFilterSchema = z.object({
  status: z.enum(['SENT', 'PARTIAL', 'PAID', 'OVERDUE']).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const getHealthFilterSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const getMenuFilterSchema = z.object({
  weekStartDate: z.coerce.date().optional(),
  classId: z.string().optional(),
});