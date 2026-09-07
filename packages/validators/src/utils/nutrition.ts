export interface CalculateBudgetParams {
  mealRateMorning: number;
  mealRateLunch: number;
  mealRateAfternoon: number;
  studentCount: number;
  gasCost?: number;
  electricityCost?: number;
}

/**
 * Ngân sách đi chợ = (Tiền ăn sáng + Tiền ăn trưa + Tiền ăn xế) * Sỉ số trẻ - (Tiền gas + Tiền điện)
 */
export function calculateGroceryBudget(params: CalculateBudgetParams): number {
  const {
    mealRateMorning,
    mealRateLunch,
    mealRateAfternoon,
    studentCount,
    gasCost = 0,
    electricityCost = 0,
  } = params;

  const totalMealRevenue = (mealRateMorning + mealRateLunch + mealRateAfternoon) * studentCount;
  const utilityCosts = gasCost + electricityCost;
  return Math.max(0, Math.round(totalMealRevenue - utilityCosts));
}

/**
 * Ràng buộc biên ±5.000 VNĐ:
 * Ngân sách - 5.000 <= Tổng tiền thực tế <= Ngân sách + 5.000
 */
export function validateGroceryBudgetMargin(
  budget: number,
  totalPurchase: number
): {
  valid: boolean;
  diff: number;
  minAllowed: number;
  maxAllowed: number;
  message?: string;
} {
  const minAllowed = budget - 5000;
  const maxAllowed = budget + 5000;
  const diff = totalPurchase - budget;

  if (totalPurchase < minAllowed) {
    return {
      valid: false,
      diff,
      minAllowed,
      maxAllowed,
      message: `Tổng tiền mua (${totalPurchase.toLocaleString('vi-VN')} đ) thấp hơn ngân sách cho phép (${minAllowed.toLocaleString('vi-VN')} đ). Chênh lệch thiếu ${Math.abs(diff).toLocaleString('vi-VN')} đ.`,
    };
  }

  if (totalPurchase > maxAllowed) {
    return {
      valid: false,
      diff,
      minAllowed,
      maxAllowed,
      message: `Tổng tiền mua (${totalPurchase.toLocaleString('vi-VN')} đ) vượt quá ngân sách cho phép (${maxAllowed.toLocaleString('vi-VN')} đ). Chênh lệch thừa +${diff.toLocaleString('vi-VN')} đ.`,
    };
  }

  return {
    valid: true,
    diff,
    minAllowed,
    maxAllowed,
  };
}

export interface DayMenuCombo {
  date: string;
  morningId?: string | null;
  lunchMainId?: string | null;
  lunchSoupId?: string | null;
  afternoonId?: string | null;
}

/**
 * Quy tắc trùng thực đơn:
 * Trong 1 tháng, một thực đơn nguyên ngày (combo Sáng, Trưa chính, Trưa canh, Xế) không được phép lặp lại quá 4 ngày.
 */
export function checkMenuRepetition(monthMenus: DayMenuCombo[]): {
  isValid: boolean;
  maxRepeatCount: number;
  violations: Array<{ comboKey: string; count: number; dates: string[] }>;
} {
  const map = new Map<string, string[]>();

  for (const day of monthMenus) {
    // Only check if day has at least 2 meal slots planned
    if (!day.morningId && !day.lunchMainId && !day.lunchSoupId && !day.afternoonId) {
      continue;
    }

    const key = [
      day.morningId || 'NONE',
      day.lunchMainId || 'NONE',
      day.lunchSoupId || 'NONE',
      day.afternoonId || 'NONE',
    ].join('|');

    const existing = map.get(key) || [];
    existing.push(day.date);
    map.set(key, existing);
  }

  const violations: Array<{ comboKey: string; count: number; dates: string[] }> = [];
  let maxRepeatCount = 0;

  for (const [comboKey, dates] of map.entries()) {
    if (dates.length > maxRepeatCount) {
      maxRepeatCount = dates.length;
    }
    if (dates.length > 4) {
      violations.push({ comboKey, count: dates.length, dates });
    }
  }

  return {
    isValid: violations.length === 0,
    maxRepeatCount,
    violations,
  };
}

export interface DayDietaryInfo {
  date: string;
  foodGroups: Array<'MEAT' | 'FISH' | 'VEGETABLE' | 'EGG' | 'DAIRY' | 'GRAIN' | 'OTHER'>;
}

/**
 * Quy tắc cân bằng dinh dưỡng:
 * Cảnh báo nếu các ngày liên tiếp chỉ có món thịt mà không xen kẽ cá/rau/chay.
 */
export function evaluateDietaryBalance(dailyMeals: DayDietaryInfo[]): {
  balanced: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Sort by date asc
  const sorted = [...dailyMeals].sort((a, b) => a.date.localeCompare(b.date));

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;

    const prevOnlyMeat =
      prev.foodGroups.includes('MEAT') &&
      !prev.foodGroups.includes('FISH') &&
      !prev.foodGroups.includes('VEGETABLE');

    const currOnlyMeat =
      curr.foodGroups.includes('MEAT') &&
      !curr.foodGroups.includes('FISH') &&
      !curr.foodGroups.includes('VEGETABLE');

    if (prevOnlyMeat && currOnlyMeat) {
      warnings.push(
        `Ngày ${curr.date} tiếp tục chỉ có món thịt tương tự ngày ${prev.date}. Khuyến nghị bổ sung món cá hoặc rau để đảm bảo cân bằng dinh dưỡng.`
      );
    }
  }

  return {
    balanced: warnings.length === 0,
    warnings,
  };
}
