import { z } from 'zod';

export const mealSlotEnum = z.enum([
  'MORNING',
  'LUNCH_MAIN',
  'LUNCH_SOUP',
  'AFTERNOON',
]);

export const foodGroupEnum = z.enum([
  'MEAT',
  'FISH',
  'VEGETABLE',
  'EGG',
  'DAIRY',
  'GRAIN',
  'OTHER',
]);

export const groceryStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
]);

export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Tên nguyên liệu không được để trống').max(100),
  unit: z.string().min(1, 'Đơn vị tính không được để trống').max(30),
  unitPrice: z.number().nonnegative('Đơn giá không được âm'),
  kcalPerUnit: z.number().nonnegative('Kcal không được âm'),
  foodGroup: foodGroupEnum.default('OTHER'),
  isActive: z.boolean().default(true),
});

export const updateIngredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(30).optional(),
  unitPrice: z.number().nonnegative().optional(),
  kcalPerUnit: z.number().nonnegative().optional(),
  foodGroup: foodGroupEnum.optional(),
  isActive: z.boolean().optional(),
});

export const foodIngredientInputSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  kcalContribution: z.number().nonnegative('Kcal không được âm'),
});

export const createFoodItemSchema = z.object({
  name: z.string().min(1, 'Tên món ăn không được để trống').max(100),
  mealSlot: mealSlotEnum,
  foodGroup: foodGroupEnum.default('OTHER'),
  totalKcal: z.number().nonnegative('Tổng Kcal không được âm'),
  ingredients: z.array(foodIngredientInputSchema).optional().default([]),
});

export const updateFoodItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  mealSlot: mealSlotEnum.optional(),
  foodGroup: foodGroupEnum.optional(),
  totalKcal: z.number().nonnegative().optional(),
  ingredients: z.array(foodIngredientInputSchema).optional(),
  isActive: z.boolean().optional(),
});

export const menuDayItemSchema = z.object({
  morningId: z.string().optional().nullable(),
  morningName: z.string().optional().nullable(),
  lunchMainId: z.string().optional().nullable(),
  lunchMainName: z.string().optional().nullable(),
  lunchSoupId: z.string().optional().nullable(),
  lunchSoupName: z.string().optional().nullable(),
  afternoonId: z.string().optional().nullable(),
  afternoonName: z.string().optional().nullable(),
  totalKcal: z.number().nonnegative().optional(),
  foodGroups: z.array(foodGroupEnum).optional(),
  notes: z.string().max(300).optional().nullable(),
});

export const saveWeeklyMenuSchema = z.object({
  schoolYearId: z.string().min(1),
  weekStartDate: z.coerce.date(),
  weekEndDate: z.coerce.date(),
  items: z.record(z.string(), menuDayItemSchema),
  isPublished: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
});

export const publishMenuSchema = z.object({
  menuId: z.string().min(1),
});

export const groceryItemInputSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  unitPrice: z.number().nonnegative('Đơn giá không được âm'),
});

export const createGrocerySheetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  studentCount: z.number().int().nonnegative(),
  mealRateMorning: z.number().nonnegative(),
  mealRateLunch: z.number().nonnegative(),
  mealRateAfternoon: z.number().nonnegative(),
  gasCost: z.number().nonnegative().default(0),
  electricityCost: z.number().nonnegative().default(0),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(groceryItemInputSchema).min(1, 'Phiếu đi chợ phải có ít nhất 1 nguyên liệu'),
});

export const approveGrocerySheetSchema = z.object({
  sheetId: z.string().min(1),
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional().nullable(),
});
