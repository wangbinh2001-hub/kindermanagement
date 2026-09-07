import { prisma } from '@km/db';
import { AuditClient } from './audit-client';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      school: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  });

  return <AuditClient logs={logs} />;
}
