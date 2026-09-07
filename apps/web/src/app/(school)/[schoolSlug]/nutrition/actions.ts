'use server';

import { prisma, Prisma } from '@km/db';
import { revalidatePath } from 'next/cache';
import {
  createIngredientSchema,
  updateIngredientSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  saveWeeklyMenuSchema,
  createGrocerySheetSchema,
  approveGrocerySheetSchema,
  calculateGroceryBudget,
  validateGroceryBudgetMargin,
  checkMenuRepetition,
} from '@km/validators';

// --- Kho nguyên liệu (Ingredients) ---

export async function createIngredientAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown
) {
  const validated = createIngredientSchema.parse(data);

  const ingredient = await prisma.ingredient.create({
    data: {
      schoolId,
      name: validated.name,
      unit: validated.unit,
      unitPrice: new Prisma.Decimal(validated.unitPrice),
      kcalPerUnit: new Prisma.Decimal(validated.kcalPerUnit),
      foodGroup: validated.foodGroup,
      isActive: validated.isActive,
    },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, ingredient };
}

export async function updateIngredientAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown
) {
  const validated = updateIngredientSchema.parse(data);

  const existing = await prisma.ingredient.findFirst({
    where: { id: validated.id, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Nguyên liệu không tồn tại hoặc đã bị xóa.');
  }

  const updated = await prisma.ingredient.update({
    where: { id: validated.id },
    data: {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.unit !== undefined && { unit: validated.unit }),
      ...(validated.unitPrice !== undefined && {
        unitPrice: new Prisma.Decimal(validated.unitPrice),
      }),
      ...(validated.kcalPerUnit !== undefined && {
        kcalPerUnit: new Prisma.Decimal(validated.kcalPerUnit),
      }),
      ...(validated.foodGroup !== undefined && { foodGroup: validated.foodGroup }),
      ...(validated.isActive !== undefined && { isActive: validated.isActive }),
    },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, ingredient: updated };
}

export async function deleteIngredientAction(
  schoolSlug: string,
  schoolId: string,
  id: string
) {
  const existing = await prisma.ingredient.findFirst({
    where: { id, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Nguyên liệu không tồn tại.');
  }

  await prisma.ingredient.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true };
}

// --- Kho món ăn (Food Items) ---

export async function createFoodItemAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown
) {
  const validated = createFoodItemSchema.parse(data);

  const foodItem = await prisma.foodItem.create({
    data: {
      schoolId,
      name: validated.name,
      mealSlot: validated.mealSlot,
      foodGroup: validated.foodGroup,
      totalKcal: new Prisma.Decimal(validated.totalKcal),
      ingredients: {
        create: validated.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: new Prisma.Decimal(ing.quantity),
          kcalContribution: new Prisma.Decimal(ing.kcalContribution),
        })),
      },
    },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, foodItem };
}

export async function updateFoodItemAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown
) {
  const validated = updateFoodItemSchema.parse(data);

  const existing = await prisma.foodItem.findFirst({
    where: { id: validated.id, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Món ăn không tồn tại hoặc đã bị xóa.');
  }

  const updated = await prisma.foodItem.update({
    where: { id: validated.id },
    data: {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.mealSlot !== undefined && { mealSlot: validated.mealSlot }),
      ...(validated.foodGroup !== undefined && { foodGroup: validated.foodGroup }),
      ...(validated.totalKcal !== undefined && {
        totalKcal: new Prisma.Decimal(validated.totalKcal),
      }),
      ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      ...(validated.ingredients !== undefined && {
        ingredients: {
          deleteMany: {},
          create: validated.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            quantity: new Prisma.Decimal(ing.quantity),
            kcalContribution: new Prisma.Decimal(ing.kcalContribution),
          })),
        },
      }),
    },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, foodItem: updated };
}

export async function deleteFoodItemAction(
  schoolSlug: string,
  schoolId: string,
  id: string
) {
  const existing = await prisma.foodItem.findFirst({
    where: { id, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Món ăn không tồn tại.');
  }

  await prisma.foodItem.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true };
}

// --- Thực đơn (Menu Planning) ---

export async function saveWeeklyMenuAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown
) {
  const validated = saveWeeklyMenuSchema.parse(data);

  // 1. Kiểm tra quy tắc trùng lặp thực đơn trong tháng (không quá 4 ngày/tháng)
  const monthStart = new Date(validated.weekStartDate);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);
  monthEnd.setHours(23, 59, 59, 999);

  // Lấy các menu khác trong tháng của trường
  const otherMenus = await prisma.menu.findMany({
    where: {
      schoolId,
      weekStartDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
    },
  });

  // Gom các ngày combo trong tháng
  const allDayCombos: Array<{
    date: string;
    morningId?: string | null;
    lunchMainId?: string | null;
    lunchSoupId?: string | null;
    afternoonId?: string | null;
  }> = [];

  for (const m of otherMenus) {
    // Bỏ qua chính tuần đang cập nhật
    if (m.weekStartDate.toISOString().split('T')[0] === validated.weekStartDate.toISOString().split('T')[0]) {
      continue;
    }
    const items = m.items as Record<string, { morningId?: string; lunchMainId?: string; lunchSoupId?: string; afternoonId?: string }>;
    if (items) {
      for (const [date, item] of Object.entries(items)) {
        allDayCombos.push({
          date,
          morningId: item.morningId,
          lunchMainId: item.lunchMainId,
          lunchSoupId: item.lunchSoupId,
          afternoonId: item.afternoonId,
        });
      }
    }
  }

  // Thêm các ngày của tuần mới đang nhập
  for (const [date, item] of Object.entries(validated.items)) {
    allDayCombos.push({
      date,
      morningId: item.morningId,
      lunchMainId: item.lunchMainId,
      lunchSoupId: item.lunchSoupId,
      afternoonId: item.afternoonId,
    });
  }

  const repetitionCheck = checkMenuRepetition(allDayCombos);
  if (!repetitionCheck.isValid) {
    const violation = repetitionCheck.violations[0];
    throw new Error(
      `Quy tắc trùng thực đơn vi phạm: Một combo nguyên ngày lặp lại ${violation?.count} lần trong tháng (vượt quá mức tối đa 4 ngày cho phép).`
    );
  }

  // 2. Lưu hoặc cập nhật Menu
  const existing = await prisma.menu.findFirst({
    where: {
      schoolId,
      weekStartDate: validated.weekStartDate,
      deletedAt: null,
    },
  });

  let menu;
  if (existing) {
    menu = await prisma.menu.update({
      where: { id: existing.id },
      data: {
        items: validated.items as never,
        isPublished: validated.isPublished,
        notes: validated.notes,
        ...(validated.isPublished && !existing.isPublished && {
          publishedAt: new Date(),
        }),
      },
    });
  } else {
    menu = await prisma.menu.create({
      data: {
        schoolId,
        schoolYearId: validated.schoolYearId,
        weekStartDate: validated.weekStartDate,
        weekEndDate: validated.weekEndDate,
        items: validated.items as never,
        isPublished: validated.isPublished,
        publishedAt: validated.isPublished ? new Date() : null,
        notes: validated.notes,
      },
    });
  }

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, menu };
}

export async function publishWeeklyMenuAction(
  schoolSlug: string,
  schoolId: string,
  menuId: string,
  publishedBy: string = 'school-admin'
) {
  const existing = await prisma.menu.findFirst({
    where: { id: menuId, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Thực đơn không tồn tại.');
  }

  const updated = await prisma.menu.update({
    where: { id: menuId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      publishedById: publishedBy,
    },
  });

  await prisma.auditLog.create({
    data: {
      schoolId,
      userId: publishedBy,
      userRole: 'SCHOOL_ADMIN',
      entityType: 'Menu',
      entityId: menuId,
      action: 'PUBLISH_MENU',
      metadata: {
        menuId,
        weekStartDate: existing.weekStartDate.toISOString(),
        weekEndDate: existing.weekEndDate.toISOString(),
      },
    },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, menu: updated };
}

// --- Phiếu đi chợ (Grocery Sheets) ---

export async function createGrocerySheetAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown,
  userId: string = 'kitchen-staff'
) {
  const validated = createGrocerySheetSchema.parse(data);

  // 1. Tính toán ngân sách
  const budget = calculateGroceryBudget({
    mealRateMorning: validated.mealRateMorning,
    mealRateLunch: validated.mealRateLunch,
    mealRateAfternoon: validated.mealRateAfternoon,
    studentCount: validated.studentCount,
    gasCost: validated.gasCost,
    electricityCost: validated.electricityCost,
  });

  // 2. Tính tổng tiền mua thực tế từ các item
  let totalPurchase = 0;
  const itemsData = validated.items.map((it) => {
    const totalLine = Math.round(it.quantity * it.unitPrice);
    totalPurchase += totalLine;
    return {
      ingredientId: it.ingredientId,
      quantity: new Prisma.Decimal(it.quantity),
      unitPrice: new Prisma.Decimal(it.unitPrice),
      totalPrice: new Prisma.Decimal(totalLine),
    };
  });

  // 3. Ràng buộc biên ±5.000 VNĐ
  const marginCheck = validateGroceryBudgetMargin(budget, totalPurchase);
  if (!marginCheck.valid) {
    throw new Error(marginCheck.message);
  }

  // 4. Tạo phiếu đi chợ
  const sheet = await prisma.grocerySheet.create({
    data: {
      schoolId,
      month: validated.month,
      year: validated.year,
      studentCount: validated.studentCount,
      mealRateMorning: new Prisma.Decimal(validated.mealRateMorning),
      mealRateLunch: new Prisma.Decimal(validated.mealRateLunch),
      mealRateAfternoon: new Prisma.Decimal(validated.mealRateAfternoon),
      gasCost: new Prisma.Decimal(validated.gasCost),
      electricityCost: new Prisma.Decimal(validated.electricityCost),
      budget: new Prisma.Decimal(budget),
      totalPurchase: new Prisma.Decimal(totalPurchase),
      status: 'PENDING_APPROVAL',
      createdById: userId,
      notes: validated.notes,
      items: {
        create: itemsData,
      },
    },
    include: { items: true },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, sheet };
}

export async function approveGrocerySheetAction(
  schoolSlug: string,
  schoolId: string,
  data: unknown,
  approverId: string = 'school-admin'
) {
  const validated = approveGrocerySheetSchema.parse(data);

  const existing = await prisma.grocerySheet.findFirst({
    where: { id: validated.sheetId, schoolId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Phiếu đi chợ không tồn tại.');
  }

  if (existing.status !== 'PENDING_APPROVAL') {
    throw new Error(
      `Chỉ có thể duyệt phiếu ở trạng thái Chờ duyệt. Trạng thái hiện tại: ${existing.status}`
    );
  }

  const newStatus = validated.approved ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.grocerySheet.update({
    where: { id: validated.sheetId },
    data: {
      status: newStatus,
      approvedById: approverId,
      approvedAt: new Date(),
      rejectionReason: validated.approved ? null : validated.rejectionReason,
    },
  });

  await prisma.auditLog.create({
    data: {
      schoolId,
      userId: approverId,
      userRole: 'SCHOOL_ADMIN',
      entityType: 'GrocerySheet',
      entityId: existing.id,
      action: validated.approved ? 'APPROVE_GROCERY_SHEET' : 'REJECT_GROCERY_SHEET',
      metadata: {
        sheetId: existing.id,
        month: existing.month,
        year: existing.year,
        totalPurchase: Number(existing.totalPurchase),
        status: newStatus,
        rejectionReason: validated.rejectionReason || null,
      },
    },
  });

  revalidatePath(`/${schoolSlug}/nutrition`);
  return { success: true, sheet: updated };
}
