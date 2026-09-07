import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { YearsClassesClient } from './years-classes-client';

export const dynamic = 'force-dynamic';

export default async function SchoolYearsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findFirst({
    where: {
      slug: schoolSlug,
      deletedAt: null,
    },
    include: {
      schoolYears: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          startDate: 'desc',
        },
        include: {
          classes: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              name: 'asc',
            },
            select: {
              id: true,
              name: true,
              ageGroup: true,
              capacity: true,
              isActive: true,
              schoolYearId: true,
              homeroomTeacherId: true,
              assistantTeacherIds: true,
            },
          },
        },
      },
    },
  });

  if (!school) {
    notFound();
  }

  const staffMembers = await prisma.staffMember.findMany({
    where: { schoolId: school.id, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      employeeCode: true,
      roles: true,
      employmentStatus: true,
    },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <YearsClassesClient
        schoolId={school.id}
        schoolSlug={school.slug}
        schoolYears={school.schoolYears}
        staffMembers={staffMembers}
      />
    </div>
  );
}
