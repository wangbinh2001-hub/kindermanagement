'use client';

import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  ChefHat,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Trash2,
  Edit2,
  Loader2,
  X,
  Info,
  DollarSign,
  Flame,
  Zap,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  calculateGroceryBudget,
  validateGroceryBudgetMargin,
  checkMenuRepetition,
  evaluateDietaryBalance,
} from '@km/validators';
import {
  createIngredientAction,
  deleteIngredientAction,
  createFoodItemAction,
  deleteFoodItemAction,
  saveWeeklyMenuAction,
  publishWeeklyMenuAction,
  createGrocerySheetAction,
  approveGrocerySheetAction,
} from './actions';

export type FoodGroupType =
  | 'MEAT'
  | 'FISH'
  | 'VEGETABLE'
  | 'EGG'
  | 'DAIRY'
  | 'GRAIN'
  | 'OTHER';

export type MealSlotType =
  | 'MORNING'
  | 'LUNCH_MAIN'
  | 'LUNCH_SOUP'
  | 'AFTERNOON';

export type GroceryStatusType =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface SerializedIngredient {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  kcalPerUnit: number;
  foodGroup: FoodGroupType;
  isActive: boolean;
}

export interface SerializedFoodIngredient {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  kcalContribution: number;
}

export interface SerializedFoodItem {
  id: string;
  name: string;
  mealSlot: MealSlotType;
  foodGroup: FoodGroupType;
  totalKcal: number;
  isActive: boolean;
  ingredients: SerializedFoodIngredient[];
}

export interface SerializedMenuDay {
  morningId?: string | null;
  morningName?: string | null;
  lunchMainId?: string | null;
  lunchMainName?: string | null;
  lunchSoupId?: string | null;
  lunchSoupName?: string | null;
  afternoonId?: string | null;
  afternoonName?: string | null;
  totalKcal?: number;
  notes?: string | null;
}

export interface SerializedMenu {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  isPublished: boolean;
  publishedAt?: string | null;
  publishedById?: string | null;
  notes?: string | null;
  items: Record<string, SerializedMenuDay>;
}

export interface SerializedGroceryItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SerializedGrocerySheet {
  id: string;
  month: number;
  year: number;
  studentCount: number;
  mealRateMorning: number;
  mealRateLunch: number;
  mealRateAfternoon: number;
  gasCost: number;
  electricityCost: number;
  budget: number;
  totalPurchase: number;
  status: GroceryStatusType;
  rejectionReason?: string | null;
  notes?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  items: SerializedGroceryItem[];
}

interface NutritionClientProps {
  schoolSlug: string;
  schoolId: string;
  schoolName: string;
  schoolYearId: string;
  activeStudentCount: number;
  initialIngredients: SerializedIngredient[];
  initialFoodItems: SerializedFoodItem[];
  initialMenus: SerializedMenu[];
  initialGrocerySheets: SerializedGrocerySheet[];
}

const FOOD_GROUP_LABELS: Record<FoodGroupType, string> = {
  MEAT: 'Thịt',
  FISH: 'Cá / Thủy sản',
  VEGETABLE: 'Rau củ',
  EGG: 'Trứng',
  DAIRY: 'Sữa & Chế phẩm',
  GRAIN: 'Ngũ cốc / Tinh bột',
  OTHER: 'Khác',
};

const MEAL_SLOT_LABELS: Record<MealSlotType, string> = {
  MORNING: 'Bữa sáng',
  LUNCH_MAIN: 'Trưa (Món mặn)',
  LUNCH_SOUP: 'Trưa (Món canh)',
  AFTERNOON: 'Bữa xế',
};

export function NutritionClient({
  schoolSlug,
  schoolId,
  schoolName,
  schoolYearId,
  activeStudentCount,
  initialIngredients,
  initialFoodItems,
  initialMenus,
  initialGrocerySheets,
}: NutritionClientProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'ingredients' | 'foodItems' | 'grocery'>('menu');

  // State collections
  const [ingredients, setIngredients] = useState<SerializedIngredient[]>(initialIngredients);
  const [foodItems, setFoodItems] = useState<SerializedFoodItem[]>(initialFoodItems);
  const [menus, setMenus] = useState<SerializedMenu[]>(initialMenus);
  const [grocerySheets, setGrocerySheets] = useState<SerializedGrocerySheet[]>(initialGrocerySheets);

  // Submitting status
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientGroupFilter, setIngredientGroupFilter] = useState<string>('ALL');
  const [foodItemSlotFilter, setFoodItemSlotFilter] = useState<string>('ALL');

  // --- MENU PLANNING STATE ---
  // Default to current week Monday
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => {
    const m = getMonday(new Date());
    return m.toISOString().split('T')[0]!;
  });

  // Calculate 5 school days (Mon to Fri) for the current week
  const weekDays = useMemo(() => {
    const days: Array<{ dateStr: string; label: string }> = [];
    const mon = new Date(currentWeekMonday);
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
    for (let i = 0; i < 5; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0]!,
        label: `${dayNames[i]} (${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`,
      });
    }
    return days;
  }, [currentWeekMonday]);

  // Current active weekly menu record
  const currentWeeklyMenu = useMemo(() => {
    return menus.find((m) => m.weekStartDate.startsWith(currentWeekMonday)) || null;
  }, [menus, currentWeekMonday]);

  // Draft items for weekly menu
  const [menuDraft, setMenuDraft] = useState<Record<string, SerializedMenuDay>>(() => {
    return currentWeeklyMenu?.items || {};
  });

  // Keep draft updated when week changes
  React.useEffect(() => {
    setMenuDraft(currentWeeklyMenu?.items || {});
  }, [currentWeeklyMenu]);

  // Update a slot for a day in draft
  const handleUpdateDaySlot = (
    dateStr: string,
    slot: 'morning' | 'lunchMain' | 'lunchSoup' | 'afternoon',
    foodItemId: string
  ) => {
    const food = foodItems.find((f) => f.id === foodItemId);
    setMenuDraft((prev) => {
      const day = prev[dateStr] || {};
      const updatedDay: SerializedMenuDay = {
        ...day,
        [`${slot}Id`]: foodItemId || null,
        [`${slot}Name`]: food ? food.name : null,
      };

      // Recalculate daily total kcal
      const mFood = foodItems.find((f) => f.id === (slot === 'morning' ? foodItemId : updatedDay.morningId));
      const lmFood = foodItems.find((f) => f.id === (slot === 'lunchMain' ? foodItemId : updatedDay.lunchMainId));
      const lsFood = foodItems.find((f) => f.id === (slot === 'lunchSoup' ? foodItemId : updatedDay.lunchSoupId));
      const aFood = foodItems.find((f) => f.id === (slot === 'afternoon' ? foodItemId : updatedDay.afternoonId));

      const sumKcal = (mFood?.totalKcal || 0) + (lmFood?.totalKcal || 0) + (lsFood?.totalKcal || 0) + (aFood?.totalKcal || 0);
      updatedDay.totalKcal = Math.round(sumKcal * 10) / 10;

      return {
        ...prev,
        [dateStr]: updatedDay,
      };
    });
  };

  // Dietary Balance Warnings
  const balanceCheck = useMemo(() => {
    const dailyInfo = weekDays.map((d) => {
      const dayData = menuDraft[d.dateStr];
      const groups: FoodGroupType[] = [];
      if (dayData?.morningId) {
        const f = foodItems.find((x) => x.id === dayData.morningId);
        if (f) groups.push(f.foodGroup);
      }
      if (dayData?.lunchMainId) {
        const f = foodItems.find((x) => x.id === dayData.lunchMainId);
        if (f) groups.push(f.foodGroup);
      }
      if (dayData?.lunchSoupId) {
        const f = foodItems.find((x) => x.id === dayData.lunchSoupId);
        if (f) groups.push(f.foodGroup);
      }
      if (dayData?.afternoonId) {
        const f = foodItems.find((x) => x.id === dayData.afternoonId);
        if (f) groups.push(f.foodGroup);
      }
      return { date: d.dateStr, foodGroups: groups };
    });

    return evaluateDietaryBalance(dailyInfo);
  }, [menuDraft, weekDays, foodItems]);

  // Handle Save Menu
  const handleSaveMenu = async (publish: boolean = false) => {
    setIsSubmitting(true);
    try {
      const sunday = new Date(currentWeekMonday);
      sunday.setDate(sunday.getDate() + 6);

      const res = await saveWeeklyMenuAction(schoolSlug, schoolId, {
        schoolYearId,
        weekStartDate: new Date(currentWeekMonday),
        weekEndDate: sunday,
        items: menuDraft,
        isPublished: publish || currentWeeklyMenu?.isPublished || false,
      });

      if (res.success && res.menu) {
        toast.success(publish ? 'Đã lưu và phát hành thực đơn tuần!' : 'Đã lưu thực đơn tuần!');
        const serialized: SerializedMenu = {
          id: res.menu.id,
          weekStartDate: res.menu.weekStartDate.toISOString(),
          weekEndDate: res.menu.weekEndDate.toISOString(),
          isPublished: res.menu.isPublished,
          publishedAt: res.menu.publishedAt?.toISOString() ?? null,
          items: res.menu.items as never,
          notes: res.menu.notes,
        };

        setMenus((prev) => {
          const idx = prev.findIndex((m) => m.id === serialized.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = serialized;
            return next;
          }
          return [serialized, ...prev];
        });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi khi lưu thực đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Publish Menu
  const handlePublishMenu = async () => {
    if (!currentWeeklyMenu) {
      // Save and publish
      await handleSaveMenu(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await publishWeeklyMenuAction(schoolSlug, schoolId, currentWeeklyMenu.id);
      if (res.success && res.menu) {
        toast.success('Đã phát hành thực đơn tuần cho phụ huynh xem!');
        setMenus((prev) =>
          prev.map((m) =>
            m.id === res.menu.id
              ? {
                  ...m,
                  isPublished: true,
                  publishedAt: res.menu.publishedAt?.toISOString() ?? null,
                }
              : m
          )
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi khi phát hành thực đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- INGREDIENTS MODAL STATE ---
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [ingName, setIngName] = useState('');
  const [ingUnit, setIngUnit] = useState('kg');
  const [ingUnitPrice, setIngUnitPrice] = useState('50000');
  const [ingKcal, setIngKcal] = useState('200');
  const [ingFoodGroup, setIngFoodGroup] = useState<FoodGroupType>('VEGETABLE');

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createIngredientAction(schoolSlug, schoolId, {
        name: ingName.trim(),
        unit: ingUnit.trim(),
        unitPrice: parseFloat(ingUnitPrice),
        kcalPerUnit: parseFloat(ingKcal),
        foodGroup: ingFoodGroup,
        isActive: true,
      });

      if (res.success && res.ingredient) {
        toast.success(`Đã thêm nguyên liệu: ${res.ingredient.name}`);
        setIngredients((prev) => [
          ...prev,
          {
            id: res.ingredient.id,
            name: res.ingredient.name,
            unit: res.ingredient.unit,
            unitPrice: Number(res.ingredient.unitPrice),
            kcalPerUnit: Number(res.ingredient.kcalPerUnit),
            foodGroup: res.ingredient.foodGroup as FoodGroupType,
            isActive: res.ingredient.isActive,
          },
        ]);
        setShowIngredientModal(false);
        setIngName('');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tạo nguyên liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) return;
    try {
      const res = await deleteIngredientAction(schoolSlug, schoolId, id);
      if (res.success) {
        toast.success('Đã xóa nguyên liệu');
        setIngredients((prev) => prev.filter((x) => x.id !== id));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa nguyên liệu');
    }
  };

  // --- FOOD ITEMS & RECIPES MODAL STATE ---
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodMealSlot, setFoodMealSlot] = useState<MealSlotType>('LUNCH_MAIN');
  const [foodGroup, setFoodGroup] = useState<FoodGroupType>('MEAT');
  const [foodIngredientsList, setFoodIngredientsList] = useState<
    Array<{ ingredientId: string; quantity: number }>
  >([]);

  // Computed total Kcal for recipe modal
  const computedRecipeKcal = useMemo(() => {
    let total = 0;
    for (const item of foodIngredientsList) {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        total += ing.kcalPerUnit * item.quantity;
      }
    }
    return Math.round(total * 10) / 10;
  }, [foodIngredientsList, ingredients]);

  const handleAddIngredientToRecipe = (ingredientId: string) => {
    if (!ingredientId) return;
    setFoodIngredientsList((prev) => {
      if (prev.some((x) => x.ingredientId === ingredientId)) return prev;
      return [...prev, { ingredientId, quantity: 0.1 }];
    });
  };

  const handleUpdateRecipeQuantity = (ingredientId: string, quantity: number) => {
    setFoodIngredientsList((prev) =>
      prev.map((x) => (x.ingredientId === ingredientId ? { ...x, quantity } : x))
    );
  };

  const handleRemoveRecipeIngredient = (ingredientId: string) => {
    setFoodIngredientsList((prev) => prev.filter((x) => x.ingredientId !== ingredientId));
  };

  const handleCreateFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ingredientsPayload = foodIngredientsList.map((item) => {
        const ing = ingredients.find((i) => i.id === item.ingredientId);
        const kcal = (ing?.kcalPerUnit || 0) * item.quantity;
        return {
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          kcalContribution: Math.round(kcal * 10) / 10,
        };
      });

      const res = await createFoodItemAction(schoolSlug, schoolId, {
        name: foodName.trim(),
        mealSlot: foodMealSlot,
        foodGroup,
        totalKcal: computedRecipeKcal,
        ingredients: ingredientsPayload,
      });

      if (res.success && res.foodItem) {
        toast.success(`Đã thêm món ăn: ${res.foodItem.name}`);
        const newItem: SerializedFoodItem = {
          id: res.foodItem.id,
          name: res.foodItem.name,
          mealSlot: res.foodItem.mealSlot as MealSlotType,
          foodGroup: res.foodItem.foodGroup as FoodGroupType,
          totalKcal: Number(res.foodItem.totalKcal),
          isActive: res.foodItem.isActive,
          ingredients: res.foodItem.ingredients.map((ing) => ({
            id: ing.id,
            ingredientId: ing.ingredientId,
            ingredientName: ing.ingredient.name,
            unit: ing.ingredient.unit,
            quantity: Number(ing.quantity),
            kcalContribution: Number(ing.kcalContribution),
          })),
        };
        setFoodItems((prev) => [...prev, newItem]);
        setShowFoodModal(false);
        setFoodName('');
        setFoodIngredientsList([]);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tạo món ăn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFoodItem = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;
    try {
      const res = await deleteFoodItemAction(schoolSlug, schoolId, id);
      if (res.success) {
        toast.success('Đã xóa món ăn');
        setFoodItems((prev) => prev.filter((x) => x.id !== id));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa món ăn');
    }
  };

  // --- GROCERY SHEET MODAL STATE ---
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [gMonth, setGMonth] = useState<number>(new Date().getMonth() + 1);
  const [gYear, setGYear] = useState<number>(new Date().getFullYear());
  const [gStudentCount, setGStudentCount] = useState<number>(activeStudentCount || 50);
  const [gRateMorning, setGRateMorning] = useState<number>(15000);
  const [gRateLunch, setGRateLunch] = useState<number>(35000);
  const [gRateAfternoon, setGRateAfternoon] = useState<number>(15000);
  const [gGasCost, setGGasCost] = useState<number>(100000);
  const [gElecCost, setGElecCost] = useState<number>(150000);
  const [groceryItemsDraft, setGroceryItemsDraft] = useState<
    Array<{ ingredientId: string; quantity: number; unitPrice: number }>
  >([]);

  // Calculate budget
  const liveBudget = useMemo(() => {
    return calculateGroceryBudget({
      mealRateMorning: gRateMorning,
      mealRateLunch: gRateLunch,
      mealRateAfternoon: gRateAfternoon,
      studentCount: gStudentCount,
      gasCost: gGasCost,
      electricityCost: gElecCost,
    });
  }, [gRateMorning, gRateLunch, gRateAfternoon, gStudentCount, gGasCost, gElecCost]);

  // Calculate live total purchase
  const liveTotalPurchase = useMemo(() => {
    return groceryItemsDraft.reduce((acc, it) => acc + Math.round(it.quantity * it.unitPrice), 0);
  }, [groceryItemsDraft]);

  // Margin Check (±5,000 VNĐ)
  const liveMarginCheck = useMemo(() => {
    return validateGroceryBudgetMargin(liveBudget, liveTotalPurchase);
  }, [liveBudget, liveTotalPurchase]);

  const handleAddGroceryItem = (ingredientId: string) => {
    if (!ingredientId) return;
    const ing = ingredients.find((x) => x.id === ingredientId);
    if (!ing) return;
    setGroceryItemsDraft((prev) => {
      if (prev.some((x) => x.ingredientId === ingredientId)) return prev;
      return [
        ...prev,
        {
          ingredientId,
          quantity: 10,
          unitPrice: ing.unitPrice,
        },
      ];
    });
  };

  const handleUpdateGroceryItem = (
    ingredientId: string,
    quantity: number,
    unitPrice: number
  ) => {
    setGroceryItemsDraft((prev) =>
      prev.map((x) => (x.ingredientId === ingredientId ? { ...x, quantity, unitPrice } : x))
    );
  };

  const handleRemoveGroceryItem = (ingredientId: string) => {
    setGroceryItemsDraft((prev) => prev.filter((x) => x.ingredientId !== ingredientId));
  };

  const handleCreateGrocerySheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveMarginCheck.valid) {
      toast.error(liveMarginCheck.message || 'Chưa đạt ràng buộc ngân sách ±5.000 VNĐ');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGrocerySheetAction(schoolSlug, schoolId, {
        month: gMonth,
        year: gYear,
        studentCount: gStudentCount,
        mealRateMorning: gRateMorning,
        mealRateLunch: gRateLunch,
        mealRateAfternoon: gRateAfternoon,
        gasCost: gGasCost,
        electricityCost: gElecCost,
        items: groceryItemsDraft,
      });

      if (res.success && res.sheet) {
        toast.success('Đã tạo phiếu đi chợ thành công (chờ duyệt)!');
        const newSheet: SerializedGrocerySheet = {
          id: res.sheet.id,
          month: res.sheet.month,
          year: res.sheet.year,
          studentCount: res.sheet.studentCount,
          mealRateMorning: Number(res.sheet.mealRateMorning),
          mealRateLunch: Number(res.sheet.mealRateLunch),
          mealRateAfternoon: Number(res.sheet.mealRateAfternoon),
          gasCost: Number(res.sheet.gasCost),
          electricityCost: Number(res.sheet.electricityCost),
          budget: Number(res.sheet.budget),
          totalPurchase: Number(res.sheet.totalPurchase),
          status: res.sheet.status as GroceryStatusType,
          createdById: res.sheet.createdById,
          createdAt: res.sheet.createdAt.toISOString(),
          items: res.sheet.items.map((it) => {
            const ing = ingredients.find((i) => i.id === it.ingredientId);
            return {
              id: it.id,
              ingredientId: it.ingredientId,
              ingredientName: ing?.name || 'Nguyên liệu',
              unit: ing?.unit || 'kg',
              quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice),
              totalPrice: Number(it.totalPrice),
            };
          }),
        };

        setGrocerySheets((prev) => [newSheet, ...prev]);
        setShowGroceryModal(false);
        setGroceryItemsDraft([]);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi khi tạo phiếu đi chợ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveGrocerySheet = async (sheetId: string, approved: boolean) => {
    const reason = !approved ? prompt('Nhập lý do từ chối:') || 'Không đạt yêu cầu' : undefined;
    if (!approved && !reason) return;

    try {
      const res = await approveGrocerySheetAction(schoolSlug, schoolId, {
        sheetId,
        approved,
        rejectionReason: reason,
      });

      if (res.success && res.sheet) {
        toast.success(approved ? 'Đã phê duyệt phiếu đi chợ!' : 'Đã từ chối phiếu đi chợ.');
        setGrocerySheets((prev) =>
          prev.map((s) =>
            s.id === sheetId
              ? {
                  ...s,
                  status: res.sheet.status as GroceryStatusType,
                  approvedById: res.sheet.approvedById,
                  approvedAt: res.sheet.approvedAt?.toISOString() ?? null,
                  rejectionReason: res.sheet.rejectionReason,
                }
              : s
          )
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xử lý phiếu');
    }
  };

  // Status Badge Helper
  const renderGroceryStatusBadge = (status: GroceryStatusType) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Bản nháp
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Chờ duyệt
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Từ chối
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Dinh dưỡng, Thực đơn & Đi chợ
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quản lý kho nguyên liệu, thư viện món ăn, kế hoạch thực đơn và phiếu đi chợ cân đối ngân sách.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
          <Button
            size="sm"
            variant={activeTab === 'menu' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('menu')}
            className="text-xs h-8 gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Thực đơn
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'ingredients' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('ingredients')}
            className="text-xs h-8 gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            Kho Nguyên liệu ({ingredients.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'foodItems' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('foodItems')}
            className="text-xs h-8 gap-1.5"
          >
            <ChefHat className="w-3.5 h-3.5" />
            Thư viện Món ăn ({foodItems.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'grocery' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('grocery')}
            className="text-xs h-8 gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Phiếu Đi chợ ({grocerySheets.length})
          </Button>
        </div>
      </div>

      {/* TAB 1: THỰC ĐƠN (MENU PLANNER) */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          {/* Week controller & Publish actions */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                Tuần bắt đầu (Thứ 2):
              </label>
              <Input
                type="date"
                value={currentWeekMonday}
                onChange={(e) => setCurrentWeekMonday(e.target.value)}
                className="w-44 h-9 text-sm"
              />
              {currentWeeklyMenu?.isPublished ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Đã phát hành cho Phụ huynh
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Chưa phát hành (Nội bộ)
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveMenu(false)}
                disabled={isSubmitting}
                className="gap-1.5 text-xs h-9"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Lưu bản nháp
              </Button>
              <Button
                size="sm"
                onClick={handlePublishMenu}
                disabled={isSubmitting}
                className="gap-1.5 text-xs h-9"
              >
                <Send className="w-3.5 h-3.5" />
                Phát hành cho Phụ huynh
              </Button>
            </div>
          </div>

          {/* Dietary Balance Warnings */}
          {!balanceCheck.balanced && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Cảnh báo cân bằng dinh dưỡng:
              </div>
              {balanceCheck.warnings.map((w, idx) => (
                <p key={idx} className="text-xs pl-6">
                  • {w}
                </p>
              ))}
            </div>
          )}

          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weekDays.map((day) => {
              const dayData = menuDraft[day.dateStr] || {};
              const morningFood = foodItems.filter((f) => f.mealSlot === 'MORNING');
              const lunchMainFood = foodItems.filter((f) => f.mealSlot === 'LUNCH_MAIN');
              const lunchSoupFood = foodItems.filter((f) => f.mealSlot === 'LUNCH_SOUP');
              const afternoonFood = foodItems.filter((f) => f.mealSlot === 'AFTERNOON');

              return (
                <div
                  key={day.dateStr}
                  className="rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden"
                >
                  <div className="p-3 border-b border-border bg-muted/40 flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      {day.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {dayData.totalKcal || 0} kcal
                    </Badge>
                  </div>

                  <div className="p-3 space-y-3.5 flex-1">
                    {/* Bữa sáng */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Sáng (1 món)
                      </label>
                      <select
                        aria-label={`Món ăn sáng ngày ${day.label}`}
                        value={dayData.morningId || ''}
                        onChange={(e) =>
                          handleUpdateDaySlot(day.dateStr, 'morning', e.target.value)
                        }
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn món sáng --</option>
                        {morningFood.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.totalKcal} kcal)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trưa - Món mặn */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Trưa: Mặn (1 món)
                      </label>
                      <select
                        aria-label={`Món mặn trưa ngày ${day.label}`}
                        value={dayData.lunchMainId || ''}
                        onChange={(e) =>
                          handleUpdateDaySlot(day.dateStr, 'lunchMain', e.target.value)
                        }
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn món mặn --</option>
                        {lunchMainFood.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.totalKcal} kcal)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trưa - Món canh */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Trưa: Canh (1 món)
                      </label>
                      <select
                        aria-label={`Món canh trưa ngày ${day.label}`}
                        value={dayData.lunchSoupId || ''}
                        onChange={(e) =>
                          handleUpdateDaySlot(day.dateStr, 'lunchSoup', e.target.value)
                        }
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn món canh --</option>
                        {lunchSoupFood.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.totalKcal} kcal)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bữa xế */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Xế (1 món)
                      </label>
                      <select
                        aria-label={`Món ăn xế ngày ${day.label}`}
                        value={dayData.afternoonId || ''}
                        onChange={(e) =>
                          handleUpdateDaySlot(day.dateStr, 'afternoon', e.target.value)
                        }
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn món xế --</option>
                        {afternoonFood.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.totalKcal} kcal)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: KHO NGUYÊN LIỆU (INGREDIENTS) */}
      {activeTab === 'ingredients' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 w-full md:w-auto items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  placeholder="Tìm theo tên nguyên liệu..."
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <select
                aria-label="Lọc nhóm thực phẩm"
                value={ingredientGroupFilter}
                onChange={(e) => setIngredientGroupFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Tất cả nhóm thực phẩm</option>
                {Object.entries(FOOD_GROUP_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setShowIngredientModal(true)}
              className="gap-2 text-xs h-9"
            >
              <Plus className="w-4 h-4" />
              Thêm nguyên liệu
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {ingredients.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Chưa có nguyên liệu nào. Hãy thêm nguyên liệu đầu tiên!
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Tên nguyên liệu</th>
                    <th className="py-3 px-4">Nhóm thực phẩm</th>
                    <th className="py-3 px-4">Đơn vị</th>
                    <th className="py-3 px-4">Đơn giá (VNĐ)</th>
                    <th className="py-3 px-4">Kcal / Đơn vị</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ingredients
                    .filter((ing) => {
                      if (ingredientGroupFilter !== 'ALL' && ing.foodGroup !== ingredientGroupFilter) {
                        return false;
                      }
                      if (ingredientSearch.trim()) {
                        return ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                      }
                      return true;
                    })
                    .map((ing) => (
                      <tr key={ing.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {ing.name}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{FOOD_GROUP_LABELS[ing.foodGroup]}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{ing.unit}</td>
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {ing.unitPrice.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {ing.kcalPerUnit} kcal
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: THƯ VIỆN MÓN ĂN & CÔNG THỨC (FOOD ITEMS) */}
      {activeTab === 'foodItems' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                aria-label="Lọc theo buổi ăn"
                value={foodItemSlotFilter}
                onChange={(e) => setFoodItemSlotFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Tất cả buổi ăn</option>
                {Object.entries(MEAL_SLOT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={() => setShowFoodModal(true)} className="gap-2 text-xs h-9">
              <Plus className="w-4 h-4" />
              Tạo món ăn mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {foodItems
              .filter((f) => foodItemSlotFilter === 'ALL' || f.mealSlot === foodItemSlotFilter)
              .map((food) => (
                <div
                  key={food.id}
                  className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{food.name}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {MEAL_SLOT_LABELS[food.mealSlot]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary text-[10px]">
                        {FOOD_GROUP_LABELS[food.foodGroup]}
                      </Badge>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {food.totalKcal} kcal
                      </span>
                    </div>

                    {/* Ingredients summary */}
                    <div className="mt-3 pt-2.5 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                      <span className="font-medium text-[11px] text-foreground">
                        Nguyên liệu ({food.ingredients.length}):
                      </span>
                      {food.ingredients.map((ing) => (
                        <div key={ing.id} className="flex justify-between text-[11px]">
                          <span>• {ing.ingredientName}</span>
                          <span className="font-mono">
                            {ing.quantity} {ing.unit} ({ing.kcalContribution} kcal)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFoodItem(food.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: PHIẾU ĐI CHỢ (GROCERY SHEETS) */}
      {activeTab === 'grocery' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Danh sách Phiếu Đi chợ</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cân đối ngân sách ăn uống, tuân thủ ràng buộc biên ±5.000 VNĐ trước khi trình duyệt.
              </p>
            </div>

            <Button onClick={() => setShowGroceryModal(true)} className="gap-2 text-xs h-9">
              <Plus className="w-4 h-4" />
              Tạo phiếu đi chợ
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {grocerySheets.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Chưa có phiếu đi chợ nào. Bấm &quot;Tạo phiếu đi chợ&quot; để lập phiếu mới!
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Kỳ (Tháng/Năm)</th>
                    <th className="py-3 px-4">Sỉ số</th>
                    <th className="py-3 px-4">Ngân sách dự tính</th>
                    <th className="py-3 px-4">Tổng mua thực tế</th>
                    <th className="py-3 px-4">Chênh lệch</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Phê duyệt / Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grocerySheets.map((sheet) => {
                    const diff = sheet.totalPurchase - sheet.budget;
                    return (
                      <tr key={sheet.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          Tháng {sheet.month}/{sheet.year}
                        </td>
                        <td className="py-3 px-4 font-mono">{sheet.studentCount} trẻ</td>
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {sheet.budget.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {sheet.totalPurchase.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {diff >= 0 ? `+${diff.toLocaleString('vi-VN')}` : diff.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4">
                          {renderGroceryStatusBadge(sheet.status)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {sheet.status === 'PENDING_APPROVAL' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveGrocerySheet(sheet.id, true)}
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApproveGrocerySheet(sheet.id, false)}
                                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: THÊM NGUYÊN LIỆU */}
      {showIngredientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Thêm nguyên liệu mới</h3>
              <button
                onClick={() => setShowIngredientModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Tên nguyên liệu <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="VD: Thịt gà, Cà rốt, Dầu ăn..."
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Đơn vị tính <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    placeholder="kg, quả, hộp..."
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Nhóm thực phẩm
                  </label>
                  <select
                    value={ingFoodGroup}
                    onChange={(e) => setIngFoodGroup(e.target.value as FoodGroupType)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {Object.entries(FOOD_GROUP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Đơn giá (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={ingUnitPrice}
                    onChange={(e) => setIngUnitPrice(e.target.value)}
                    required
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Kcal / Đơn vị <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={ingKcal}
                    onChange={(e) => setIngKcal(e.target.value)}
                    required
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIngredientModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu nguyên liệu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO MÓN ĂN & CÔNG THỨC */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Tạo món ăn & Định lượng</h3>
              <button
                onClick={() => setShowFoodModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFoodItem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Tên món ăn <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="VD: Thịt kho trứng cút, Canh rau ngót..."
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Buổi ăn</label>
                  <select
                    value={foodMealSlot}
                    onChange={(e) => setFoodMealSlot(e.target.value as MealSlotType)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {Object.entries(MEAL_SLOT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nhóm chính</label>
                  <select
                    value={foodGroup}
                    onChange={(e) => setFoodGroup(e.target.value as FoodGroupType)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {Object.entries(FOOD_GROUP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipe builder */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Thành phần nguyên liệu định lượng:
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    Tổng: {computedRecipeKcal} kcal
                  </span>
                </div>

                {/* Add ingredient row */}
                <div className="flex gap-2">
                  <select
                    id="recipe-ingredient-select"
                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    defaultValue=""
                    onChange={(e) => {
                      handleAddIngredientToRecipe(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Chọn nguyên liệu để thêm...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.kcalPerUnit} kcal/{ing.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected ingredients list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {foodIngredientsList.map((item) => {
                    const ing = ingredients.find((i) => i.id === item.ingredientId);
                    return (
                      <div
                        key={item.ingredientId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs border border-border/40"
                      >
                        <span className="font-medium">{ing?.name}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateRecipeQuantity(
                                item.ingredientId,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 h-7 text-xs font-mono"
                          />
                          <span className="text-muted-foreground">{ing?.unit}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeIngredient(item.ingredientId)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowFoodModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting || !foodName}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo món ăn'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO PHIẾU ĐI CHỢ & RÀNG BUỘC BIÊN ±5.000 VNĐ */}
      {showGroceryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Lập Phiếu Đi chợ & Cân đối Ngân sách
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Áp dụng ràng buộc biên ±5.000 VNĐ so với ngân sách ăn uống được tính toán.
                </p>
              </div>
              <button
                onClick={() => setShowGroceryModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrocerySheet} className="space-y-4">
              {/* Inputs: Month, Year, Student Count */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Tháng</label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={gMonth}
                    onChange={(e) => setGMonth(parseInt(e.target.value) || 1)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Năm</label>
                  <Input
                    type="number"
                    value={gYear}
                    onChange={(e) => setGYear(parseInt(e.target.value) || 2026)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Sỉ số trẻ</label>
                  <Input
                    type="number"
                    value={gStudentCount}
                    onChange={(e) => setGStudentCount(parseInt(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Utility costs */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/60">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Chi phí Gas (VNĐ)
                  </label>
                  <Input
                    type="number"
                    value={gGasCost}
                    onChange={(e) => setGGasCost(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    Chi phí Điện (VNĐ)
                  </label>
                  <Input
                    type="number"
                    value={gElecCost}
                    onChange={(e) => setGElecCost(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Live Budget & Margin Status Indicator */}
              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Ngân sách quy định:</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {liveBudget.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Tổng tiền mua thực tế:</span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {liveTotalPurchase.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-primary/10">
                  <span className="text-xs text-muted-foreground">
                    Chênh lệch ({liveMarginCheck.diff >= 0 ? `+${liveMarginCheck.diff}` : liveMarginCheck.diff} đ):
                  </span>
                  {liveMarginCheck.valid ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Đạt ràng buộc ±5.000 đ
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Vượt biên cho phép
                    </Badge>
                  )}
                </div>
              </div>

              {/* Items Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Danh sách nguyên liệu cần mua:
                  </span>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    defaultValue=""
                    onChange={(e) => {
                      handleAddGroceryItem(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Thêm nguyên liệu...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unitPrice.toLocaleString('vi-VN')} đ/{ing.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {groceryItemsDraft.map((item) => {
                    const ing = ingredients.find((i) => i.id === item.ingredientId);
                    const lineTotal = Math.round(item.quantity * item.unitPrice);
                    return (
                      <div
                        key={item.ingredientId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs border border-border/40"
                      >
                        <span className="font-medium">{ing?.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateGroceryItem(
                                  item.ingredientId,
                                  parseFloat(e.target.value) || 0,
                                  item.unitPrice
                                )
                              }
                              className="w-16 h-7 text-xs font-mono"
                            />
                            <span className="text-muted-foreground">{ing?.unit}</span>
                          </div>
                          <span className="font-mono font-bold text-foreground min-w-[80px] text-right">
                            {lineTotal.toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGroceryItem(item.ingredientId)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowGroceryModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting || !liveMarginCheck.valid}>
                  {isSubmitting ? 'Đang tạo...' : 'Gửi phiếu duyệt'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
