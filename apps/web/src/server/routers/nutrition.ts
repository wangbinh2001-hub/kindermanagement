import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma, Prisma } from '@km/db';
import {
  createIngredientSchema,
  updateIngredientSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  saveWeeklyMenuSchema,
  publishMenuSchema,
  createGrocerySheetSchema,
  approveGrocerySheetSchema,
  calculateGroceryBudget,
  validateGroceryBudgetMargin,
  checkMenuRepetition,
} from '@km/validators';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const nutritionRouter = router({
  getOverview: schoolProcedure.query(async ({ ctx }) => {
    const schoolId = ctx.user.activeSchoolId!;

    const [ingredientCount, foodItemCount, publishedMenuCount, pendingSheetsCount] =
      await Promise.all([
        prisma.ingredient.count({ where: { schoolId, deletedAt: null } }),
        prisma.foodItem.count({ where: { schoolId, deletedAt: null } }),
        prisma.menu.count({ where: { schoolId, isPublished: true, deletedAt: null } }),
        prisma.grocerySheet.count({
          where: { schoolId, status: 'PENDING_APPROVAL', deletedAt: null },
        }),
      ]);

    return {
      ingredientCount,
      foodItemCount,
      publishedMenuCount,
      pendingSheetsCount,
    };
  }),

  // Ingredients
  listIngredients: schoolProcedure.query(async ({ ctx }) => {
    const schoolId = ctx.user.activeSchoolId!;
    return prisma.ingredient.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }),

  createIngredient: schoolProcedure
    .input(createIngredientSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      return prisma.ingredient.create({
        data: {
          schoolId,
          name: input.name,
          unit: input.unit,
          unitPrice: new Prisma.Decimal(input.unitPrice),
          kcalPerUnit: new Prisma.Decimal(input.kcalPerUnit),
          foodGroup: input.foodGroup,
          isActive: input.isActive,
        },
      });
    }),

  updateIngredient: schoolProcedure
    .input(updateIngredientSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const existing = await prisma.ingredient.findFirst({
        where: { id: input.id, schoolId, deletedAt: null },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nguyên liệu không tồn tại' });
      }

      return prisma.ingredient.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.unit !== undefined && { unit: input.unit }),
          ...(input.unitPrice !== undefined && {
            unitPrice: new Prisma.Decimal(input.unitPrice),
          }),
          ...(input.kcalPerUnit !== undefined && {
            kcalPerUnit: new Prisma.Decimal(input.kcalPerUnit),
          }),
          ...(input.foodGroup !== undefined && { foodGroup: input.foodGroup }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });
    }),

  deleteIngredient: schoolProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const existing = await prisma.ingredient.findFirst({
        where: { id: input.id, schoolId, deletedAt: null },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nguyên liệu không tồn tại' });
      }

      await prisma.ingredient.update({
        where: { id: input.id },
        data: { deletedAt: new Date(), isActive: false },
      });
      return { success: true };
    }),

  // Food Items
  listFoodItems: schoolProcedure.query(async ({ ctx }) => {
    const schoolId = ctx.user.activeSchoolId!;
    return prisma.foodItem.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }),

  createFoodItem: schoolProcedure
    .input(createFoodItemSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      return prisma.foodItem.create({
        data: {
          schoolId,
          name: input.name,
          mealSlot: input.mealSlot,
          foodGroup: input.foodGroup,
          totalKcal: new Prisma.Decimal(input.totalKcal),
          ingredients: {
            create: input.ingredients.map((ing) => ({
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
    }),

  updateFoodItem: schoolProcedure
    .input(updateFoodItemSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const existing = await prisma.foodItem.findFirst({
        where: { id: input.id, schoolId, deletedAt: null },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Món ăn không tồn tại' });
      }

      return prisma.foodItem.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.mealSlot !== undefined && { mealSlot: input.mealSlot }),
          ...(input.foodGroup !== undefined && { foodGroup: input.foodGroup }),
          ...(input.totalKcal !== undefined && {
            totalKcal: new Prisma.Decimal(input.totalKcal),
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.ingredients !== undefined && {
            ingredients: {
              deleteMany: {},
              create: input.ingredients.map((ing) => ({
                ingredientId: ing.ingredientId,
                quantity: new Prisma.Decimal(ing.quantity),
                kcalContribution: new Prisma.Decimal(ing.kcalContribution),
              })),
            },
          }),
        },
      });
    }),

  deleteFoodItem: schoolProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const existing = await prisma.foodItem.findFirst({
        where: { id: input.id, schoolId, deletedAt: null },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Món ăn không tồn tại' });
      }

      await prisma.foodItem.update({
        where: { id: input.id },
        data: { deletedAt: new Date(), isActive: false },
      });
      return { success: true };
    }),

  // Menus
  getWeeklyMenu: schoolProcedure
    .input(z.object({ weekStartDate: z.coerce.date() }))
    .query(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      return prisma.menu.findFirst({
        where: {
          schoolId,
          weekStartDate: input.weekStartDate,
          deletedAt: null,
        },
      });
    }),

  saveWeeklyMenu: schoolProcedure
    .input(saveWeeklyMenuSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;

      // 1. Kiểm tra quy tắc trùng lặp thực đơn trong tháng (không quá 4 ngày/tháng)
      const monthStart = new Date(input.weekStartDate);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const otherMenus = await prisma.menu.findMany({
        where: {
          schoolId,
          weekStartDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
        },
      });

      const allDayCombos: Array<{
        date: string;
        morningId?: string | null;
        lunchMainId?: string | null;
        lunchSoupId?: string | null;
        afternoonId?: string | null;
      }> = [];

      for (const m of otherMenus) {
        if (
          m.weekStartDate.toISOString().split('T')[0] ===
          input.weekStartDate.toISOString().split('T')[0]
        ) {
          continue;
        }
        const items = m.items as Record<
          string,
          { morningId?: string; lunchMainId?: string; lunchSoupId?: string; afternoonId?: string }
        >;
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

      for (const [date, item] of Object.entries(input.items)) {
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Quy tắc trùng thực đơn vi phạm: Một combo nguyên ngày lặp lại ${violation?.count} lần trong tháng (vượt quá mức tối đa 4 ngày cho phép).`,
        });
      }

      const existing = await prisma.menu.findFirst({
        where: {
          schoolId,
          weekStartDate: input.weekStartDate,
          deletedAt: null,
        },
      });

      if (existing) {
        return prisma.menu.update({
          where: { id: existing.id },
          data: {
            items: input.items as never,
            isPublished: input.isPublished,
            notes: input.notes,
            ...(input.isPublished && !existing.isPublished && {
              publishedAt: new Date(),
              publishedById: ctx.user.id,
            }),
          },
        });
      } else {
        return prisma.menu.create({
          data: {
            schoolId,
            schoolYearId: input.schoolYearId,
            weekStartDate: input.weekStartDate,
            weekEndDate: input.weekEndDate,
            items: input.items as never,
            isPublished: input.isPublished,
            publishedAt: input.isPublished ? new Date() : null,
            publishedById: input.isPublished ? ctx.user.id : null,
            notes: input.notes,
          },
        });
      }
    }),

  publishMenu: schoolProcedure
    .input(publishMenuSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      const existing = await prisma.menu.findFirst({
        where: { id: input.menuId, schoolId, deletedAt: null },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Thực đơn không tồn tại' });
      }

      const updated = await prisma.menu.update({
        where: { id: input.menuId },
        data: {
          isPublished: true,
          publishedAt: new Date(),
          publishedById: ctx.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: ctx.user.id,
          userRole: ctx.user.role,
          entityType: 'Menu',
          entityId: input.menuId,
          action: 'PUBLISH_MENU',
          metadata: {
            menuId: input.menuId,
            weekStartDate: existing.weekStartDate.toISOString(),
          },
        },
      });

      return updated;
    }),

  // Grocery Sheets
  listGrocerySheets: schoolProcedure
    .input(
      z
        .object({
          month: z.number().optional(),
          year: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;
      return prisma.grocerySheet.findMany({
        where: {
          schoolId,
          ...(input?.month && { month: input.month }),
          ...(input?.year && { year: input.year }),
          deletedAt: null,
        },
        include: {
          items: {
            include: { ingredient: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  createGrocerySheet: schoolProcedure
    .input(createGrocerySheetSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;

      const budget = calculateGroceryBudget({
        mealRateMorning: input.mealRateMorning,
        mealRateLunch: input.mealRateLunch,
        mealRateAfternoon: input.mealRateAfternoon,
        studentCount: input.studentCount,
        gasCost: input.gasCost,
        electricityCost: input.electricityCost,
      });

      let totalPurchase = 0;
      const itemsData = input.items.map((it) => {
        const totalLine = Math.round(it.quantity * it.unitPrice);
        totalPurchase += totalLine;
        return {
          ingredientId: it.ingredientId,
          quantity: new Prisma.Decimal(it.quantity),
          unitPrice: new Prisma.Decimal(it.unitPrice),
          totalPrice: new Prisma.Decimal(totalLine),
        };
      });

      const marginCheck = validateGroceryBudgetMargin(budget, totalPurchase);
      if (!marginCheck.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: marginCheck.message,
        });
      }

      return prisma.grocerySheet.create({
        data: {
          schoolId,
          month: input.month,
          year: input.year,
          studentCount: input.studentCount,
          mealRateMorning: new Prisma.Decimal(input.mealRateMorning),
          mealRateLunch: new Prisma.Decimal(input.mealRateLunch),
          mealRateAfternoon: new Prisma.Decimal(input.mealRateAfternoon),
          gasCost: new Prisma.Decimal(input.gasCost),
          electricityCost: new Prisma.Decimal(input.electricityCost),
          budget: new Prisma.Decimal(budget),
          totalPurchase: new Prisma.Decimal(totalPurchase),
          status: 'PENDING_APPROVAL',
          createdById: ctx.user.id,
          notes: input.notes,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });
    }),

  approveGrocerySheet: schoolProcedure
    .input(approveGrocerySheetSchema)
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;

      // Permission check: only SCHOOL_ADMIN or SYSTEM_ADMIN can approve/reject
      if (ctx.user.role !== 'SCHOOL_ADMIN' && ctx.user.role !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Chỉ School Admin mới có quyền phê duyệt phiếu đi chợ',
        });
      }

      const existing = await prisma.grocerySheet.findFirst({
        where: { id: input.sheetId, schoolId, deletedAt: null },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Phiếu đi chợ không tồn tại' });
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Chỉ có thể duyệt phiếu ở trạng thái Chờ duyệt. Trạng thái hiện tại: ${existing.status}`,
        });
      }

      const newStatus = input.approved ? 'APPROVED' : 'REJECTED';

      const updated = await prisma.grocerySheet.update({
        where: { id: input.sheetId },
        data: {
          status: newStatus,
          approvedById: ctx.user.id,
          approvedAt: new Date(),
          rejectionReason: input.approved ? null : input.rejectionReason,
        },
      });

      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: ctx.user.id,
          userRole: ctx.user.role,
          entityType: 'GrocerySheet',
          entityId: existing.id,
          action: input.approved ? 'APPROVE_GROCERY_SHEET' : 'REJECT_GROCERY_SHEET',
          metadata: {
            sheetId: existing.id,
            month: existing.month,
            year: existing.year,
            totalPurchase: Number(existing.totalPurchase),
            status: newStatus,
          },
        },
      });

      return updated;
    }),
});
