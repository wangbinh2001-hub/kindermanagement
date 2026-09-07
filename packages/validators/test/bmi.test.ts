import { describe, it, expect } from 'vitest';
import { calculateBmi, getWhoBmiCategory } from '../src/utils/bmi.js';

describe('BMI & WHO Classification', () => {
  describe('calculateBmi', () => {
    it('calculates BMI correctly for standard values', () => {
      expect(calculateBmi(110, 20)).toBe(16.5); // 20 / (1.1)^2 = 16.5
      expect(calculateBmi(100, 16)).toBe(16.0);
      expect(calculateBmi(120, 25)).toBe(17.4); // ~17.36 -> 17.4
    });

    it('handles edge cases', () => {
      expect(calculateBmi(50, 3)).toBe(12.0);
      expect(calculateBmi(200, 100)).toBe(25.0);
    });
  });

  describe('getWhoBmiCategory', () => {
    it('classifies UNDERWEIGHT for low BMI', () => {
      const result = getWhoBmiCategory(12, 48, 'MALE');
      expect(result.category).toBe('UNDERWEIGHT');
      expect(result.reference).toBe('WHO 2006');
    });

    it('classifies NORMAL for typical preschool BMI', () => {
      const result = getWhoBmiCategory(16, 48, 'FEMALE');
      expect(result.category).toBe('NORMAL');
      expect(result.reference).toBe('WHO 2006');
    });

    it('classifies OVERWEIGHT for elevated BMI', () => {
      const result = getWhoBmiCategory(19, 60, 'MALE');
      expect(result.category).toBe('OVERWEIGHT');
      expect(result.reference).toBe('WHO 2007'); // 60 months = 5 years -> WHO 2007
    });

    it('classifies OBESE for high BMI', () => {
      const result = getWhoBmiCategory(22, 72, 'FEMALE');
      expect(result.category).toBe('OBESE');
      expect(result.reference).toBe('WHO 2007');
    });

    it('uses WHO 2006 for children under 5 years (60 months)', () => {
      const result = getWhoBmiCategory(15, 59, 'MALE');
      expect(result.reference).toBe('WHO 2006');
    });

    it('uses WHO 2007 for children 5 years and older (60+ months)', () => {
      const result = getWhoBmiCategory(15, 60, 'MALE');
      expect(result.reference).toBe('WHO 2007');
    });

    it('handles OTHER gender the same as default', () => {
      const result = getWhoBmiCategory(16, 48, 'OTHER');
      expect(result.category).toBe('NORMAL');
    });
  });
});