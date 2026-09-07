import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { StaffListClient, type StaffListItem } from './staff-list-client';

export const metadata = {
  title: 'Đội ngũ Giáo viên & Nhân sự | KinderManagement',
  description: 'Quản trị nhân sự mầm non, phân công lớp học và ma trận phân quyền động',
};

export default async function StaffPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      classes: {
        where: { deletedAt: null, isActive: true },
        select: {
          id: true,
          name: true,
          homeroomTeacherId: true,
          assistantTeacherIds: true,
        },
      },
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  const staffMembersRaw = await prisma.staffMember.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const staffMembers: StaffListItem[] = staffMembersRaw.map((s) => {
    const homeroomClasses = school.classes
      .filter((c) => c.homeroomTeacherId === s.id)
      .map((c) => ({ id: c.id, name: c.name }));

    const assistantClasses = school.classes
      .filter((c) => c.assistantTeacherIds.includes(s.id))
      .map((c) => ({ id: c.id, name: c.name }));

    return {
      id: s.id,
      userId: s.userId,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      employeeCode: s.employeeCode,
      roles: s.roles,
      permissions: s.permissions,
      employmentStatus: s.employmentStatus,
      hiredAt: s.hiredAt.toISOString(),
      resignedAt: s.resignedAt?.toISOString() ?? null,
      notes: s.notes,
      homeroomClasses,
      assistantClasses,
    };
  });

  return (
    <StaffListClient
      schoolSlug={schoolSlug}
      schoolId={school.id}
      staffMembers={staffMembers}
    />
  );
}