import { z } from 'zod';

export const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED', 'LATE', 'EARLY_LEAVE']);
export const attendanceMethodEnum = z.enum(['MANUAL', 'MATRIX', 'QR_CODE', 'PARENT_REQUEST']);

export const recordAttendanceSchema = z.object({
  classId: z.string().min(1),
  schoolYearId: z.string().min(1),
  date: z.coerce.date(),
  records: z.array(z.object({
    studentSchoolRelationshipId: z.string().min(1),
    status: attendanceStatusEnum,
    method: attendanceMethodEnum.default('MANUAL'),
    notes: z.string().max(500).optional(),
  })).min(1),
});

export const updateAttendanceSchema = z.object({
  attendanceId: z.string().min(1),
  status: attendanceStatusEnum.optional(),
  notes: z.string().max(500).optional(),
  checkInTime: z.coerce.date().optional(),
  checkOutTime: z.coerce.date().optional(),
  overtimeHours: z.number().min(0).max(24).optional(),
});

export const attendanceMatrixFilterSchema = z.object({
  classId: z.string().min(1),
  schoolYearId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});
