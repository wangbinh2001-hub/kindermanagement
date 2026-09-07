import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { ClassAttendanceClient, type HistoryMatrixRow } from './class-attendance-client';

export const dynamic = 'force-dynamic';

export default async function ClassAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string; classId: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}) {
  const { schoolSlug, classId } = await params;
  const { date, tab } = await searchParams;

  const school = await prisma.school.findFirst({
    where: { slug: schoolSlug, deletedAt: null },
  });

  if (!school) notFound();

  const classData = await prisma.class.findFirst({
    where: { id: classId, schoolId: school.id, deletedAt: null },
    include: {
      memberships: {
        where: { endedAt: null },
        include: {
          relationship: {
            include: {
              student: true,
            }
          }
        }
      },
    },
  });

  if (!classData) notFound();

  // Xác định ngày đang xem
  let targetDateStr = '';
  if (date) {
    targetDateStr = date;
  } else {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    targetDateStr = `${yyyy}-${mm}-${dd}`;
  }
  const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);

  // Lấy dữ liệu điểm danh của lớp trong ngày đó
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      classId: classData.id,
      date: targetDate,
    },
    include: {
      recordedBy: {
        select: { fullName: true }
      }
    }
  });

  // Chuyển đổi thành map cho dễ xử lý trên client
  const recordsMap = attendanceRecords.reduce((acc, curr) => {
    acc[curr.studentSchoolRelationshipId] = {
      id: curr.id,
      status: curr.status,
      checkInTime: curr.checkInTime?.toISOString() || null,
      checkOutTime: curr.checkOutTime?.toISOString() || null,
      overtimeHours: curr.overtimeHours,
      method: curr.method,
      notes: curr.notes || '',
      recordedByName: curr.recordedBy?.fullName || 'Hệ thống',
    };
    return acc;
  }, {} as Record<string, any>);

  // Dữ liệu học sinh để truyền xuống client
  const students = classData.memberships.map((mem) => ({
    studentSchoolRelationshipId: mem.relationship.id,
    studentId: mem.relationship.student.id,
    fullName: mem.relationship.student.firstName + ' ' + mem.relationship.student.lastName, // Fallback if no computed fullName
    avatarUrl: null as string | null,
    studentCode: mem.relationship.student.personalIdNumber || '',
  }));

  // Lấy danh sách nhân viên để lấy ID người dùng (Staff)
  // Thực tế, việc điểm danh được recordById là một user ID. Nếu login bằng staff thì truyền ID đó.
  // Tuy nhiên, ở demo, chúng ta cho phép chọn nhân viên thực hiện nếu cần, hoặc mặc định lấy staff admin.
  const staffMembers = await prisma.staffMember.findMany({
    where: { schoolId: school.id, deletedAt: null },
    select: { id: true, fullName: true, roles: true },
  });

  // Xác định nhân viên hiện tại (giả lập Admin)
  const defaultStaff = staffMembers.find(s => s.roles.includes('SCHOOL_ADMIN')) || staffMembers[0];

  // Nếu tab là history, lấy lịch sử 30 ngày gần nhất
  let historyMatrix: HistoryMatrixRow[] = [];
  const historyDates: string[] = [];
  
  if (tab === 'history') {
    // Tạo mảng 30 ngày qua dựa trên targetDate thay vì new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr) historyDates.push(dateStr);
    }
    
    const startDate = new Date(historyDates[29] || targetDate.toISOString());
    
    const monthRecords = await prisma.attendanceRecord.findMany({
      where: {
        classId: classData.id,
        date: {
          gte: startDate,
          lte: targetDate,
        }
      },
      select: {
        studentSchoolRelationshipId: true,
        date: true,
        status: true,
      }
    });

    historyMatrix = students.map(st => {
      const row: HistoryMatrixRow = {
        studentId: st.studentId,
        studentName: st.fullName,
      };
      
      historyDates.forEach(dateStr => {
        const record = monthRecords.find(r => 
          r.studentSchoolRelationshipId === st.studentSchoolRelationshipId && 
          r.date.toISOString().split('T')[0] === dateStr
        );
        row[dateStr] = record ? record.status : undefined;
      });
      
      return row;
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ClassAttendanceClient
        schoolSlug={schoolSlug}
        classId={classData.id}
        className={classData.name}
        schoolYearId={classData.schoolYearId}
        schoolId={school.id}
        students={students}
        initialRecords={recordsMap}
        targetDate={targetDate.toISOString()}
        defaultStaffId={defaultStaff?.id || ''}
        historyMatrix={historyMatrix}
        historyDates={historyDates}
        initialTab={tab || 'daily'}
      />
    </div>
  );
}
