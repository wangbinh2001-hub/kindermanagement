import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@km/db';
import { appRouter } from '../../root';

const PREFIX = `KM_TEST_SUPPORT_${Date.now()}`;

let schoolAId: string;
let schoolBId: string;
let adminAId: string;
let systemAdminId: string;

beforeAll(async () => {
  const schoolA = await prisma.school.create({
    data: { code: `${PREFIX}_A`, slug: `${PREFIX}-a`, name: `${PREFIX} School A` },
  });
  schoolAId = schoolA.id;

  const schoolB = await prisma.school.create({
    data: { code: `${PREFIX}_B`, slug: `${PREFIX}-b`, name: `${PREFIX} School B` },
  });
  schoolBId = schoolB.id;

  adminAId = `admin_a_${Date.now()}`;
  await prisma.schoolAdmin.create({ data: { schoolId: schoolAId, userId: adminAId } });

  systemAdminId = `sys_admin_${Date.now()}`;
});

afterAll(async () => {
  await prisma.supportSession.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await prisma.supportRequest.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await prisma.auditLog.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await prisma.schoolAdmin.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await prisma.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId] } } });
});

describe('System Admin Support Flow', () => {
  it('creates a support request', async () => {
    const sysCaller = appRouter.createCaller({
      prisma,
      user: { id: systemAdminId, role: 'SYSTEM_ADMIN' as const, activeSchoolId: null },
    });
    const req = await sysCaller.systemAdmin.createSupportRequest({
      schoolId: schoolAId,
      title: 'Test request title',
      description: 'Need help with system configuration issue',
      isEmergency: false,
    });
    expect(req.id).toBeDefined();
    expect(req.status).toBe('OPEN');
  });

  it('starts a support session', async () => {
    const sysCaller = appRouter.createCaller({
      prisma,
      user: { id: systemAdminId, role: 'SYSTEM_ADMIN' as const, activeSchoolId: null },
    });
    const req = await sysCaller.systemAdmin.createSupportRequest({
      schoolId: schoolAId,
      title: 'Session test title',
      description: 'Need help with system issue urgent testing',
      isEmergency: false,
    });
    const session = await sysCaller.systemAdmin.startSupportSession({
      requestId: req.id,
      durationMinutes: 30,
      reason: 'Investigating system issue for school',
    });
    expect(session.status).toBe('ACTIVE');
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('closes a support session', async () => {
    const sysCaller = appRouter.createCaller({
      prisma,
      user: { id: systemAdminId, role: 'SYSTEM_ADMIN' as const, activeSchoolId: null },
    });
    const req = await sysCaller.systemAdmin.createSupportRequest({
      schoolId: schoolAId,
      title: 'Close test request',
      description: 'Issue to resolve within school environment',
      isEmergency: false,
    });

    const session = await sysCaller.systemAdmin.startSupportSession({
      requestId: req.id,
      durationMinutes: 15,
      reason: 'Resolve issue for school admin test',
    });

    const closed = await sysCaller.systemAdmin.closeSupportSession({
      sessionId: session.id,
      resolutionSummary: 'Issue resolved',
    });
    expect(closed.status).toBe('CLOSED');
  });

  it('fails start session on closed request', async () => {
    const sysCaller = appRouter.createCaller({
      prisma,
      user: { id: systemAdminId, role: 'SYSTEM_ADMIN' as const, activeSchoolId: null },
    });
    const req = await sysCaller.systemAdmin.createSupportRequest({
      schoolId: schoolAId,
      title: 'Already closed title',
      description: 'Test closed request description long enough',
      isEmergency: false,
    });

    const session = await sysCaller.systemAdmin.startSupportSession({
      requestId: req.id,
      durationMinutes: 15,
      reason: 'Initial session to close for test case',
    });
    await sysCaller.systemAdmin.closeSupportSession({
      sessionId: session.id,
      resolutionSummary: 'Closed',
    });

    await expect(
      sysCaller.systemAdmin.startSupportSession({
        requestId: req.id,
        durationMinutes: 15,
        reason: 'Should fail because request is closed',
      }),
    ).rejects.toThrow();
  });
});
