'use server';

import { prisma } from '@km/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT_EXCUSED: 'ABSENT_EXCUSED',
  ABSENT_UNEXCUSED: 'ABSENT_UNEXCUSED',
  LATE: 'LATE',
  EARLY_LEAVE: 'EARLY_LEAVE',
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const AttendanceMethod = {
  MANUAL: 'MANUAL',
  MATRIX: 'MATRIX',
  QR_CODE: 'QR_CODE',
  PARENT_REQUEST: 'PARENT_REQUEST',
} as const;
export type AttendanceMethod = (typeof AttendanceMethod)[keyof typeof AttendanceMethod];

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================
// 1. Utilities for Overtime
// ============================================================

/**
 * Tính số giờ tăng ca từ 18:00, làm tròn 30 phút.
 * - Trước 18:00: 0 giờ
 * - 18:00 - 18:29: 0.5 giờ
 * - 18:30 - 18:59: 1.0 giờ
 * v.v...
 */
export function calculateOvertimeHours(checkOutTime: Date | null): number {
  if (!checkOutTime) return 0;

  // Lấy giờ phút của checkOutTime
  const hours = checkOutTime.getHours();
  const minutes = checkOutTime.getMinutes();

  if (hours < 18) return 0;

  const overtimeMinutes = (hours - 18) * 60 + minutes;
  const blocks = Math.floor(overtimeMinutes / 30);
  return blocks * 0.5;
}

// ============================================================
// 2. Record Daily Attendance (List View / Manual)
// ============================================================

const recordDailyAttendanceSchema = z.object({
  schoolId: z.string().min(1),
  schoolYearId: z.string().min(1),
  classId: z.string().min(1),
  date: z.coerce.date(),
  records: z.array(
    z.object({
      studentSchoolRelationshipId: z.string().min(1),
      status: z.nativeEnum(AttendanceStatus),
      checkInTime: z.coerce.date().nullable().optional(),
      checkOutTime: z.coerce.date().nullable().optional(),
      notes: z.string().optional().or(z.literal('')),
    })
  ),
  recordedById: z.string().min(1),
  isEditingHistory: z.boolean().default(false), // true nếu đang sửa ngày cũ (cần quyền edit_history)
});

export type RecordDailyAttendanceInput = z.infer<typeof recordDailyAttendanceSchema>;

export async function recordDailyAttendanceAction(
  input: RecordDailyAttendanceInput
): Promise<ActionResponse> {
  try {
    const validated = recordDailyAttendanceSchema.parse(input);

    const normalizedDate = new Date(validated.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (normalizedDate.getTime() < today.getTime() && !validated.isEditingHistory) {
        return { success: false, error: 'Không có quyền sửa điểm danh của ngày cũ.' };
    }

    await prisma.$transaction(async (tx) => {
      for (const record of validated.records) {
        const overtimeHours = calculateOvertimeHours(record.checkOutTime || null);

        await tx.attendanceRecord.upsert({
          where: {
            unique_student_date: {
              studentSchoolRelationshipId: record.studentSchoolRelationshipId,
              date: normalizedDate,
            },
          },
          create: {
            schoolId: validated.schoolId,
            schoolYearId: validated.schoolYearId,
            classId: validated.classId,
            studentSchoolRelationshipId: record.studentSchoolRelationshipId,
            date: normalizedDate,
            status: record.status,
            method: 'MANUAL',
            checkInTime: record.checkInTime || null,
            checkOutTime: record.checkOutTime || null,
            overtimeHours,
            recordedById: validated.recordedById,
            notes: record.notes || null,
          },
          update: {
            status: record.status,
            checkInTime: record.checkInTime || null,
            checkOutTime: record.checkOutTime || null,
            overtimeHours,
            recordedById: validated.recordedById,
            notes: record.notes || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId: validated.schoolId,
          userId: validated.recordedById,
          userRole: 'STAFF', 
          entityType: 'AttendanceRecord',
          entityId: `class-${validated.classId}-date-${normalizedDate.toISOString()}`,
          action: 'RECORD_DAILY_ATTENDANCE',
          metadata: { classId: validated.classId, recordsCount: validated.records.length, isEditingHistory: validated.isEditingHistory },
        },
      });
    });

    return { success: true };
  } catch (err) {
    console.error('Lỗi khi lưu điểm danh:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi lưu điểm danh.',
    };
  }
}

// ============================================================
// 3. Scan QR Code Action
// ============================================================

const scanQrSchema = z.object({
  schoolId: z.string().min(1),
  schoolYearId: z.string().min(1),
  studentSchoolRelationshipId: z.string().min(1),
  classId: z.string().min(1),
  type: z.enum(['CHECK_IN', 'CHECK_OUT']),
  recordedById: z.string().min(1),
});

export type ScanQrInput = z.infer<typeof scanQrSchema>;

export async function scanQrAttendanceAction(input: ScanQrInput): Promise<ActionResponse> {
  try {
    const validated = scanQrSchema.parse(input);
    const now = new Date();
    const normalizedDate = new Date(now);
    normalizedDate.setHours(0, 0, 0, 0);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.attendanceRecord.findUnique({
        where: {
          unique_student_date: {
            studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
            date: normalizedDate,
          },
        },
      });

      if (validated.type === 'CHECK_IN') {
        if (!existing) {
          await tx.attendanceRecord.create({
            data: {
              schoolId: validated.schoolId,
              schoolYearId: validated.schoolYearId,
              classId: validated.classId,
              studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
              date: normalizedDate,
              status: 'PRESENT',
              method: 'QR_CODE',
              checkInTime: now,
              recordedById: validated.recordedById,
            },
          });
        } else {
          await tx.attendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: 'PRESENT',
              checkInTime: existing.checkInTime || now,
              method: 'QR_CODE',
              recordedById: validated.recordedById,
            },
          });
        }
      } else if (validated.type === 'CHECK_OUT') {
        const overtimeHours = calculateOvertimeHours(now);
        if (!existing) {
          await tx.attendanceRecord.create({
            data: {
              schoolId: validated.schoolId,
              schoolYearId: validated.schoolYearId,
              classId: validated.classId,
              studentSchoolRelationshipId: validated.studentSchoolRelationshipId,
              date: normalizedDate,
              status: 'PRESENT',
              method: 'QR_CODE',
              checkOutTime: now,
              overtimeHours,
              recordedById: validated.recordedById,
            },
          });
        } else {
          await tx.attendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: 'PRESENT',
              checkOutTime: now,
              overtimeHours,
              method: 'QR_CODE',
              recordedById: validated.recordedById,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          schoolId: validated.schoolId,
          userId: validated.recordedById,
          userRole: 'STAFF',
          entityType: 'AttendanceRecord',
          entityId: validated.studentSchoolRelationshipId,
          action: `QR_${validated.type}`,
          metadata: { time: now.toISOString() },
        },
      });
    });

    return { success: true };
  } catch (err) {
    console.error('Lỗi quét QR:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi quét mã QR.',
    };
  }
}
