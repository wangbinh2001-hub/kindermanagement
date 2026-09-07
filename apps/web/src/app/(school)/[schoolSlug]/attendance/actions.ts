'use server';

import { prisma } from '@km/db';
import { revalidatePath } from 'next/cache';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';


export async function calculateOvertimeHours(checkOutTime: string) {
  // Logic: Overtime is calculated in 30-minute blocks (1 block = 0.5h) starting from 18:00.
  const time = new Date(checkOutTime);
  const hours = time.getHours();
  const minutes = time.getMinutes();
  
  if (hours < 18) return 0;
  
  const totalMinutesPast18 = (hours - 18) * 60 + minutes;
  const blocks = Math.floor(totalMinutesPast18 / 30);
  return blocks * 0.5;
}

export async function recordDailyAttendanceAction(data: {
  schoolId: string;
  schoolYearId: string;
  classId: string;
  date: string;
  recordedById: string;
  isEditingHistory?: boolean;
  records: Array<{
    studentSchoolRelationshipId: string;
    status: AttendanceStatus;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    notes?: string | null;
  }>;
}) {
  console.log('--- recordDailyAttendanceAction CALLED ---');
  console.log('Incoming data:', JSON.stringify(data, null, 2));
  
  try {
    const dateStr = data.date.includes('T') ? data.date.split('T')[0] : data.date;
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    for (const rec of data.records) {
      let overtimeHours = 0;
      if (rec.checkOutTime) {
        overtimeHours = await calculateOvertimeHours(rec.checkOutTime);
      }

      await prisma.attendanceRecord.upsert({
        where: {
          unique_student_date: {
            studentSchoolRelationshipId: rec.studentSchoolRelationshipId,
            date: targetDate,
          }
        },
        update: {
          status: rec.status,
          checkInTime: rec.checkInTime ? new Date(rec.checkInTime) : null,
          checkOutTime: rec.checkOutTime ? new Date(rec.checkOutTime) : null,
          notes: rec.notes || null,
          overtimeHours,
          method: 'MANUAL',
          recordedById: data.recordedById,
        },
        create: {
          schoolId: data.schoolId,
          schoolYearId: data.schoolYearId,
          classId: data.classId,
          studentSchoolRelationshipId: rec.studentSchoolRelationshipId,
          date: targetDate,
          status: rec.status,
          checkInTime: rec.checkInTime ? new Date(rec.checkInTime) : null,
          checkOutTime: rec.checkOutTime ? new Date(rec.checkOutTime) : null,
          notes: rec.notes || null,
          overtimeHours,
          method: 'MANUAL',
          recordedById: data.recordedById,
        }
      });
    }

    revalidatePath('/[schoolSlug]/attendance', 'page');
    revalidatePath('/[schoolSlug]/attendance/[classId]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi lưu điểm danh:', error);
    return { success: false, error: 'Failed to record attendance' };
  }
}

export async function scanQrAttendanceAction(data: {
  schoolId: string;
  schoolYearId: string;
  classId: string;
  studentSchoolRelationshipId: string;
  type?: 'CHECK_IN' | 'CHECK_OUT';
  recordedById: string;
}) {
  try {
    // Generate YYYY-MM-DD string for current local time, then force to UTC midnight
    const now = new Date();
    // Get YYYY-MM-DD in local time
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const localDateStr = `${yyyy}-${mm}-${dd}`;
    const dateOnly = new Date(`${localDateStr}T00:00:00.000Z`);

    // Tìm xem đã điểm danh vào chưa
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        unique_student_date: {
          studentSchoolRelationshipId: data.studentSchoolRelationshipId,
          date: dateOnly,
        }
      }
    });

    if (existing) {
      if (!existing.checkOutTime && existing.status === 'PRESENT') {
        // Điểm danh ra
        const overtimeHours = await calculateOvertimeHours(now.toISOString());
        await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            checkOutTime: now,
            overtimeHours,
            method: 'QR_CODE',
          }
        });
        return { success: true, message: 'Check-out thành công', action: 'checkout' };
      } else if (existing.status !== 'PRESENT') {
        // Override nếu trước đó bị đánh vắng
        await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status: 'PRESENT',
            checkInTime: now,
            method: 'QR_CODE',
          }
        });
        return { success: true, message: 'Check-in thành công', action: 'checkin' };
      } else {
        return { success: false, error: 'Đã điểm danh ra trước đó.' };
      }
    } else {
      // Điểm danh vào
      await prisma.attendanceRecord.create({
        data: {
          schoolId: data.schoolId,
          schoolYearId: data.schoolYearId,
          classId: data.classId,
          studentSchoolRelationshipId: data.studentSchoolRelationshipId,
          date: dateOnly,
          status: 'PRESENT',
          checkInTime: now,
          method: 'QR_CODE',
          recordedById: data.recordedById,
        }
      });
      return { success: true, message: 'Check-in thành công', action: 'checkin' };
    }
  } catch (error) {
    console.error('Lỗi khi quét QR:', error);
    return { success: false, error: 'Lỗi server' };
  }
}
