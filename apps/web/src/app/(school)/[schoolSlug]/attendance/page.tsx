import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { AttendanceClient } from './attendance-client';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findFirst({
    where: { slug: schoolSlug, deletedAt: null },
    include: {
      setting: true,
    }
  });

  if (!school) notFound();

  // Tìm năm học hiện tại
  const currentSchoolYearId = school.setting?.currentSchoolYearId;
  const currentSchoolYear = currentSchoolYearId ? await prisma.schoolYear.findFirst({
    where: { id: currentSchoolYearId, deletedAt: null },
  }) : null;

  if (!currentSchoolYear) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Điểm danh & Đón trả</h1>
        <Card className="border-dashed border-2 mt-6">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CalendarCheck2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Chưa thiết lập năm học hiện tại</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Bạn cần thiết lập "Năm học hiện tại" trong phần Cài đặt trường để sử dụng chức năng Điểm danh.
            </p>
            <Link href={`/${schoolSlug}/settings`}>
              <Button>Đến trang Cài đặt</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lấy danh sách các lớp trong năm học hiện tại
  const classes = await prisma.class.findMany({
    where: { schoolYearId: currentSchoolYear.id, isActive: true, deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      memberships: {
        where: {
          endedAt: null,
        },
      },
    },
  });

  const staffMembers = await prisma.staffMember.findMany({
    where: { schoolId: school.id, deletedAt: null },
    select: { id: true, fullName: true },
  });

  // Lấy dữ liệu điểm danh hôm nay cho các lớp này để làm thống kê
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecords = await prisma.attendanceRecord.findMany({
    where: {
      schoolId: school.id,
      date: today,
    },
    select: {
      classId: true,
      status: true,
    }
  });

  const classStats = classes.map((c) => {
    const classRecords = todayRecords.filter(r => r.classId === c.id);
    const present = classRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = classRecords.filter(r => r.status === 'ABSENT_EXCUSED' || r.status === 'ABSENT_UNEXCUSED').length;
    const teacher = staffMembers.find(s => s.id === c.homeroomTeacherId);
    return {
      id: c.id,
      name: c.name,
      ageGroup: c.ageGroup,
      homeroomTeacherName: teacher?.fullName || 'Chưa phân công',
      studentCount: c.memberships.length,
      presentCount: present,
      absentCount: absent,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Điểm danh & Đón trả</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Năm học: {currentSchoolYear.name}
        </p>
      </div>

      <AttendanceClient 
        schoolSlug={schoolSlug} 
        classes={classStats} 
      />
    </div>
  );
}