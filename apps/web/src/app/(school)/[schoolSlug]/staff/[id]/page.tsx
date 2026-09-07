import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { StaffDetailClient } from './staff-detail-client';

export const metadata = {
  title: 'Hồ sơ Nhân sự & Phân quyền | KinderManagement',
  description: 'Chi tiết hồ sơ nhân sự, phân công lớp học và ma trận phân quyền động',
};

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; id: string }>;
}) {
  const { schoolSlug, id } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      classes: {
        where: { deletedAt: null, isActive: true },
        select: {
          id: true,
          name: true,
          ageGroup: true,
          homeroomTeacherId: true,
          assistantTeacherIds: true,
        },
      },
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  const staff = await prisma.staffMember.findFirst({
    where: { id, schoolId: school.id, deletedAt: null },
  });

  if (!staff) {
    notFound();
  }

  const homeroomClasses = school.classes
    .filter((c) => c.homeroomTeacherId === staff.id)
    .map((c) => ({ id: c.id, name: c.name, ageGroup: c.ageGroup }));

  const assistantClasses = school.classes
    .filter((c) => c.assistantTeacherIds.includes(staff.id))
    .map((c) => ({ id: c.id, name: c.name, ageGroup: c.ageGroup }));

  const formattedStaff = {
    id: staff.id,
    userId: staff.userId,
    fullName: staff.fullName,
    phone: staff.phone,
    email: staff.email,
    avatarUrl: staff.avatarUrl,
    employeeCode: staff.employeeCode,
    roles: staff.roles,
    permissions: staff.permissions,
    employmentStatus: staff.employmentStatus,
    hiredAt: staff.hiredAt.toISOString(),
    resignedAt: staff.resignedAt?.toISOString() ?? null,
    notes: staff.notes,
    homeroomClasses,
    assistantClasses,
  };

  return (
    <StaffDetailClient
      schoolSlug={schoolSlug}
      schoolId={school.id}
      staff={formattedStaff}
    />
  );
}
