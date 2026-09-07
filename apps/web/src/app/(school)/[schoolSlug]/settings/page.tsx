import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SchoolSettingsPage({
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
      setting: true,
      schoolYears: {
        where: { isArchived: false },
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          name: true,
          isCurrent: true,
        },
      },
    },
  });

  if (!school) {
    notFound();
  }

  return <SettingsClient school={school} />;
}