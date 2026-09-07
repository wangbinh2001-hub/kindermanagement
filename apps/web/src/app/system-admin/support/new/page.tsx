import { prisma } from '@km/db';
import { NewSupportClient } from './new-support-client';

export const dynamic = 'force-dynamic';

export default async function NewSupportPage() {
  const schools = await prisma.school.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <NewSupportClient schools={schools} />;
}
