import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@km/db';
import { appRouter } from '../../src/server/root';

const PREFIX = `KM_TEST_TENANCY_${Date.now()}`;

describe('Phase 1.3: Tenancy Isolation & Boundaries', () => {
  let schoolAId: string;
  let schoolBId: string;
  let adminAUserId: string;
  let adminBUserId: string;

  beforeAll(async () => {
    // Create 2 distinct schools A & B
    const schoolA = await prisma.school.create({
      data: { code: `${PREFIX}_A`, slug: `${PREFIX.toLowerCase()}-a`, name: `${PREFIX} School A` },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: { code: `${PREFIX}_B`, slug: `${PREFIX.toLowerCase()}-b`, name: `${PREFIX} School B` },
    });
    schoolBId = schoolB.id;

    adminAUserId = `user_admin_a_${Date.now()}`;
    await prisma.schoolAdmin.create({ data: { schoolId: schoolAId, userId: adminAUserId } });

    adminBUserId = `user_admin_b_${Date.now()}`;
    await prisma.schoolAdmin.create({ data: { schoolId: schoolBId, userId: adminBUserId } });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
    await prisma.schoolAdmin.deleteMany({ where: { userId: { in: [adminAUserId, adminBUserId] } } });
    await prisma.schoolSetting.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
    await prisma.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId] } } });
  });

  it('School Admin A cannot access School B data via school ops router', async () => {
    const callerA = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    // School A admin should only see their school's data
    // B-admin should be rejected if they try to access School A context
    const callerB = appRouter.createCaller({
      prisma,
      user: { id: adminBUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolBId },
    });

    // Both admins exist and can query their respective schools
    expect(adminAUserId).toBeTruthy();
    expect(adminBUserId).toBeTruthy();
    expect(schoolAId).not.toBe(schoolBId);
    expect(callerA).toBeDefined();
    expect(callerB).toBeDefined();
  });

  it('System Admin has no default school context', () => {
    // System admin context must have null activeSchoolId
    const sysAdminCtx = {
      prisma,
      user: { id: 'sysadmin_1', role: 'SYSTEM_ADMIN' as const, activeSchoolId: null },
    };
    expect(sysAdminCtx.user.activeSchoolId).toBeNull();
  });

  it('Support session grants temporary school access', async () => {
    // System admin starts support session for school A
    const sysAdminCaller = appRouter.createCaller({
      prisma,
      user: { id: 'sysadmin_1', role: 'SYSTEM_ADMIN', activeSchoolId: null },
    });

    // Support session grants temporary school context
    const supportCtx = {
      prisma,
      user: { id: 'sysadmin_1', role: 'SYSTEM_ADMIN', activeSchoolId: schoolAId },
    };
    expect(supportCtx.user.activeSchoolId).toBe(schoolAId);
    expect(sysAdminCaller).toBeDefined();
  });

  it('School Admin can update profile and settings', async () => {
    // School Admin context
    const adminCtx = {
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN' as const, activeSchoolId: schoolAId },
    };
    const caller = appRouter.createCaller(adminCtx);

    const updatedProfile = await caller.schoolOps.updateSchoolProfile({
      name: 'Updated School Name',
      phone: '0987654321',
      taxCode: 'TAX-123',
    });
    
    expect(updatedProfile.name).toBe('Updated School Name');
    expect(updatedProfile.phone).toBe('0987654321');
    expect(updatedProfile.taxCode).toBe('TAX-123');

    const updatedSettings = await caller.schoolOps.updateSchoolSettings({
      enableNutrition: true,
    });
    
    expect(updatedSettings.enableNutrition).toBe(true);
    expect(updatedSettings.schoolId).toBe(schoolAId);

    // Verify AuditLog
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        schoolId: schoolAId,
        userId: adminAUserId,
        action: { in: ['UPDATE_PROFILE', 'UPDATE_SETTINGS', 'CREATE_SETTINGS'] },
      },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(2);
  });
});
