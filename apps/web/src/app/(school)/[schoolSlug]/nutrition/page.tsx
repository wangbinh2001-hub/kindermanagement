import { notFound } from 'next/navigation';
import { prisma } from '@km/db';
import { getSchoolOrNull } from '../layout';
import {
  NutritionClient,
  SerializedIngredient,
  SerializedFoodItem,
  SerializedMenu,
  SerializedGrocerySheet,
  FoodGroupType,
  MealSlotType,
  GroceryStatusType,
} from './nutrition-client';

export const dynamic = 'force-dynamic';

export default async function NutritionPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolOrNull(schoolSlug);

  if (!school) {
    notFound();
  }

  // 1. Năm học hiện tại
  const schoolYears = await prisma.schoolYear.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { startDate: 'desc' },
  });

  const activeSchoolYear =
    schoolYears.find((sy) => sy.isCurrent) || schoolYears[0] || null;
  const schoolYearId = activeSchoolYear?.id || '';

  // 2. Sỉ số học sinh đang học
  const activeStudentCount = await prisma.studentSchoolRelationship.count({
    where: {
      schoolId: school.id,
      enrollmentStatus: 'ACTIVE',
      deletedAt: null,
    },
  });

  // 3. Kho nguyên liệu
  const rawIngredients = await prisma.ingredient.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { name: 'asc' },
  });

  const serializedIngredients: SerializedIngredient[] = rawIngredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    unit: ing.unit,
    unitPrice: Number(ing.unitPrice),
    kcalPerUnit: Number(ing.kcalPerUnit),
    foodGroup: ing.foodGroup as FoodGroupType,
    isActive: ing.isActive,
  }));

  // 4. Thư viện món ăn
  const rawFoodItems = await prisma.foodItem.findMany({
    where: { schoolId: school.id, deletedAt: null },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const serializedFoodItems: SerializedFoodItem[] = rawFoodItems.map((f) => ({
    id: f.id,
    name: f.name,
    mealSlot: f.mealSlot as MealSlotType,
    foodGroup: f.foodGroup as FoodGroupType,
    totalKcal: Number(f.totalKcal),
    isActive: f.isActive,
    ingredients: f.ingredients.map((ing) => ({
      id: ing.id,
      ingredientId: ing.ingredientId,
      ingredientName: ing.ingredient.name,
      unit: ing.ingredient.unit,
      quantity: Number(ing.quantity),
      kcalContribution: Number(ing.kcalContribution),
    })),
  }));

  // 5. Thực đơn các tuần
  const rawMenus = await prisma.menu.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { weekStartDate: 'desc' },
    take: 20,
  });

  const serializedMenus: SerializedMenu[] = rawMenus.map((m) => ({
    id: m.id,
    weekStartDate: m.weekStartDate.toISOString(),
    weekEndDate: m.weekEndDate.toISOString(),
    isPublished: m.isPublished,
    publishedAt: m.publishedAt?.toISOString() ?? null,
    publishedById: m.publishedById,
    notes: m.notes,
    items: m.items as never,
  }));

  // 6. Phiếu đi chợ
  const rawGrocerySheets = await prisma.grocerySheet.findMany({
    where: { schoolId: school.id, deletedAt: null },
    include: {
      items: {
        include: { ingredient: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedGrocerySheets: SerializedGrocerySheet[] = rawGrocerySheets.map((s) => ({
    id: s.id,
    month: s.month,
    year: s.year,
    studentCount: s.studentCount,
    mealRateMorning: Number(s.mealRateMorning),
    mealRateLunch: Number(s.mealRateLunch),
    mealRateAfternoon: Number(s.mealRateAfternoon),
    gasCost: Number(s.gasCost),
    electricityCost: Number(s.electricityCost),
    budget: Number(s.budget),
    totalPurchase: Number(s.totalPurchase),
    status: s.status as GroceryStatusType,
    rejectionReason: s.rejectionReason,
    notes: s.notes,
    createdById: s.createdById,
    approvedById: s.approvedById,
    approvedAt: s.approvedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    items: s.items.map((it) => ({
      id: it.id,
      ingredientId: it.ingredientId,
      ingredientName: it.ingredient.name,
      unit: it.ingredient.unit,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
    })),
  }));

  return (
    <NutritionClient
      schoolSlug={schoolSlug}
      schoolId={school.id}
      schoolName={school.name}
      schoolYearId={schoolYearId}
      activeStudentCount={activeStudentCount}
      initialIngredients={serializedIngredients}
      initialFoodItems={serializedFoodItems}
      initialMenus={serializedMenus}
      initialGrocerySheets={serializedGrocerySheets}
    />
  );
}
