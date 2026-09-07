import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, Prisma } from '../src';

const PREFIX = `KM_TEST_NUT_${Date.now()}`;

describe('Phase 9: Nutrition Module Database Integration', () => {
  let schoolId: string;
  let schoolYearId: string;
  let ingredient1Id: string;
  let ingredient2Id: string;
  let foodItemId: string;
  let grocerySheetId: string;

  beforeAll(async () => {
    // 1. Create School & School Year
    const school = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH`,
        slug: `${PREFIX.toLowerCase()}-sch`,
        name: `${PREFIX} Nutrition School`,
      },
    });
    schoolId = school.id;

    const sy = await prisma.schoolYear.create({
      data: {
        schoolId,
        name: `${PREFIX} 2026-2027`,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    schoolYearId = sy.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.groceryItem.deleteMany({
      where: { grocerySheet: { schoolId } },
    });
    await prisma.grocerySheet.deleteMany({ where: { schoolId } });
    await prisma.foodIngredient.deleteMany({
      where: { foodItem: { schoolId } },
    });
    await prisma.foodItem.deleteMany({ where: { schoolId } });
    await prisma.ingredient.deleteMany({ where: { schoolId } });
    await prisma.menu.deleteMany({ where: { schoolId } });
    await prisma.schoolYear.deleteMany({ where: { schoolId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
  });

  it('creates Ingredients with unit, price, and Kcal', async () => {
    const ing1 = await prisma.ingredient.create({
      data: {
        schoolId,
        name: 'Thịt heo nạc',
        unit: 'kg',
        unitPrice: new Prisma.Decimal(130000),
        kcalPerUnit: new Prisma.Decimal(1430.0),
        foodGroup: 'MEAT',
      },
    });
    ingredient1Id = ing1.id;

    const ing2 = await prisma.ingredient.create({
      data: {
        schoolId,
        name: 'Rau cải xanh',
        unit: 'kg',
        unitPrice: new Prisma.Decimal(25000),
        kcalPerUnit: new Prisma.Decimal(150.0),
        foodGroup: 'VEGETABLE',
      },
    });
    ingredient2Id = ing2.id;

    expect(ing1.id).toBeDefined();
    expect(Number(ing1.unitPrice)).toBe(130000);
    expect(Number(ing1.kcalPerUnit)).toBe(1430);
    expect(ing1.foodGroup).toBe('MEAT');
  });

  it('creates FoodItem with FoodIngredients recipe composition', async () => {
    const food = await prisma.foodItem.create({
      data: {
        schoolId,
        name: 'Thịt heo rim nước mắm',
        mealSlot: 'LUNCH_MAIN',
        foodGroup: 'MEAT',
        totalKcal: new Prisma.Decimal(280.0),
        ingredients: {
          create: [
            {
              ingredientId: ingredient1Id,
              quantity: new Prisma.Decimal(0.15),
              kcalContribution: new Prisma.Decimal(214.5),
            },
          ],
        },
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });
    foodItemId = food.id;

    expect(food.id).toBeDefined();
    expect(food.mealSlot).toBe('LUNCH_MAIN');
    expect(food.ingredients).toHaveLength(1);
    expect(food.ingredients[0]?.ingredient.name).toBe('Thịt heo nạc');
  });

  it('creates GrocerySheet with GroceryItems and validates status transitions', async () => {
    const sheet = await prisma.grocerySheet.create({
      data: {
        schoolId,
        month: 9,
        year: 2026,
        studentCount: 80,
        mealRateMorning: new Prisma.Decimal(15000),
        mealRateLunch: new Prisma.Decimal(35000),
        mealRateAfternoon: new Prisma.Decimal(15000),
        gasCost: new Prisma.Decimal(100000),
        electricityCost: new Prisma.Decimal(150000),
        budget: new Prisma.Decimal(4950000),
        totalPurchase: new Prisma.Decimal(4952000), // Within ±5,000 margin
        status: 'PENDING_APPROVAL',
        createdById: 'staff_kitchen_1',
        items: {
          create: [
            {
              ingredientId: ingredient1Id,
              quantity: new Prisma.Decimal(25.0),
              unitPrice: new Prisma.Decimal(130000),
              totalPrice: new Prisma.Decimal(3250000),
            },
            {
              ingredientId: ingredient2Id,
              quantity: new Prisma.Decimal(68.08),
              unitPrice: new Prisma.Decimal(25000),
              totalPrice: new Prisma.Decimal(1702000),
            },
          ],
        },
      },
      include: { items: true },
    });
    grocerySheetId = sheet.id;

    expect(sheet.id).toBeDefined();
    expect(sheet.items).toHaveLength(2);
    expect(Number(sheet.totalPurchase)).toBe(4952000);
    expect(sheet.status).toBe('PENDING_APPROVAL');

    // Approve sheet
    const approved = await prisma.grocerySheet.update({
      where: { id: sheet.id },
      data: {
        status: 'APPROVED',
        approvedById: 'admin_1',
        approvedAt: new Date(),
      },
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedById).toBe('admin_1');
  });

  it('creates and publishes weekly Menu', async () => {
    const menu = await prisma.menu.create({
      data: {
        schoolId,
        schoolYearId,
        weekStartDate: new Date('2026-09-01'),
        weekEndDate: new Date('2026-09-07'),
        isPublished: true,
        publishedAt: new Date(),
        publishedById: 'admin_1',
        items: {
          '2026-09-01': {
            morning: 'Cháo sườn bắp non',
            lunchMain: 'Thịt heo rim nước mắm',
            lunchSoup: 'Canh cải xanh thịt bằm',
            afternoon: 'Sữa chua + Trái cây dầm',
            totalKcal: 720,
          },
        },
      },
    });

    expect(menu.id).toBeDefined();
    expect(menu.isPublished).toBe(true);
    expect(menu.items).toBeDefined();
  });
});
