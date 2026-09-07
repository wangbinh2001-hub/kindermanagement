import { describe, it, expect } from 'vitest';
import {
  calculateGroceryBudget,
  validateGroceryBudgetMargin,
  checkMenuRepetition,
  evaluateDietaryBalance,
} from '../src/utils/nutrition';

describe('Nutrition Utility & Business Logic Tests', () => {
  describe('Grocery Budget Calculation & ±5,000 Margin Constraint', () => {
    it('calculates budget accurately from meal rates and utilities', () => {
      // Rates: 15k morning + 35k lunch + 15k afternoon = 65k/student/day.
      // 100 students for 20 days -> 65,000 * 100 = 6,500,000 VNĐ / day
      // Or monthly student count * total monthly rate:
      const budget = calculateGroceryBudget({
        mealRateMorning: 300000,
        mealRateLunch: 700000,
        mealRateAfternoon: 300000,
        studentCount: 50,
        gasCost: 1500000,
        electricityCost: 2000000,
      });

      // Total revenue = (300k + 700k + 300k) * 50 = 1,300,000 * 50 = 65,000,000 VNĐ
      // Utilities = 1.5M + 2.0M = 3,500,000 VNĐ
      // Expected = 65,000,000 - 3,500,000 = 61,500,000 VNĐ
      expect(budget).toBe(61500000);
    });

    it('enforces ±5,000 VNĐ margin constraint accurately', () => {
      const budget = 50000000;

      // Exact budget
      expect(validateGroceryBudgetMargin(budget, 50000000).valid).toBe(true);

      // Upper bound (+5,000)
      expect(validateGroceryBudgetMargin(budget, 50005000).valid).toBe(true);

      // Lower bound (-5,000)
      expect(validateGroceryBudgetMargin(budget, 49995000).valid).toBe(true);

      // Exceeded upper bound by 1 đ
      const highRes = validateGroceryBudgetMargin(budget, 50005001);
      expect(highRes.valid).toBe(false);
      expect(highRes.message).toContain('vượt quá ngân sách cho phép');

      // Below lower bound by 1 đ
      const lowRes = validateGroceryBudgetMargin(budget, 49994999);
      expect(lowRes.valid).toBe(false);
      expect(lowRes.message).toContain('thấp hơn ngân sách cho phép');
    });
  });

  describe('Menu Repetition Rule (Quy tắc trùng thực đơn <= 4 ngày/tháng)', () => {
    it('allows identical combos up to 4 days', () => {
      const menus = [
        { date: '2026-09-01', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-08', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-15', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-22', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
      ];

      const result = checkMenuRepetition(menus);
      expect(result.isValid).toBe(true);
      expect(result.maxRepeatCount).toBe(4);
      expect(result.violations).toHaveLength(0);
    });

    it('flags violation when identical combo repeats 5 or more days in a month', () => {
      const menus = [
        { date: '2026-09-01', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-08', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-15', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-22', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' },
        { date: '2026-09-29', morningId: 'm1', lunchMainId: 'lm1', lunchSoupId: 'ls1', afternoonId: 'a1' }, // 5th time
      ];

      const result = checkMenuRepetition(menus);
      expect(result.isValid).toBe(false);
      expect(result.maxRepeatCount).toBe(5);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.dates).toHaveLength(5);
    });
  });

  describe('Dietary Balance Evaluation', () => {
    it('detects consecutive meat-only days and generates warnings', () => {
      const meals = [
        { date: '2026-09-01', foodGroups: ['MEAT'] as Array<'MEAT'> },
        { date: '2026-09-02', foodGroups: ['MEAT'] as Array<'MEAT'> },
      ];

      const res = evaluateDietaryBalance(meals);
      expect(res.balanced).toBe(false);
      expect(res.warnings).toHaveLength(1);
      expect(res.warnings[0]).toContain('Khuyến nghị bổ sung món cá hoặc rau');
    });

    it('considers meals balanced when meat is alternated with fish or vegetables', () => {
      const meals = [
        { date: '2026-09-01', foodGroups: ['MEAT', 'VEGETABLE'] as Array<'MEAT' | 'VEGETABLE'> },
        { date: '2026-09-02', foodGroups: ['FISH', 'VEGETABLE'] as Array<'FISH' | 'VEGETABLE'> },
        { date: '2026-09-03', foodGroups: ['MEAT', 'VEGETABLE'] as Array<'MEAT' | 'VEGETABLE'> },
      ];

      const res = evaluateDietaryBalance(meals);
      expect(res.balanced).toBe(true);
      expect(res.warnings).toHaveLength(0);
    });
  });
});
