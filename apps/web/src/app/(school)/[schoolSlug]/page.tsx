import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { OverviewClient } from './overview-client';

export const dynamic = 'force-dynamic';

export default async function SchoolOverviewPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      setting: true,
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  // 1. Tìm năm học hiện tại
  const currentYear = await prisma.schoolYear.findFirst({
    where: {
      schoolId: school.id,
      isCurrent: true,
      deletedAt: null,
    },
  });

  // 2. Đếm số lớp học trong năm học hiện tại (hoặc toàn trường nếu chưa có currentYear)
  const classesCount = currentYear
    ? await prisma.class.count({
        where: {
          schoolYearId: currentYear.id,
          deletedAt: null,
        },
      })
    : 0;

  // 3. Đếm số học sinh & nhân viên
  const [studentsCount, staffCount, pendingRequestsCount] = await Promise.all([
    prisma.studentSchoolRelationship.count({
      where: {
        schoolId: school.id,
        enrollmentStatus: 'ACTIVE',
        deletedAt: null,
      },
    }),
    prisma.staffMember.count({
      where: {
        schoolId: school.id,
        employmentStatus: 'ACTIVE',
        deletedAt: null,
      },
    }),
    prisma.parentRequest.count({
      where: {
        schoolId: school.id,
        status: 'PENDING',
        deletedAt: null,
      },
    }),
  ]);

  const metrics = {
    school: {
      id: school.id,
      code: school.code,
      name: school.name,
      slug: school.slug,
      status: school.status,
    },
    currentYear: currentYear
      ? {
          id: currentYear.id,
          name: currentYear.name,
          startDate: currentYear.startDate.toLocaleDateString('vi-VN'),
          endDate: currentYear.endDate.toLocaleDateString('vi-VN'),
        }
      : null,
    classesCount,
    studentsCount,
    staffCount,
    pendingRequestsCount,
  };

  return <OverviewClient metrics={metrics} />;
}