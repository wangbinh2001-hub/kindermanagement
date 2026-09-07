import { prisma } from '@km/db';
import { SupportClient } from './support-client';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const [activeSessions, requests] = await Promise.all([
    prisma.supportSession.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        school: { select: { code: true, name: true } },
        request: { select: { title: true, isEmergency: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.supportRequest.findMany({
      where: { deletedAt: null },
      include: {
        school: { select: { code: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return <SupportClient activeSessions={activeSessions} requests={requests} />;
}
