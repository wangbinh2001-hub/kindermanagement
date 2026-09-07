import { z } from 'zod';

export const employmentStatusEnum = z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']);

export const createStaffSchema = z.object({
  userId: z.string().min(1),
  employeeCode: z.string().max(50).optional(),
  roles: z.array(z.string().min(1)).min(1),
  permissions: z.array(z.string().min(1)).default([]),
  hiredAt: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});

export const updateStaffSchema = z.object({
  staffId: z.string().min(1),
  employeeCode: z.string().max(50).optional(),
  roles: z.array(z.string().min(1)).min(1).optional(),
  permissions: z.array(z.string().min(1)).optional(),
  notes: z.string().max(1000).optional(),
});

export const changeStaffStatusSchema = z.object({
  staffId: z.string().min(1),
  status: employmentStatusEnum,
  note: z.string().max(1000).optional(),
});

export const assignHomeroomTeacherSchema = z.object({
  classId: z.string().min(1),
  staffId: z.string().min(1),
});

export const assignAssistantTeachersSchema = z.object({
  classId: z.string().min(1),
  staffIds: z.array(z.string().min(1)),
});