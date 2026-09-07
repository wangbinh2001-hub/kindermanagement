import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@km/db';
import { appRouter } from '../../src/server/root';
import { TRPCError } from '@trpc/server';

const PREFIX = `KM_TEST_NUT_TEN_${Date.now()}`;

describe('Phase 9: Nutrition Module — Tenancy Isolation & Approval Authorization', () => {
  let schoolAId: string;
  let schoolBId: string;
  let schoolYearAId: string;

  let adminAUserId: string;
  let adminBUserId: string;
  let staffUserId: string;

  let ingredientAId: string;
  let grocerySheetAId: string;
  let menuAId: string;

  beforeAll(async () => {
    // 1. Create Schools
    const schoolA = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH_A`,
        slug: `${PREFIX.toLowerCase()}-sch-a`,
        name: `${PREFIX} School A`,
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH_B`,
        slug: `${PREFIX.toLowerCase()}-sch-b`,
        name: `${PREFIX} School B`,
      },
    });
    schoolBId = schoolB.id;

    // 2. Create School Year
    const syA = await prisma.schoolYear.create({
      data: {
        schoolId: schoolAId,
        name: `${PREFIX} 2026-2027`,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    schoolYearAId = syA.id;

    // 3. Create Users and Bind Roles
    adminAUserId = `admin_a_${Date.now()}`;
    adminBUserId = `admin_b_${Date.now()}`;
    staffUserId = `staff_${Date.now()}`;

    await prisma.schoolAdmin.create({
      data: { schoolId: schoolAId, userId: adminAUserId },
    });
    await prisma.schoolAdmin.create({
      data: { schoolId: schoolBId, userId: adminBUserId },
    });
    await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: staffUserId,
        hiredAt: new Date(),
        roles: ['STAFF'],
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.groceryItem.deleteMany({
      where: { grocerySheet: { schoolId: { in: [schoolAId, schoolBId] } } },
    });
    await prisma.grocerySheet.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.foodIngredient.deleteMany({
      where: { foodItem: { schoolId: { in: [schoolAId, schoolBId] } } },
    });
    await prisma.foodItem.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.ingredient.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.menu.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.staffMember.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.schoolAdmin.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.schoolYear.deleteMany({
      where: { schoolId: { in: [schoolAId, schoolBId] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [schoolAId, schoolBId] } },
    });
  });

  it('School Admin A creates an ingredient; School B cannot see or modify it', async () => {
    const callerA = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    const ing = await callerA.nutrition.createIngredient({
      name: 'Thịt bò phi lê',
      unit: 'kg',
      unitPrice: 280000,
      kcalPerUnit: 2500,
      foodGroup: 'MEAT',
      isActive: true,
    });

    expect(ing.id).toBeDefined();
    expect(ing.schoolId).toBe(schoolAId);
    ingredientAId = ing.id;

    // Caller B querying ingredients
    const callerB = appRouter.createCaller({
      prisma,
      user: { id: adminBUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolBId },
    });

    const bIngredients = await callerB.nutrition.listIngredients();
    expect(bIngredients.some((x) => x.id === ingredientAId)).toBe(false);

    // Caller B attempting to delete School A's ingredient
    await expect(
      callerB.nutrition.deleteIngredient({ id: ingredientAId })
    ).rejects.toThrow(TRPCError);
  });

  it('Enforces ±5,000 VNĐ margin constraint when creating grocery sheets', async () => {
    const callerA = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    // Budget = (15k + 35k + 15k) * 50 - (100k + 150k) = 3,250,000 - 250,000 = 3,000,000 VNĐ
    // Case 1: Total purchase = 3,100,000 (exceeds 3,005,000 max allowed) -> MUST FAIL
    await expect(
      callerA.nutrition.createGrocerySheet({
        month: 9,
        year: 2026,
        studentCount: 50,
        mealRateMorning: 15000,
        mealRateLunch: 35000,
        mealRateAfternoon: 15000,
        gasCost: 100000,
        electricityCost: 150000,
        items: [
          {
            ingredientId: ingredientAId,
            quantity: 11.071,
            unitPrice: 280000, // ~ 3,100,000
          },
        ],
      })
    ).rejects.toThrow(TRPCError);

    // Case 2: Total purchase = 3,002,000 (within ±5,000 VNĐ) -> MUST SUCCEED
    const sheet = await callerA.nutrition.createGrocerySheet({
      month: 9,
      year: 2026,
      studentCount: 50,
      mealRateMorning: 15000,
      mealRateLunch: 35000,
      mealRateAfternoon: 15000,
      gasCost: 100000,
      electricityCost: 150000,
      items: [
        {
          ingredientId: ingredientAId,
          quantity: 10.7214,
          unitPrice: 280000, // 3,002,000 VNĐ
        },
      ],
    });

    expect(sheet.id).toBeDefined();
    expect(sheet.status).toBe('PENDING_APPROVAL');
    expect(Number(sheet.budget)).toBe(3000000);
    grocerySheetAId = sheet.id;
  });

  it('Non-admin staff is forbidden from approving grocery sheet; School Admin approves with AuditLog', async () => {
    // Non-admin staff attempting to approve
    const callerStaff = appRouter.createCaller({
      prisma,
      user: { id: staffUserId, role: 'STAFF', activeSchoolId: schoolAId },
    });

    await expect(
      callerStaff.nutrition.approveGrocerySheet({
        sheetId: grocerySheetAId,
        approved: true,
      })
    ).rejects.toThrow(TRPCError);

    // School Admin A approves
    const callerA = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    const approved = await callerA.nutrition.approveGrocerySheet({
      sheetId: grocerySheetAId,
      approved: true,
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedById).toBe(adminAUserId);

    // Verify AuditLog
    const audit = await prisma.auditLog.findFirst({
      where: {
        schoolId: schoolAId,
        action: 'APPROVE_GROCERY_SHEET',
        entityId: grocerySheetAId,
      },
    });
    expect(audit).not.toBeNull();
    expect(audit?.userId).toBe(adminAUserId);
  });

  it('Menu planning & publishing records AuditLog and enforces tenancy isolation', async () => {
    const callerA = appRouter.createCaller({
      prisma,
      user: { id: adminAUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolAId },
    });

    const menu = await callerA.nutrition.saveWeeklyMenu({
      schoolYearId: schoolYearAId,
      weekStartDate: new Date('2026-09-07'),
      weekEndDate: new Date('2026-09-13'),
      items: {
        '2026-09-07': {
          morningName: 'Súp cua gà xé',
          lunchMainName: 'Thịt bò xào đậu que',
          lunchSoupName: 'Canh bí đao tôm',
          afternoonName: 'Sữa hạt sen',
          totalKcal: 750,
        },
      },
      isPublished: false,
    });

    expect(menu.id).toBeDefined();
    menuAId = menu.id;

    // Caller B cannot publish School A's menu
    const callerB = appRouter.createCaller({
      prisma,
      user: { id: adminBUserId, role: 'SCHOOL_ADMIN', activeSchoolId: schoolBId },
    });

    await expect(
      callerB.nutrition.publishMenu({ menuId: menuAId })
    ).rejects.toThrow(TRPCError);

    // Caller A publishes menu
    const published = await callerA.nutrition.publishMenu({ menuId: menuAId });
    expect(published.isPublished).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: {
        schoolId: schoolAId,
        action: 'PUBLISH_MENU',
        entityId: menuAId,
      },
    });
    expect(audit).not.toBeNull();
  });
});
